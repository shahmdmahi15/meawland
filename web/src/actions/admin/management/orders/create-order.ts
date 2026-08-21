"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { generateId } from "@/lib/generate-code";
import { sendEmail } from "@/lib/mail";
import { triggerOrderPlacedSms } from "@/actions/admin/support-marketing/marketing/sms/automations";
import { triggerOrderPlacedEmail } from "@/actions/admin/support-marketing/marketing/email/automations";
import {
  getDeliveryFee,
  isDhakaDistrict,
  DELIVERY_FEE_INSIDE_DHAKA,
  DELIVERY_FEE_OUTSIDE_DHAKA,
} from "@/constants/cart";
import {
  createAdminOrderSchema,
  type CreateAdminOrderInput,
} from "@/schemas/admin/management/orders/order";
import { getImageBase64 } from "@/lib/storage";
import { Coupon } from "@/generated/prisma/client";
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
  StockEventType,
  Role,
  Category,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";

export type OrderFormDataCustomer = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  district: string | null;
  address: string | null;
  code: string;
};

export type OrderFormDataProduct = {
  id: string;
  name: string;
  code: string;
  sku: string;
  image: string;
  isVariable: boolean;
  costPrice: string | null;
  regularPrice: string | null;
  salePrice: string | null;
  stock: number | null;
  category: Category;
  subCategoryName: string;
  brandName: string | null;
  variants: Array<{
    id: string;
    sku: string;
    image: string;
    costPrice: string;
    regularPrice: string;
    salePrice: string;
    stock: number;
    attributes: Array<{
      id: string;
      type: string;
      name: string;
      value: string;
    }>;
  }>;
};

export type OrderFormDataCombo = {
  id: string;
  name: string;
  code: string;
  sku: string;
  image: string;
  regularPrice: string | null;
  salePrice: string | null;
  costPrice: number;
  availableStock: number;
  productsCount: number;
  variantsCount: number;
};

export type OrderFormDataCoupon = {
  id: string;
  name: string;
  couponCode: string;
  discount: string | null;
  discountType: string;
  minOrder: string | null;
  minPurchaseAmount: string | null;
  expiresAt: Date;
};

export type NewOrderFormData = {
  customers: OrderFormDataCustomer[];
  products: OrderFormDataProduct[];
  combos: OrderFormDataCombo[];
  coupons: OrderFormDataCoupon[];
};

export async function safeGetImageBase64(
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

/**
 * Loads catalog data for creating manual / POS orders in Admin.
 */
export async function getNewOrderFormDataAction(): Promise<{
  success: boolean;
  message?: string;
  data?: NewOrderFormData;
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.OWNER)
    ) {
      return {
        success: false,
        message: "Unauthorized. Admin access required.",
      };
    }

    const [rawCustomers, rawProducts, rawCombos, rawCoupons] =
      await Promise.all([
        db.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            district: true,
            address: true,
            code: true,
          },
          orderBy: { name: "asc" },
        }),
        db.product.findMany({
          include: {
            subCategory: {
              select: {
                name: true,
                category: true,
              },
            },
            brand: {
              select: {
                name: true,
              },
            },
            variants: {
              include: {
                attributes: true,
              },
            },
          },
          orderBy: { name: "asc" },
        }),
        db.comboProduct.findMany({
          include: {
            products: true,
            variants: {
              include: {
                product: true,
              },
            },
          },
          orderBy: { name: "asc" },
        }),
        db.coupon.findMany({
          where: {
            expiresAt: { gt: new Date() },
          },
          select: {
            id: true,
            name: true,
            couponCode: true,
            discount: true,
            discountType: true,
            minOrder: true,
            minPurchaseAmount: true,
            expiresAt: true,
          },
        }),
      ]);

    const customers: OrderFormDataCustomer[] = rawCustomers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      district: u.district,
      address: u.address,
      code: u.code,
    }));

    const products: OrderFormDataProduct[] = await Promise.all(
      rawProducts.map(async (p) => {
        const mainImage = await safeGetImageBase64(p.image);
        const variants = await Promise.all(
          p.variants.map(async (v) => {
            const vImage = await safeGetImageBase64(v.image || p.image);
            return {
              id: v.id,
              sku: v.sku,
              image: vImage || mainImage || "",
              costPrice: v.costPrice,
              regularPrice: v.regularPrice,
              salePrice: v.salePrice,
              stock: v.stock,
              attributes: v.attributes.map((a) => ({
                id: a.id,
                type: a.type,
                name: a.name,
                value: a.value,
              })),
            };
          }),
        );

        return {
          id: p.id,
          name: p.name,
          code: p.code,
          sku: p.sku,
          image: mainImage || "",
          isVariable: p.isVariable,
          costPrice: p.costPrice,
          regularPrice: p.regularPrice,
          salePrice: p.salePrice,
          stock: p.stock,
          category: p.subCategory.category,
          subCategoryName: p.subCategory.name,
          brandName: p.brand?.name || null,
          variants,
        };
      }),
    );

    const combos: OrderFormDataCombo[] = await Promise.all(
      rawCombos.map(async (cb) => {
        const cbImage = await safeGetImageBase64(cb.image);

        // Calculate procurement cost for combo
        const productsCost = (cb.products || []).reduce(
          (sum, p) => sum + (parseFloat(p.costPrice || "0") || 0),
          0,
        );
        const variantsCost = (cb.variants || []).reduce(
          (sum, v) => sum + (parseFloat(v.costPrice || "0") || 0),
          0,
        );
        const costPrice = productsCost + variantsCost;

        // Available stock is min stock of all constituent items
        let minStock = 999999;
        if (cb.products.length === 0 && cb.variants.length === 0) {
          minStock = 0;
        }
        for (const p of cb.products) {
          minStock = Math.min(minStock, p.stock ?? 0);
        }
        for (const v of cb.variants) {
          minStock = Math.min(minStock, v.stock ?? 0);
        }

        return {
          id: cb.id,
          name: cb.name,
          code: cb.code,
          sku: cb.sku,
          image: cbImage || "",
          regularPrice: cb.regularPrice,
          salePrice: cb.salePrice,
          costPrice,
          availableStock: minStock === 999999 ? 0 : minStock,
          productsCount: cb.products.length,
          variantsCount: cb.variants.length,
        };
      }),
    );

    const coupons: OrderFormDataCoupon[] = rawCoupons.map((c) => ({
      id: c.id,
      name: c.name,
      couponCode: c.couponCode,
      discount: c.discount,
      discountType: c.discountType,
      minOrder: c.minOrder,
      minPurchaseAmount: c.minPurchaseAmount,
      expiresAt: c.expiresAt,
    }));

    return {
      success: true,
      data: {
        customers,
        products,
        combos,
        coupons,
      },
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Orders.GetNewOrderFormData] Error:",
      error,
    );
    return {
      success: false,
      message: "Failed to load order creation data.",
    };
  }
}

/**
 * Creates a manual / offline admin order with `type: OrderType.OTHER`.
 */
export async function createAdminOrderAction(
  rawInput: CreateAdminOrderInput,
): Promise<{
  success: boolean;
  message: string;
  orderId?: string;
  orderCode?: string;
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.OWNER)
    ) {
      return {
        success: false,
        message: "Unauthorized. Admin privileges required.",
      };
    }

    const parsed = createAdminOrderSchema.safeParse(rawInput);
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
      paymentStatus,
      orderStatus,
      customDeliveryFee,
      couponCode,
      customDiscount = 0,
      userId,
      items,
    } = parsed.data;

    if (!items || items.length === 0) {
      return {
        success: false,
        message: "Please add at least one item to create the order.",
      };
    }

    // 1. Fetch DB records for demanded items to verify stock and calculate owner costs
    const productDemandMap = new Map<string, number>();
    const variantDemandMap = new Map<string, number>();
    const productStockMap = new Map<string, number>();
    const variantStockMap = new Map<string, number>();
    const productNames = new Map<string, string>();
    const variantNames = new Map<string, string>();

    // Query all referenced products, variants, and combos
    const productIds = items
      .filter((i) => i.itemType === "PRODUCT" && i.productId)
      .map((i) => i.productId as string);
    const variantIds = items
      .filter((i) => i.itemType === "VARIANT" && i.variantId)
      .map((i) => i.variantId as string);
    const comboIds = items
      .filter((i) => i.itemType === "COMBO" && i.comboProductId)
      .map((i) => i.comboProductId as string);

    const [dbProducts, dbVariants, dbCombos] = await Promise.all([
      db.product.findMany({
        where: { id: { in: productIds } },
      }),
      db.variant.findMany({
        where: { id: { in: variantIds } },
        include: { product: true },
      }),
      db.comboProduct.findMany({
        where: { id: { in: comboIds } },
        include: {
          products: true,
          variants: { include: { product: true } },
        },
      }),
    ]);

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));
    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));
    const comboMap = new Map(dbCombos.map((c) => [c.id, c]));

    // Populate demand and stock maps
    for (const item of items) {
      const q = item.quantity;
      if (item.itemType === "VARIANT" && item.variantId) {
        const v = variantMap.get(item.variantId);
        if (!v) {
          return { success: false, message: `Variant not found: ${item.name}` };
        }
        variantDemandMap.set(v.id, (variantDemandMap.get(v.id) || 0) + q);
        variantStockMap.set(v.id, v.stock ?? 0);
        variantNames.set(
          v.id,
          v.product?.name ? `${v.product.name} (${v.sku})` : v.sku,
        );
      } else if (item.itemType === "PRODUCT" && item.productId) {
        const p = productMap.get(item.productId);
        if (!p) {
          return { success: false, message: `Product not found: ${item.name}` };
        }
        productDemandMap.set(p.id, (productDemandMap.get(p.id) || 0) + q);
        productStockMap.set(p.id, p.stock ?? 0);
        productNames.set(p.id, p.name);
      } else if (item.itemType === "COMBO" && item.comboProductId) {
        const cb = comboMap.get(item.comboProductId);
        if (!cb) {
          return { success: false, message: `Combo not found: ${item.name}` };
        }
        for (const p of cb.products || []) {
          productDemandMap.set(p.id, (productDemandMap.get(p.id) || 0) + q);
          productStockMap.set(p.id, p.stock ?? 0);
          productNames.set(p.id, p.name);
        }
        for (const v of cb.variants || []) {
          variantDemandMap.set(v.id, (variantDemandMap.get(v.id) || 0) + q);
          variantStockMap.set(v.id, v.stock ?? 0);
          variantNames.set(
            v.id,
            v.product?.name ? `${v.product.name} (${v.sku})` : v.sku,
          );
        }
      }
    }

    // Validate stocks
    for (const [pId, demanded] of productDemandMap.entries()) {
      const stock = productStockMap.get(pId) ?? 0;
      if (demanded > stock) {
        const pName = productNames.get(pId) || "Product";
        return {
          success: false,
          message: `Insufficient inventory: "${pName}" has only ${stock} available (${demanded} requested).`,
        };
      }
    }

    for (const [vId, demanded] of variantDemandMap.entries()) {
      const stock = variantStockMap.get(vId) ?? 0;
      if (demanded > stock) {
        const vName = variantNames.get(vId) || "Variant";
        return {
          success: false,
          message: `Insufficient inventory: "${vName}" has only ${stock} available (${demanded} requested).`,
        };
      }
    }

    // 2. Validate Coupon if provided
    let validatedCouponRecord: Coupon | null = null;
    let couponDiscountAmount = 0;
    let isCouponFreeDelivery = false;

    if (couponCode && couponCode.trim()) {
      const coupon = await db.coupon.findUnique({
        where: { couponCode: couponCode.trim() },
      });

      if (!coupon) {
        return {
          success: false,
          message: `Coupon "${couponCode}" does not exist.`,
        };
      }
      if (coupon.expiresAt < new Date()) {
        return {
          success: false,
          message: `Coupon "${couponCode}" has expired.`,
        };
      }
      if (
        coupon.maxRedemptions &&
        coupon.currentRedemptions >= coupon.maxRedemptions
      ) {
        return {
          success: false,
          message: `Coupon "${couponCode}" has reached maximum redemptions.`,
        };
      }

      validatedCouponRecord = coupon;
      if (coupon.discountType === "FREE_DELIVERY") {
        isCouponFreeDelivery = true;
      } else if (coupon.discountType === "FIXED" && coupon.discount) {
        couponDiscountAmount = parseFloat(coupon.discount) || 0;
      }
    }

    // 3. Pricing Math Calculations
    let totalItemsOriginalPrice = 0;
    let totalItemsLineDiscounts = 0;
    let totalOwnerProcurementCost = 0;
    let totalQuantity = 0;

    const lineCalculations = items.map((item) => {
      const unitPrice = item.unitPrice;
      const lineQuantity = item.quantity;
      const lineOriginalTotal = unitPrice * lineQuantity;
      const lineDiscount = item.discountCost || 0;
      const lineFinalTotal = Math.max(0, lineOriginalTotal - lineDiscount);

      let unitOwnerCost = 0;
      if (item.itemType === "VARIANT" && item.variantId) {
        const v = variantMap.get(item.variantId);
        unitOwnerCost = parseFloat(v?.costPrice || "0") || 0;
      } else if (item.itemType === "PRODUCT" && item.productId) {
        const p = productMap.get(item.productId);
        unitOwnerCost = parseFloat(p?.costPrice || "0") || 0;
      } else if (item.itemType === "COMBO" && item.comboProductId) {
        const cb = comboMap.get(item.comboProductId);
        const pCost = (cb?.products || []).reduce(
          (sum, p) => sum + (parseFloat(p.costPrice || "0") || 0),
          0,
        );
        const vCost = (cb?.variants || []).reduce(
          (sum, v) => sum + (parseFloat(v.costPrice || "0") || 0),
          0,
        );
        unitOwnerCost = pCost + vCost;
      }

      const lineOwnerCost =
        (item.totalCost > 0 ? item.totalCost : unitOwnerCost) * lineQuantity;

      totalItemsOriginalPrice += lineOriginalTotal;
      totalItemsLineDiscounts += lineDiscount;
      totalOwnerProcurementCost += lineOwnerCost;
      totalQuantity += lineQuantity;

      return {
        ...item,
        lineOriginalTotal,
        lineDiscount,
        lineFinalTotal,
        lineOwnerCost,
      };
    });

    // Subtotal after item-level discounts
    const subtotalAfterItemDiscounts = Math.max(
      0,
      totalItemsOriginalPrice - totalItemsLineDiscounts,
    );

    // Percentage coupon calculation
    if (
      validatedCouponRecord &&
      validatedCouponRecord.discountType === "PERCENTAGE" &&
      validatedCouponRecord.discount
    ) {
      const pct = parseFloat(validatedCouponRecord.discount) || 0;
      couponDiscountAmount = Math.round(
        (subtotalAfterItemDiscounts * pct) / 100,
      );
    }

    const totalDiscounts =
      totalItemsLineDiscounts + couponDiscountAmount + (customDiscount || 0);

    // Delivery Fee calculation
    let deliveryFee = 0;
    if (customDeliveryFee !== undefined && customDeliveryFee !== null) {
      deliveryFee = customDeliveryFee;
    } else {
      deliveryFee = getDeliveryFee(district, isCouponFreeDelivery);
    }

    const finalSubtotal = Math.max(0, totalItemsOriginalPrice - totalDiscounts);
    const grandFinalCost = finalSubtotal + deliveryFee;

    // Delivery expense incurred by owner when free delivery is granted
    const isDhaka = isDhakaDistrict(district);
    const actualCourierExpense = isDhaka
      ? DELIVERY_FEE_INSIDE_DHAKA
      : DELIVERY_FEE_OUTSIDE_DHAKA;
    const ownerDeliveryExpense = deliveryFee === 0 ? actualCourierExpense : 0;
    const totalOrderOwnerCost =
      totalOwnerProcurementCost + ownerDeliveryExpense;

    // 4. Database Transaction
    const newOrder = await db.$transaction(async (tx) => {
      // 4a. User Resolution / Creation
      let orderUserId: string | null = userId || null;

      if (orderUserId) {
        await tx.user.update({
          where: { id: orderUserId },
          data: {
            name: name || undefined,
            phone: phone || undefined,
            district: district || undefined,
            address: address || undefined,
          },
        });
      } else {
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
          const customerCode = await generateId("CUSTOMER", tx);
          const createdUser = await tx.user.create({
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
          orderUserId = createdUser.id;
        }
      }

      // 4b. Generate Order Code
      const orderCode = await generateId("ORDER", tx);

      // 4c. Create Order Record
      const createdOrder = await tx.order.create({
        data: {
          code: orderCode,
          totalQuantity,
          totalPrice: totalItemsOriginalPrice.toString(),
          totalCost: totalOrderOwnerCost.toString(),
          discountCost: totalDiscounts.toString(),
          finalCost: grandFinalCost.toString(),
          name,
          email,
          phone,
          address,
          district,
          note: note || null,
          paymentMethod,
          paymentStatus,
          status: orderStatus,
          type: OrderType.OTHER,
          userId: orderUserId,
        },
      });

      // 4d. Create Order Items
      for (const item of lineCalculations) {
        await tx.orderItem.create({
          data: {
            orderId: createdOrder.id,
            productId: item.productId || null,
            variantId: item.variantId || null,
            comboProductId: item.comboProductId || null,
            quanitity: item.quantity,
            unitPrice: item.unitPrice.toString(),
            totalCost: item.lineOwnerCost.toString(),
            discountCost: item.lineDiscount.toString(),
            finalCost: item.lineFinalTotal.toString(),
            status: orderStatus,
          },
        });
      }

      // 4e. Inventory stock decrement & stock event logs for variants
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
            reason: `Admin Order ${orderCode}`,
            note: `Manual order created via Admin POS (${orderCode}) for ${name}`,
            variantId: vId,
          },
        });
      }

      // 4f. Inventory stock decrement & stock event logs for products
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
            reason: `Admin Order ${orderCode}`,
            note: `Manual order created via Admin POS (${orderCode}) for ${name}`,
            productId: pId,
          },
        });
      }

      // 4g. Increment coupon usage count if used
      if (validatedCouponRecord) {
        await tx.coupon.update({
          where: { id: validatedCouponRecord.id },
          data: {
            currentRedemptions: { increment: 1 },
          },
        });
      }

      return createdOrder;
    });

    // Revalidate paths
    revalidatePath("/admin/management/orders/all-orders");
    revalidatePath("/admin/management/orders/other-orders");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory/modify-stock");

    // Send automated order confirmation email to customer
    if (email) {
      triggerOrderPlacedEmail({
        id: newOrder.id,
        code: newOrder.code,
        email,
        name,
        grandTotal: grandFinalCost.toString(),
        paymentMethod:
          paymentMethod === PaymentMethod.COD ? "Cash on Delivery" : "bKash",
        paymentStatus,
        shippingAddress: `${address}, ${district}`,
        deliveryFee: deliveryFee.toString(),
        discount: totalDiscount.toString(),
        userId: newOrder.userId,
      }).catch((err) => {
        console.error(
          "[Action.Admin.Management.Orders.CreateOrder] Email failure:",
          err,
        );
      });
    }

    // Send automated order confirmation SMS to customer
    if (newOrder.phone) {
      triggerOrderPlacedSms({
        id: newOrder.id,
        code: newOrder.code,
        phone: newOrder.phone,
        name: newOrder.name,
        finalCost: grandFinalCost.toString(),
        userId: newOrder.userId,
      }).catch((err) => {
        console.error(
          "[Action.Admin.Management.Orders.CreateOrder] SMS notification failure:",
          err,
        );
      });
    }

    // Record Audit Log for forensic order tracking
    await recordAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.ORDER,
      entityId: newOrder.id,
      entityName: `Order #${newOrder.code}`,
      summary: `Manual Order #${newOrder.code} created for customer ${name} (${phone}). Total: ৳${grandFinalCost}`,
      severity: AuditSeverity.INFO,
      newState: {
        code: newOrder.code,
        name,
        phone,
        district,
        grandTotal: grandFinalCost,
        paymentMethod,
        itemsCount: lineCalculations.length,
      },
      userId: currentAdmin.id,
      path: "/admin/management/orders/new-order",
    });

    return {
      success: true,
      message: `Order #${newOrder.code} created successfully!`,
      orderId: newOrder.id,
      orderCode: newOrder.code,
    };
  } catch (error) {
    console.error(
      "[Action.Admin.Management.Orders.CreateAdminOrder] Error:",
      error,
    );
    return {
      success: false,
      message: "Failed to create order. Please check inputs and try again.",
    };
  }
}
