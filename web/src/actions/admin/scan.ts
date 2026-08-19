"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  OrderStatus,
  StockEventType,
  PaymentMethod,
  PaymentStatus,
  OrderType,
} from "@/generated/prisma/enums";
import { generateId } from "@/lib/generate-code";
import { getImageBase64 } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import {
  BarcodeLookupResult,
  ScannedProductItem,
  ScannedOrderResult,
  ScannedCustomerResult,
  ScannedTicketResult,
  ScannedComboComponentItem,
  StockModifyInput,
  stockModifySchema,
  OrderReturnInput,
  orderReturnSchema,
  POSCheckoutInput,
  posCheckoutSchema,
  POSReceiptData,
} from "@/schemas/admin/scan";

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

/**
 * 1. Multi-Entity Omni Barcode Lookup Action (Supports Variants, Simple Products, Combos, Orders, Users, Tickets)
 */
export async function lookupBarcodeAction(barcode: string): Promise<{
  success: boolean;
  message?: string;
  result?: BarcodeLookupResult;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized access." };
    }

    const clean = barcode.trim();
    if (!clean) {
      return {
        success: false,
        message: "Please provide a valid barcode string.",
      };
    }

    // 1. Check Product Variant by SKU or ID
    const variantMatch = await db.variant.findFirst({
      where: {
        OR: [
          { sku: { equals: clean, mode: "insensitive" } },
          { id: { equals: clean } },
        ],
      },
      include: {
        product: {
          include: {
            subCategory: { select: { name: true } },
            brand: { select: { name: true } },
            variants: {
              include: { attributes: true },
            },
          },
        },
        attributes: true,
      },
    });

    if (variantMatch) {
      const thumb = await safeGetImageBase64(
        variantMatch.image || variantMatch.product.image,
      );
      const variantLabel = variantMatch.attributes
        .map((a) => `${a.name}: ${a.value}`)
        .join(", ");

      const availableVariants = await Promise.all(
        variantMatch.product.variants.map(async (v) => {
          const vThumb = await safeGetImageBase64(
            v.image || variantMatch.product.image,
          );
          const label =
            v.attributes.map((a) => `${a.name}: ${a.value}`).join(", ") ||
            v.sku;
          return {
            id: v.id,
            sku: v.sku,
            regularPrice: v.regularPrice,
            salePrice: v.salePrice,
            stock: v.stock,
            attributes: v.attributes.map((a) => ({
              name: a.name,
              value: a.value,
            })),
            label,
            thumbnail: vThumb || null,
          };
        }),
      );

      const product: ScannedProductItem = {
        id: variantMatch.product.id,
        variantId: variantMatch.id,
        code: variantMatch.product.code,
        name: variantMatch.product.name,
        sku: variantMatch.sku,
        regularPrice: variantMatch.regularPrice,
        salePrice: variantMatch.salePrice,
        stock: variantMatch.stock,
        isVariable: true,
        categoryName: variantMatch.product.subCategory.name,
        brandName: variantMatch.product.brand?.name || null,
        thumbnail: thumb || null,
        variantLabel: variantLabel || "Variant",
        availableVariants,
      };

      return {
        success: true,
        result: {
          barcode: clean,
          entityType: "PRODUCT",
          product,
        },
      };
    }

    // 2. Check Simple / Master Product by Code, SKU, or ID
    const productMatch = await db.product.findFirst({
      where: {
        OR: [
          { code: { equals: clean, mode: "insensitive" } },
          { sku: { equals: clean, mode: "insensitive" } },
          { id: { equals: clean } },
        ],
      },
      include: {
        subCategory: { select: { name: true } },
        brand: { select: { name: true } },
        variants: {
          include: { attributes: true },
        },
      },
    });

    if (productMatch) {
      const thumb = await safeGetImageBase64(productMatch.image);

      if (productMatch.isVariable && productMatch.variants.length > 0) {
        const availableVariants = await Promise.all(
          productMatch.variants.map(async (v) => {
            const vThumb = await safeGetImageBase64(
              v.image || productMatch.image,
            );
            const label =
              v.attributes.map((a) => `${a.name}: ${a.value}`).join(", ") ||
              v.sku;
            return {
              id: v.id,
              sku: v.sku,
              regularPrice: v.regularPrice,
              salePrice: v.salePrice,
              stock: v.stock,
              attributes: v.attributes.map((a) => ({
                name: a.name,
                value: a.value,
              })),
              label,
              thumbnail: vThumb || null,
            };
          }),
        );

        const firstVar = availableVariants[0];

        const product: ScannedProductItem = {
          id: productMatch.id,
          code: productMatch.code,
          name: productMatch.name,
          sku: firstVar.sku,
          variantId: firstVar.id,
          variantLabel: firstVar.label,
          regularPrice: firstVar.regularPrice,
          salePrice: firstVar.salePrice,
          stock: firstVar.stock,
          isVariable: true,
          categoryName: productMatch.subCategory.name,
          brandName: productMatch.brand?.name || null,
          thumbnail: firstVar.thumbnail || thumb || null,
          availableVariants,
        };

        return {
          success: true,
          result: {
            barcode: clean,
            entityType: "PRODUCT",
            product,
          },
        };
      }

      // Simple / Non-variable product
      const product: ScannedProductItem = {
        id: productMatch.id,
        code: productMatch.code,
        name: productMatch.name,
        sku: productMatch.sku,
        regularPrice: productMatch.regularPrice || "0",
        salePrice: productMatch.salePrice || null,
        stock: productMatch.stock ?? 0,
        isVariable: false,
        categoryName: productMatch.subCategory.name,
        brandName: productMatch.brand?.name || null,
        thumbnail: thumb || null,
      };

      return {
        success: true,
        result: {
          barcode: clean,
          entityType: "PRODUCT",
          product,
        },
      };
    }

    // 3. Check Combo Bundle Product by Code, SKU, ID, or Slug
    const comboMatch = await db.comboProduct.findFirst({
      where: {
        OR: [
          { code: { equals: clean, mode: "insensitive" } },
          { sku: { equals: clean, mode: "insensitive" } },
          { id: { equals: clean } },
          { slug: { equals: clean, mode: "insensitive" } },
        ],
      },
      include: {
        products: {
          select: { id: true, name: true, sku: true, stock: true, image: true },
        },
        variants: {
          include: {
            product: { select: { name: true } },
            attributes: true,
          },
        },
      },
    });

    if (comboMatch) {
      const thumb = await safeGetImageBase64(comboMatch.image);

      const comboItems: ScannedComboComponentItem[] = [
        ...comboMatch.products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          stock: p.stock ?? 0,
          isVariant: false,
          thumbnail: null,
        })),
        ...comboMatch.variants.map((v) => ({
          id: v.id,
          name: `${v.product.name} (${v.attributes.map((a) => a.value).join(", ")})`,
          sku: v.sku,
          stock: v.stock,
          isVariant: true,
          variantLabel: v.attributes
            .map((a) => `${a.name}: ${a.value}`)
            .join(", "),
          thumbnail: null,
        })),
      ];

      // Calculate bundle capacity based on limiting child item stock
      const allStocks = [
        ...comboMatch.products.map((p) => p.stock ?? 0),
        ...comboMatch.variants.map((v) => v.stock),
      ];
      const bundleCapacity = allStocks.length > 0 ? Math.min(...allStocks) : 0;

      const product: ScannedProductItem = {
        id: comboMatch.id,
        code: comboMatch.code,
        name: comboMatch.name,
        sku: comboMatch.sku,
        regularPrice: comboMatch.regularPrice || "0",
        salePrice: comboMatch.salePrice || null,
        stock: bundleCapacity,
        isVariable: false,
        isCombo: true,
        categoryName: "Combo Deals & Bundles",
        brandName: "Meawland Combo",
        thumbnail: thumb || null,
        comboItems,
      };

      return {
        success: true,
        result: {
          barcode: clean,
          entityType: "PRODUCT",
          product,
        },
      };
    }

    // 4. Check Order by Code or ID
    const orderMatch = await db.order.findFirst({
      where: {
        OR: [
          { code: { equals: clean, mode: "insensitive" } },
          { id: { equals: clean } },
        ],
      },
      include: {
        orderItems: {
          include: {
            product: { select: { name: true, image: true, sku: true } },
            variant: {
              include: {
                attributes: true,
              },
            },
            comboProduct: {
              select: { name: true, image: true, sku: true },
            },
          },
        },
      },
    });

    if (orderMatch) {
      const items = await Promise.all(
        orderMatch.orderItems.map(async (item) => {
          const imgKey =
            item.comboProduct?.image ||
            item.variant?.image ||
            item.product?.image;
          const thumb = await safeGetImageBase64(imgKey);
          const variantLabel = item.variant?.attributes
            ?.map((a) => `${a.name}: ${a.value}`)
            .join(", ");

          return {
            id: item.id,
            productId: item.productId || item.comboProductId || "",
            variantId: item.variantId || null,
            comboProductId: item.comboProductId || null,
            isCombo: !!item.comboProductId,
            productName:
              item.comboProduct?.name || item.product?.name || "Product",
            sku:
              item.comboProduct?.sku ||
              item.variant?.sku ||
              item.product?.sku ||
              "N/A",
            quantity: item.quanitity,
            unitPrice: item.unitPrice,
            finalCost: item.finalCost,
            thumbnail: thumb || null,
            variantLabel,
          };
        }),
      );

      const order: ScannedOrderResult = {
        id: orderMatch.id,
        code: orderMatch.code,
        customerName: orderMatch.name,
        customerEmail: orderMatch.email,
        customerPhone: orderMatch.phone,
        address: orderMatch.address,
        district: orderMatch.district,
        finalCost: orderMatch.finalCost,
        totalQuantity: orderMatch.totalQuantity,
        status: orderMatch.status,
        paymentMethod: orderMatch.paymentMethod,
        paymentStatus: orderMatch.paymentStatus,
        type: orderMatch.type,
        createdAt: orderMatch.createdAt,
        items,
      };

      return {
        success: true,
        result: {
          barcode: clean,
          entityType: "ORDER",
          order,
        },
      };
    }

    // 5. Check Customer User by Code, Phone, or Email
    const customerMatch = await db.user.findFirst({
      where: {
        OR: [
          { code: { equals: clean, mode: "insensitive" } },
          { phone: { equals: clean } },
          { email: { equals: clean, mode: "insensitive" } },
        ],
      },
      include: {
        orders: { select: { finalCost: true } },
      },
    });

    if (customerMatch) {
      const avatar = await safeGetImageBase64(customerMatch.avatar);
      const totalSpent = customerMatch.orders.reduce(
        (sum, o) => sum + (parseFloat(o.finalCost || "0") || 0),
        0,
      );

      const customer: ScannedCustomerResult = {
        id: customerMatch.id,
        code: customerMatch.code,
        name: customerMatch.name,
        email: customerMatch.email,
        phone: customerMatch.phone,
        avatar: avatar || null,
        district: customerMatch.district,
        role: customerMatch.role,
        totalOrders: customerMatch.orders.length,
        lifetimeSpent: totalSpent,
        createdAt: customerMatch.createdAt,
      };

      return {
        success: true,
        result: {
          barcode: clean,
          entityType: "CUSTOMER",
          customer,
        },
      };
    }

    // 6. Check Support Ticket by Code
    const ticketMatch = await db.supportTicket.findFirst({
      where: {
        code: { equals: clean, mode: "insensitive" },
      },
      include: {
        user: { select: { name: true, phone: true } },
        order: { select: { code: true } },
      },
    });

    if (ticketMatch) {
      const ticket: ScannedTicketResult = {
        id: ticketMatch.id,
        code: ticketMatch.code,
        subject: ticketMatch.subject,
        message: ticketMatch.message,
        category: ticketMatch.category,
        status: ticketMatch.status,
        priority: ticketMatch.priority,
        channel: ticketMatch.channel,
        userName: ticketMatch.user.name,
        userPhone: ticketMatch.user.phone,
        orderCode: ticketMatch.order?.code || null,
        createdAt: ticketMatch.createdAt,
      };

      return {
        success: true,
        result: {
          barcode: clean,
          entityType: "TICKET",
          ticket,
        },
      };
    }

    return {
      success: true,
      result: {
        barcode: clean,
        entityType: "NOT_FOUND",
      },
    };
  } catch (error) {
    console.error("[Action.Scan.LookupBarcode] Error:", error);
    return { success: false, message: "Barcode scan lookup failed." };
  }
}

/**
 * 2. Modify Stock with Automatic StockEvent Record Audit Action
 */
export async function modifyStockWithEventAction(
  input: StockModifyInput,
): Promise<{
  success: boolean;
  message: string;
  newStock?: number;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = stockModifySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message:
          parsed.error.issues[0]?.message ||
          "Invalid stock modification payload.",
      };
    }

    const { productId, variantId, changeType, quantityDelta, note, reason } =
      parsed.data;

    const result = await db.$transaction(async (tx) => {
      let previousStock = 0;
      let newStock = 0;

      if (variantId) {
        const variant = await tx.variant.findUnique({
          where: { id: variantId },
        });
        if (!variant) throw new Error("Product variant not found.");

        previousStock = variant.stock;
        newStock = Math.max(0, previousStock + quantityDelta);

        await tx.variant.update({
          where: { id: variantId },
          data: { stock: newStock },
        });

        await tx.stockEvent.create({
          data: {
            type: changeType,
            quantity: Math.abs(quantityDelta),
            previousStock,
            newStock,
            reason: reason || `Manual Stock Adjustment (${changeType})`,
            note:
              note ||
              `Admin modified stock by ${quantityDelta > 0 ? `+${quantityDelta}` : quantityDelta} units via Scan Hub.`,
            productId,
            variantId,
          },
        });
      } else {
        // Check if Combo Product
        const combo = await tx.comboProduct.findUnique({
          where: { id: productId },
          include: { products: true, variants: true },
        });

        if (combo) {
          // Adjust stock for all component products and variants in the combo
          for (const p of combo.products) {
            const pPrev = p.stock ?? 0;
            const pNew = Math.max(0, pPrev + quantityDelta);
            await tx.product.update({
              where: { id: p.id },
              data: { stock: pNew },
            });
            await tx.stockEvent.create({
              data: {
                type: changeType,
                quantity: Math.abs(quantityDelta),
                previousStock: pPrev,
                newStock: pNew,
                reason: reason || `Combo Bundle Adjustment: ${combo.name}`,
                note: `Adjusted component ${p.name} from combo bundle modification.`,
                productId: p.id,
              },
            });
          }

          for (const v of combo.variants) {
            const vPrev = v.stock;
            const vNew = Math.max(0, vPrev + quantityDelta);
            await tx.variant.update({
              where: { id: v.id },
              data: { stock: vNew },
            });
            await tx.stockEvent.create({
              data: {
                type: changeType,
                quantity: Math.abs(quantityDelta),
                previousStock: vPrev,
                newStock: vNew,
                reason: reason || `Combo Bundle Adjustment: ${combo.name}`,
                note: `Adjusted component variant (${v.sku}) from combo bundle modification.`,
                productId: v.productId,
                variantId: v.id,
              },
            });
          }

          // Return new minimum capacity
          const updatedCombo = await tx.comboProduct.findUnique({
            where: { id: productId },
            include: { products: true, variants: true },
          });
          const allStocks = [
            ...(updatedCombo?.products.map((p) => p.stock ?? 0) || []),
            ...(updatedCombo?.variants.map((v) => v.stock) || []),
          ];
          newStock = allStocks.length > 0 ? Math.min(...allStocks) : 0;
          previousStock = Math.max(0, newStock - quantityDelta);
        } else {
          const product = await tx.product.findUnique({
            where: { id: productId },
          });
          if (!product) throw new Error("Product not found.");

          previousStock = product.stock ?? 0;
          newStock = Math.max(0, previousStock + quantityDelta);

          await tx.product.update({
            where: { id: productId },
            data: { stock: newStock },
          });

          await tx.stockEvent.create({
            data: {
              type: changeType,
              quantity: Math.abs(quantityDelta),
              previousStock,
              newStock,
              reason: reason || `Manual Stock Adjustment (${changeType})`,
              note:
                note ||
                `Admin modified stock by ${quantityDelta > 0 ? `+${quantityDelta}` : quantityDelta} units via Scan Hub.`,
              productId,
            },
          });
        }
      }

      return { previousStock, newStock };
    });

    revalidatePath("/admin/scan");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory/combo-products");
    revalidatePath("/admin/reports/product-reports/low-stocks");

    return {
      success: true,
      message: `Stock successfully adjusted to ${result.newStock} units (${changeType}).`,
      newStock: result.newStock,
    };
  } catch (error) {
    console.error("[Action.Scan.ModifyStock] Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to modify stock.",
    };
  }
}

/**
 * 3. Process Order Returns & Restock Action (Supports Simple Products, Variants, & Combo Bundles)
 */
export async function processOrderReturnAction(
  input: OrderReturnInput,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = orderReturnSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid return payload.",
      };
    }

    const { orderId, items, newOrderStatus, note } = parsed.data;

    await db.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });
      if (!order) throw new Error("Order not found.");

      // 1. Update Order Status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: newOrderStatus,
          note: note
            ? `${order.note ? `${order.note}\n` : ""}[Return Processed]: ${note}`
            : order.note,
        },
      });

      // 2. Restock returned items if requested and log StockEvent
      for (const item of items) {
        if (item.restockInventory && item.quantityToReturn > 0) {
          if (item.comboProductId) {
            // Restock each component product and variant of the combo
            const combo = await tx.comboProduct.findUnique({
              where: { id: item.comboProductId },
              include: { products: true, variants: true },
            });

            if (combo) {
              for (const p of combo.products) {
                const prev = p.stock ?? 0;
                const next = prev + item.quantityToReturn;
                await tx.product.update({
                  where: { id: p.id },
                  data: { stock: next },
                });
                await tx.stockEvent.create({
                  data: {
                    type: StockEventType.RETURN,
                    quantity: item.quantityToReturn,
                    previousStock: prev,
                    newStock: next,
                    reason: `Order #${order.code} Combo Return: ${combo.name} (${item.condition}) - ${item.reason}`,
                    note: `Restocked component product ${p.name} from combo bundle return.`,
                    productId: p.id,
                  },
                });
              }

              for (const v of combo.variants) {
                const prev = v.stock;
                const next = prev + item.quantityToReturn;
                await tx.variant.update({
                  where: { id: v.id },
                  data: { stock: next },
                });
                await tx.stockEvent.create({
                  data: {
                    type: StockEventType.RETURN,
                    quantity: item.quantityToReturn,
                    previousStock: prev,
                    newStock: next,
                    reason: `Order #${order.code} Combo Return: ${combo.name} (${item.condition}) - ${item.reason}`,
                    note: `Restocked component variant (${v.sku}) from combo bundle return.`,
                    productId: v.productId,
                    variantId: v.id,
                  },
                });
              }
            }
          } else if (item.variantId) {
            const variant = await tx.variant.findUnique({
              where: { id: item.variantId },
            });
            if (variant) {
              const previousStock = variant.stock;
              const newStock = previousStock + item.quantityToReturn;

              await tx.variant.update({
                where: { id: item.variantId },
                data: { stock: newStock },
              });

              await tx.stockEvent.create({
                data: {
                  type: StockEventType.RETURN,
                  quantity: item.quantityToReturn,
                  previousStock,
                  newStock,
                  reason: `Order #${order.code} Return (${item.condition}) - ${item.reason}`,
                  note: `Restocked ${item.quantityToReturn} units from customer return.`,
                  productId: item.productId,
                  variantId: item.variantId,
                },
              });
            }
          } else {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
            });
            if (product) {
              const previousStock = product.stock ?? 0;
              const newStock = previousStock + item.quantityToReturn;

              await tx.product.update({
                where: { id: item.productId },
                data: { stock: newStock },
              });

              await tx.stockEvent.create({
                data: {
                  type: StockEventType.RETURN,
                  quantity: item.quantityToReturn,
                  previousStock,
                  newStock,
                  reason: `Order #${order.code} Return (${item.condition}) - ${item.reason}`,
                  note: `Restocked ${item.quantityToReturn} units from customer return.`,
                  productId: item.productId,
                },
              });
            }
          }
        }
      }
    });

    revalidatePath("/admin/scan");
    revalidatePath("/admin/management/orders");
    revalidatePath("/admin/reports/order-reports/division-wise");

    return {
      success: true,
      message: `Return for order successfully processed and recorded.`,
    };
  } catch (error) {
    console.error("[Action.Scan.OrderReturn] Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to process order return.",
    };
  }
}

/**
 * 4. Create POS In-Store Order Action with Stock Deduction & StockEvent Audit for Products, Variants & Combos
 */
export async function createPOSOrderAction(input: POSCheckoutInput): Promise<{
  success: boolean;
  message: string;
  receipt?: POSReceiptData;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = posCheckoutSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message:
          parsed.error.issues[0]?.message || "Invalid POS checkout payload.",
      };
    }

    const {
      customerName,
      customerPhone,
      customerEmail,
      district,
      address,
      items,
      discountAmount,
      paymentMethod,
      paymentStatus,
      note,
    } = parsed.data;

    let subtotal = 0;
    let totalQuantity = 0;

    for (const itm of items) {
      subtotal += itm.unitPrice * itm.quantity;
      totalQuantity += itm.quantity;
    }

    const finalCost = Math.max(0, subtotal - discountAmount);

    const receipt = await db.$transaction(async (tx) => {
      // 1. Check or create User
      let user = await tx.user.findFirst({
        where: { phone: customerPhone },
      });

      if (!user) {
        const userCode = await generateId("CUSTOMER", tx);
        user = await tx.user.create({
          data: {
            code: userCode,
            name: customerName,
            phone: customerPhone,
            email: customerEmail || `pos_${Date.now()}@meawland.local`,
            district,
            role: Role.USER,
          },
        });
      }

      // 2. Generate Order Code
      const orderCode = await generateId("ORDER", tx);

      // 3. Create Order
      const order = await tx.order.create({
        data: {
          code: orderCode,
          totalQuantity,
          totalCost: subtotal.toFixed(2),
          totalPrice: subtotal.toFixed(2),
          discountCost: discountAmount.toFixed(2),
          finalCost: finalCost.toFixed(2),
          name: customerName,
          email: user.email,
          phone: customerPhone,
          address,
          district,
          status: OrderStatus.DELIVERED, // In-store POS is fulfilled immediately
          type: OrderType.OTHER,
          paymentMethod,
          paymentStatus,
          userId: user.id,
          note: note ? `[POS Sale]: ${note}` : "[In-Store POS Outlet Sale]",
        },
      });

      // 4. Create OrderItems, Decrement Stocks, and Record StockEvent(PURCHASE)
      for (const itm of items) {
        const itemFinalCost = (itm.unitPrice * itm.quantity).toFixed(2);

        await tx.orderItem.create({
          data: {
            quanitity: itm.quantity,
            totalCost: itemFinalCost,
            unitPrice: itm.unitPrice.toFixed(2),
            discountCost: "0.00",
            finalCost: itemFinalCost,
            status: OrderStatus.DELIVERED,
            orderId: order.id,
            productId: itm.isCombo ? null : itm.productId,
            variantId: itm.variantId || null,
            comboProductId:
              itm.comboProductId || (itm.isCombo ? itm.productId : null),
          },
        });

        // Decrement stock based on item type
        if (itm.isCombo || itm.comboProductId) {
          const comboId = itm.comboProductId || itm.productId;
          const combo = await tx.comboProduct.findUnique({
            where: { id: comboId },
            include: { products: true, variants: true },
          });

          if (combo) {
            for (const p of combo.products) {
              const prev = p.stock ?? 0;
              const next = Math.max(0, prev - itm.quantity);
              await tx.product.update({
                where: { id: p.id },
                data: { stock: next },
              });
              await tx.stockEvent.create({
                data: {
                  type: StockEventType.PURCHASE,
                  quantity: itm.quantity,
                  previousStock: prev,
                  newStock: next,
                  reason: `POS Combo Sale Order #${order.code} (${combo.name})`,
                  note: `Sold component product ${p.name} from combo bundle checkout.`,
                  productId: p.id,
                },
              });
            }

            for (const v of combo.variants) {
              const prev = v.stock;
              const next = Math.max(0, prev - itm.quantity);
              await tx.variant.update({
                where: { id: v.id },
                data: { stock: next },
              });
              await tx.stockEvent.create({
                data: {
                  type: StockEventType.PURCHASE,
                  quantity: itm.quantity,
                  previousStock: prev,
                  newStock: next,
                  reason: `POS Combo Sale Order #${order.code} (${combo.name})`,
                  note: `Sold component variant (${v.sku}) from combo bundle checkout.`,
                  productId: v.productId,
                  variantId: v.id,
                },
              });
            }
          }
        } else if (itm.variantId) {
          const v = await tx.variant.findUnique({
            where: { id: itm.variantId },
          });
          if (v) {
            const previousStock = v.stock;
            const newStock = Math.max(0, previousStock - itm.quantity);
            await tx.variant.update({
              where: { id: itm.variantId },
              data: { stock: newStock },
            });

            await tx.stockEvent.create({
              data: {
                type: StockEventType.PURCHASE,
                quantity: itm.quantity,
                previousStock,
                newStock,
                reason: `POS In-Store Sale Order #${order.code}`,
                note: `Sold ${itm.quantity} units via POS terminal.`,
                productId: itm.productId,
                variantId: itm.variantId,
              },
            });
          }
        } else {
          const p = await tx.product.findUnique({
            where: { id: itm.productId },
          });
          if (p) {
            const previousStock = p.stock ?? 0;
            const newStock = Math.max(0, previousStock - itm.quantity);
            await tx.product.update({
              where: { id: itm.productId },
              data: { stock: newStock },
            });

            await tx.stockEvent.create({
              data: {
                type: StockEventType.PURCHASE,
                quantity: itm.quantity,
                previousStock,
                newStock,
                reason: `POS In-Store Sale Order #${order.code}`,
                note: `Sold ${itm.quantity} units via POS terminal.`,
                productId: itm.productId,
              },
            });
          }
        }
      }

      const receiptData: POSReceiptData = {
        orderId: order.id,
        orderCode: order.code,
        customerName,
        customerPhone,
        items,
        subtotal,
        discount: discountAmount,
        finalCost,
        paymentMethod,
        paymentStatus,
        createdAt: order.createdAt,
      };

      return receiptData;
    });

    revalidatePath("/admin/scan");
    revalidatePath("/admin/management/orders");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory/combo-products");

    return {
      success: true,
      message: `POS Sale completed! Order #${receipt.orderCode} generated.`,
      receipt,
    };
  } catch (error) {
    console.error("[Action.Scan.CreatePOSOrder] Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to process POS sale.",
    };
  }
}
