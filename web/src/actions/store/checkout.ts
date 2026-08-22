"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { getCartAction, CartData } from "@/actions/store/cart";
import { validateStoreCouponAction } from "@/actions/store/coupon";
import { generateId } from "@/lib/generate-code";
import {
  getDeliveryFee,
  isDhakaDistrict,
  DELIVERY_FEE_INSIDE_DHAKA,
  DELIVERY_FEE_OUTSIDE_DHAKA,
} from "@/constants/cart";
import {
  placeOrderSchema,
  type PlaceOrderInput,
} from "@/schemas/store/checkout";
import { getImageBase64 } from "@/lib/storage";
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  StockEventType,
  Role,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import { createBkashPaymentAction } from "@/actions/bkash/create-payment";
import { triggerOrderPlacedSms } from "@/actions/admin/support-marketing/marketing/sms/automations";
import { triggerOrderPlacedEmail } from "@/actions/admin/support-marketing/marketing/email/automations";
import { trackMetaPurchaseAction } from "@/actions/meta";
import { revalidatePath } from "next/cache";

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  if (
    key.startsWith("data:") ||
    key.startsWith("http://") ||
    key.startsWith("https://") ||
    key.startsWith("/")
  ) {
    return key;
  }
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.error(`[Storage.GetBase64] Failed for key "${key}":`, error);
    return "";
  }
}

export type UserCheckoutProfile = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  district: string;
  address: string;
};

export type CheckoutInitialData = {
  cart: CartData;
  userProfile: UserCheckoutProfile | null;
  isGuest: boolean;
};

/**
 * Retrieves cart and profile information for the checkout page.
 */
export async function getCheckoutInitialDataAction(): Promise<{
  success: boolean;
  message?: string;
  data?: CheckoutInitialData;
}> {
  try {
    const [cart, sessionUser] = await Promise.all([
      getCartAction(),
      getMeAction(),
    ]);

    let userProfile: UserCheckoutProfile | null = null;
    let isGuest = true;

    if (sessionUser) {
      isGuest = false;
      const fullUser = await db.user.findUnique({
        where: { id: sessionUser.id },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          district: true,
          address: true,
        },
      });

      if (fullUser) {
        userProfile = {
          id: fullUser.id,
          name: fullUser.name || "",
          email: fullUser.email || "",
          phone: fullUser.phone || "",
          district: fullUser.district || "Dhaka",
          address: fullUser.address || "",
        };
      }
    }

    return {
      success: true,
      data: {
        cart,
        userProfile,
        isGuest,
      },
    };
  } catch (error) {
    console.error("[Action.Store.Checkout.GetInitialData] Error:", error);
    return {
      success: false,
      message: "Failed to initialize checkout data.",
    };
  }
}

export type PlaceOrderResult = {
  success: boolean;
  message: string;
  orderId?: string;
  orderCode?: string;
  bkashURL?: string;
};

/**
 * Validates inventory, computes discounts/fees, registers/links user account,
 * decrements stock, registers stock events, and commits the order.
 */
export async function placeOrderAction(
  rawInput: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  try {
    const parsed = placeOrderSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message:
          parsed.error.issues[0]?.message || "Invalid order information.",
      };
    }

    const {
      name,
      email,
      phone,
      district,
      address,
      note,
      paymentMethod,
      couponCode,
    } = parsed.data;

    // 1. Resolve current active cart
    const cart = await getCartAction();
    if (!cart || cart.items.length === 0) {
      return {
        success: false,
        message: "Your shopping cart is empty. Please add items to checkout.",
      };
    }

    if (cart.isCheckoutDisabled) {
      return {
        success: false,
        message:
          cart.checkoutDisableReason ||
          "Some items in your cart cannot be checked out.",
      };
    }

    const sessionUser = await getMeAction();

    // 2. Fetch all cart items from DB with their live products, variants, and combos
    const dbCart = await db.cart.findUnique({
      where: { id: cart.id! },
      include: {
        cartItems: {
          include: {
            product: true,
            variant: {
              include: {
                product: true,
              },
            },
            comboProduct: {
              include: {
                products: true,
                variants: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!dbCart || dbCart.cartItems.length === 0) {
      return {
        success: false,
        message: "Cart not found or empty.",
      };
    }

    const orderUserId = sessionUser?.id || dbCart.userId || null;

    // 3. Pooled Stock Re-validation
    const productDemandMap = new Map<string, number>();
    const variantDemandMap = new Map<string, number>();
    const productStockMap = new Map<string, number>();
    const variantStockMap = new Map<string, number>();
    const productNames = new Map<string, string>();
    const variantNames = new Map<string, string>();

    for (const ci of dbCart.cartItems) {
      const q = ci.quanitity;
      if (ci.variant) {
        variantDemandMap.set(
          ci.variant.id,
          (variantDemandMap.get(ci.variant.id) || 0) + q,
        );
        variantStockMap.set(ci.variant.id, ci.variant.stock ?? 0);
        variantNames.set(
          ci.variant.id,
          ci.variant.product?.name
            ? `${ci.variant.product.name} (${ci.variant.sku})`
            : ci.variant.sku,
        );
      } else if (ci.product) {
        productDemandMap.set(
          ci.product.id,
          (productDemandMap.get(ci.product.id) || 0) + q,
        );
        productStockMap.set(ci.product.id, ci.product.stock ?? 0);
        productNames.set(ci.product.id, ci.product.name);
      } else if (ci.comboProduct) {
        for (const p of ci.comboProduct.products || []) {
          productDemandMap.set(p.id, (productDemandMap.get(p.id) || 0) + q);
          productStockMap.set(p.id, p.stock ?? 0);
          productNames.set(p.id, p.name);
        }
        for (const v of ci.comboProduct.variants || []) {
          variantDemandMap.set(v.id, (variantDemandMap.get(v.id) || 0) + q);
          variantStockMap.set(v.id, v.stock ?? 0);
          variantNames.set(
            v.id,
            v.product?.name ? `${v.product.name} (${v.sku})` : v.sku,
          );
        }
      }
    }

    for (const [pId, demanded] of productDemandMap.entries()) {
      const stock = productStockMap.get(pId) ?? 0;
      if (demanded > stock) {
        const pName = productNames.get(pId) || "Product";
        return {
          success: false,
          message: `Cannot place order: "${pName}" is out of stock (${demanded} requested across items/bundles, only ${stock} available).`,
        };
      }
    }

    for (const [vId, demanded] of variantDemandMap.entries()) {
      const stock = variantStockMap.get(vId) ?? 0;
      if (demanded > stock) {
        const vName = variantNames.get(vId) || "Variant";
        return {
          success: false,
          message: `Cannot place order: "${vName}" is out of stock (${demanded} requested across items/bundles, only ${stock} available).`,
        };
      }
    }

    // 4. Coupon Validation (if provided)
    let validatedCoupon: {
      id: string;
      discountAmount: number;
      isFreeDelivery: boolean;
      couponCode: string;
    } | null = null;

    if (couponCode && couponCode.trim()) {
      const couponRes = await validateStoreCouponAction({
        code: couponCode.trim(),
        subtotal: cart.subtotal,
        userId: sessionUser?.id,
        categoryEnums: [],
        subCategoryIds: [],
        brandIds: [],
        productIds: cart.items
          .map((i) => i.productId)
          .filter(Boolean) as string[],
        variantIds: cart.items
          .map((i) => i.variantId)
          .filter(Boolean) as string[],
        comboProductIds: cart.items
          .map((i) => i.comboProductId)
          .filter(Boolean) as string[],
        totalItemsCount: cart.itemCount,
      });

      if (!couponRes.isValid || !couponRes.coupon) {
        return {
          success: false,
          message: couponRes.message || "Invalid coupon code.",
        };
      }

      validatedCoupon = {
        id: couponRes.coupon.id,
        discountAmount: couponRes.coupon.discountAmount,
        isFreeDelivery: couponRes.coupon.isFreeDelivery,
        couponCode: couponRes.coupon.couponCode,
      };
    }

    // 5. Calculate Final Pricing Metrics & Owner Costs
    const subtotal = cart.subtotal;
    const originalSubtotal = cart.originalSubtotal;
    const campaignDiscount = cart.totalDiscount;
    const couponDiscount = validatedCoupon ? validatedCoupon.discountAmount : 0;
    const totalDiscount = campaignDiscount + couponDiscount;

    const isFreeDelivery =
      cart.isFreeDelivery ||
      (validatedCoupon ? validatedCoupon.isFreeDelivery : false);
    const deliveryFee = getDeliveryFee(district, isFreeDelivery);

    const finalSubtotalAfterCoupon = Math.max(0, subtotal - couponDiscount);
    const grandFinalCost = finalSubtotalAfterCoupon + deliveryFee;

    // Calculate Owner Procurement / Inventory Cost
    let totalOwnerInventoryCost = 0;
    const itemOwnerCostMap = new Map<string, number>();

    for (const ci of dbCart.cartItems) {
      let itemOwnerUnitCost = 0;

      if (ci.variant) {
        itemOwnerUnitCost = parseFloat(ci.variant.costPrice || "0") || 0;
      } else if (ci.product) {
        itemOwnerUnitCost = parseFloat(ci.product.costPrice || "0") || 0;
      } else if (ci.comboProduct) {
        const productsCost = (ci.comboProduct.products || []).reduce(
          (sum, p) => sum + (parseFloat(p.costPrice || "0") || 0),
          0,
        );
        const variantsCost = (ci.comboProduct.variants || []).reduce(
          (sum, v) => sum + (parseFloat(v.costPrice || "0") || 0),
          0,
        );
        itemOwnerUnitCost = productsCost + variantsCost;
      }

      const lineOwnerCost = itemOwnerUnitCost * ci.quanitity;
      itemOwnerCostMap.set(ci.id, lineOwnerCost);
      totalOwnerInventoryCost += lineOwnerCost;
    }

    // When delivery is free for the customer, the owner incurs the courier delivery fee out of pocket
    const isDhaka = isDhakaDistrict(district);
    const actualCourierExpense = isDhaka
      ? DELIVERY_FEE_INSIDE_DHAKA
      : DELIVERY_FEE_OUTSIDE_DHAKA;
    const ownerDeliveryExpense = isFreeDelivery ? actualCourierExpense : 0;
    const ownerTotalOrderCost = totalOwnerInventoryCost + ownerDeliveryExpense;

    // 6. Execute Order Transaction
    const result = await db.$transaction(async (tx) => {
      // 6a. User Resolution / Creation
      let orderUserId: string | null = null;

      if (sessionUser) {
        orderUserId = sessionUser.id;
        // Update user address/phone/district if missing
        await tx.user.update({
          where: { id: sessionUser.id },
          data: {
            name: name || undefined,
            phone: phone || undefined,
            district: district || undefined,
            address: address || undefined,
          },
        });
      } else {
        // Guest Checkout: check if user with this email already exists
        const existingUser = await tx.user.findUnique({
          where: { email },
        });

        if (existingUser) {
          orderUserId = existingUser.id;
          await tx.user.update({
            where: { id: existingUser.id },
            data: {
              name: existingUser.name || name,
              phone: existingUser.phone || phone,
              district: existingUser.district || district,
              address: existingUser.address || address,
            },
          });
        } else {
          // Create new user account for guest
          const customerCode = await generateId("CUSTOMER", tx);
          const newUser = await tx.user.create({
            data: {
              code: customerCode,
              name,
              email,
              phone,
              district,
              address,
              role: Role.USER,
            },
          });
          orderUserId = newUser.id;
        }
      }

      // 6b. Generate Order Code
      const orderCode = await generateId("ORDER", tx);

      // 6c. Create Order Record
      const newOrder = await tx.order.create({
        data: {
          code: orderCode,
          totalQuantity: cart.itemCount,
          totalPrice: originalSubtotal.toString(),
          totalCost: ownerTotalOrderCost.toString(),
          discountCost: totalDiscount.toString(),
          finalCost: grandFinalCost.toString(),
          name,
          email,
          phone,
          address,
          district,
          note: note || null,
          paymentMethod,
          paymentStatus: PaymentStatus.PENDING,
          status: OrderStatus.PENDING,
          type: OrderType.WEB,
          userId: orderUserId,
        },
      });

      // 6d. Create Order Items & Decrement Inventory with StockEvents
      for (const item of cart.items) {
        const lineOwnerCost = itemOwnerCostMap.get(item.id) || 0;
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.productId || null,
            variantId: item.variantId || null,
            comboProductId: item.comboProductId || null,
            quanitity: item.quantity,
            unitPrice: item.unitOriginalPrice.toString(),
            totalCost: lineOwnerCost.toString(),
            discountCost: item.lineDiscount.toString(),
            finalCost: item.lineTotal.toString(),
            status: OrderStatus.PENDING,
          },
        });
      }

      // Inventory decrement & stock events for direct variants
      for (const [vId, demanded] of variantDemandMap.entries()) {
        const currentStock = variantStockMap.get(vId) ?? 0;
        const newStock = Math.max(0, currentStock - demanded);

        await tx.variant.update({
          where: { id: vId },
          data: { stock: newStock },
        });

        await tx.stockEvent.create({
          data: {
            type: StockEventType.DECREASE,
            quantity: demanded,
            previousStock: currentStock,
            newStock,
            reason: `Order ${orderCode}`,
            note: `Sold in order ${orderCode} to ${name} (${email})`,
            variantId: vId,
          },
        });
      }

      // Inventory decrement & stock events for direct products
      for (const [pId, demanded] of productDemandMap.entries()) {
        const currentStock = productStockMap.get(pId) ?? 0;
        const newStock = Math.max(0, currentStock - demanded);

        await tx.product.update({
          where: { id: pId },
          data: { stock: newStock },
        });

        await tx.stockEvent.create({
          data: {
            type: StockEventType.DECREASE,
            quantity: demanded,
            previousStock: currentStock,
            newStock,
            reason: `Order ${orderCode}`,
            note: `Sold in order ${orderCode} to ${name} (${email})`,
            productId: pId,
          },
        });
      }

      // 6e. Increment Coupon Redemption Count
      if (validatedCoupon) {
        await tx.coupon.update({
          where: { id: validatedCoupon.id },
          data: {
            currentRedemptions: { increment: 1 },
          },
        });
      }

      // 6f. Create Payment Record
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          userId: orderUserId,
          amount: grandFinalCost.toString(),
          currency: "BDT",
          paymentMethod,
          status: PaymentStatus.PENDING,
        },
      });

      // 6g. Clear the cart
      await tx.cartItem.deleteMany({
        where: { cartId: dbCart.id },
      });

      return newOrder;
    });

    // 7. Post-transaction Actions (Revalidate & Handling)
    revalidatePath("/cart");
    revalidatePath("/checkout");
    revalidatePath("/");

    // 8. Handle bKash Gateway Payment Redirection
    if (paymentMethod === PaymentMethod.BKASH) {
      const bkashRes = await createBkashPaymentAction({
        amount: grandFinalCost.toFixed(2),
        merchantInvoiceNumber: result.code,
        payerReference: phone,
      });

      if (bkashRes.success && bkashRes.data?.bkashURL) {
        // Save bKash metadata into the Payment record
        await db.payment.update({
          where: { orderId: result.id },
          data: {
            paymentID: bkashRes.data.paymentID,
            statusCode: bkashRes.data.statusCode,
            statusMessage: bkashRes.data.statusMessage,
            paymentCreateTime: bkashRes.data.paymentCreateTime,
            transactionStatus: bkashRes.data.transactionStatus,
            rawResponse: bkashRes.data as object,
          },
        });

        return {
          success: true,
          message: "Redirecting to bKash Secure Payment...",
          orderId: result.id,
          orderCode: result.code,
          bkashURL: bkashRes.data.bkashURL,
        };
      } else {
        console.error(
          "[Action.Store.Checkout.PlaceOrder] bKash payment creation failed:",
          bkashRes.message,
        );
        return {
          success: false,
          message:
            bkashRes.message ||
            "Failed to connect to bKash payment gateway. Please try again or select Cash on Delivery.",
          orderId: result.id,
          orderCode: result.code,
        };
      }
    }

    // Send automated order confirmation email asynchronously
    triggerOrderPlacedEmail({
      id: result.id,
      code: result.code,
      email,
      name,
      grandTotal: grandFinalCost.toString(),
      paymentMethod:
        paymentMethod === PaymentMethod.COD ? "Cash on Delivery" : "bKash",
      paymentStatus: PaymentStatus.PENDING,
      shippingAddress: `${address}, ${district}`,
      items: cart.items.map((i) => ({
        name: `${i.name}${i.variantTitle ? ` (${i.variantTitle})` : ""}`,
        quantity: i.quantity,
        price: i.lineTotal.toString(),
      })),
      subtotal: subtotal.toString(),
      deliveryFee: deliveryFee.toString(),
      discount: couponDiscount.toString(),
      userId: orderUserId,
    }).catch((err) => {
      console.error(
        "[Action.Store.Checkout] Failed to send order confirmation email:",
        err,
      );
    });

    // Send automated order confirmation SMS asynchronously
    triggerOrderPlacedSms({
      id: result.id,
      code: result.code,
      phone,
      name,
      finalCost: grandFinalCost.toString(),
      userId: orderUserId,
    }).catch((err) => {
      console.error(
        "[Action.Store.Checkout] Failed to send order confirmation SMS:",
        err,
      );
    });

    // 4. Meta Conversions API (Server CAPI) Purchase Event with deduplication
    trackMetaPurchaseAction({
      orderCode: result.code,
      totalValue: grandFinalCost,
      currency: "BDT",
      numItems: cart.items.reduce((s, i) => s + i.quantity, 0),
      deliveryFee,
      discount: couponDiscount,
      items: cart.items.map((i) => ({
        id: i.variantId || i.productId || i.comboProductId || i.id,
        name: i.name,
        price: i.unitPrice,
        quantity: i.quantity,
      })),
      customer: {
        email,
        phone,
        name,
        district,
        userId: orderUserId,
      },
      eventId: `purch_${result.code}`,
    }).catch((err) => {
      console.error("[Action.Store.Checkout] Meta CAPI Purchase error:", err);
    });

    // 5. Forensic Audit Log Entry
    await recordAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.ORDER,
      entityId: result.id,
      entityName: `Order #${result.code}`,
      summary: `Online storefront order #${result.code} placed by ${name} (${phone}) - BDT ${grandFinalCost} (${paymentMethod})`,
      severity: AuditSeverity.INFO,
      newState: {
        code: result.code,
        finalCost: grandFinalCost.toString(),
        paymentMethod,
        itemCount: cart.items.length,
        customer: { name, email, phone, district, address },
      },
      userId: orderUserId,
      path: "/checkout",
    });

    return {
      success: true,
      message: "Order placed successfully! 🐾",
      orderId: result.id,
      orderCode: result.code,
    };
  } catch (error) {
    console.error("[Action.Store.Checkout.PlaceOrder] Error:", error);
    return {
      success: false,
      message: "Failed to place order. Please try again or contact support.",
    };
  }
}

export type OrderConfirmationDetails = {
  id: string;
  code: string;
  totalQuantity: number;
  totalPrice: string;
  totalCost: string;
  discountCost: string;
  finalCost: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  district: string;
  note: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  type: OrderType;
  createdAt: Date;
  payment?: {
    trxID: string | null;
    paymentID: string | null;
    customerMsisdn: string | null;
    status: PaymentStatus;
    paymentExecuteTime: string | null;
  } | null;
  items: Array<{
    id: string;
    name: string;
    image: string;
    quantity: number;
    unitPrice: string;
    totalCost: string;
    discountCost: string;
    finalCost: string;
  }>;
};

/**
 * Retrieves order details by orderId for the success confirmation page.
 */
export async function getOrderConfirmationAction(orderId: string): Promise<{
  success: boolean;
  message?: string;
  order?: OrderConfirmationDetails;
}> {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        payment: {
          select: {
            trxID: true,
            paymentID: true,
            customerMsisdn: true,
            status: true,
            paymentExecuteTime: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                name: true,
                image: true,
              },
            },
            variant: {
              include: {
                product: {
                  select: {
                    name: true,
                    image: true,
                  },
                },
              },
            },
            comboProduct: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    const items = await Promise.all(
      order.orderItems.map(async (oi) => {
        let name = "Item";
        let imageKey: string | null = null;

        if (oi.variant) {
          name = `${oi.variant.product.name} (${oi.variant.sku})`;
          imageKey = oi.variant.image || oi.variant.product.image;
        } else if (oi.product) {
          name = oi.product.name;
          imageKey = oi.product.image;
        } else if (oi.comboProduct) {
          name = oi.comboProduct.name;
          imageKey = oi.comboProduct.image;
        }

        const image = await safeGetImageBase64(imageKey);

        return {
          id: oi.id,
          name,
          image,
          quantity: oi.quanitity,
          unitPrice: oi.unitPrice,
          totalCost: oi.totalCost,
          discountCost: oi.discountCost,
          finalCost: oi.finalCost,
        };
      }),
    );

    return {
      success: true,
      order: {
        id: order.id,
        code: order.code,
        totalQuantity: order.totalQuantity,
        totalPrice: order.totalPrice,
        totalCost: order.totalCost,
        discountCost: order.discountCost,
        finalCost: order.finalCost,
        name: order.name,
        email: order.email,
        phone: order.phone,
        address: order.address,
        district: order.district,
        note: order.note,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: order.status,
        type: order.type,
        createdAt: order.createdAt,
        payment: order.payment,
        items,
      },
    };
  } catch (error) {
    console.error("[Action.Store.Checkout.GetOrderConfirmation] Error:", error);
    return {
      success: false,
      message: "Failed to load order confirmation details.",
    };
  }
}
