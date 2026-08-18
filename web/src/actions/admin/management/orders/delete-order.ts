"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { Role, StockEventType } from "@/generated/prisma/enums";
import {
  deleteOrderSchema,
  type DeleteOrderInput,
} from "@/schemas/admin/management/orders/order";

/**
 * Deletes an order record with optional inventory stock restoration and stock event logging.
 */
export async function deleteOrderAction(rawInput: DeleteOrderInput): Promise<{
  success: boolean;
  message: string;
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

    const parsed = deleteOrderSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid order ID.",
      };
    }

    const { orderId, restoreStock = true } = parsed.data;

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
            variant: true,
            comboProduct: {
              include: {
                products: true,
                variants: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    await db.$transaction(async (tx) => {
      // 1. If restoreStock is enabled, increment inventory and log StockEventType.INCREASE / RESTOCK
      if (restoreStock) {
        for (const item of order.orderItems) {
          const q = item.quanitity;

          if (item.variantId && item.variant) {
            const currentStock = item.variant.stock ?? 0;
            const newStock = currentStock + q;

            await tx.variant.update({
              where: { id: item.variantId },
              data: { stock: newStock },
            });

            await tx.stockEvent.create({
              data: {
                type: StockEventType.INCREASE,
                quantity: q,
                previousStock: currentStock,
                newStock,
                reason: `Order Deletion: ${order.code}`,
                note: `Restocked ${q} units following deletion of Order ${order.code}`,
                variantId: item.variantId,
              },
            });
          } else if (item.productId && item.product) {
            const currentStock = item.product.stock ?? 0;
            const newStock = currentStock + q;

            await tx.product.update({
              where: { id: item.productId },
              data: { stock: newStock },
            });

            await tx.stockEvent.create({
              data: {
                type: StockEventType.INCREASE,
                quantity: q,
                previousStock: currentStock,
                newStock,
                reason: `Order Deletion: ${order.code}`,
                note: `Restocked ${q} units following deletion of Order ${order.code}`,
                productId: item.productId,
              },
            });
          } else if (item.comboProductId && item.comboProduct) {
            for (const p of item.comboProduct.products || []) {
              const currentStock = p.stock ?? 0;
              const newStock = currentStock + q;

              await tx.product.update({
                where: { id: p.id },
                data: { stock: newStock },
              });

              await tx.stockEvent.create({
                data: {
                  type: StockEventType.INCREASE,
                  quantity: q,
                  previousStock: currentStock,
                  newStock,
                  reason: `Order Deletion: ${order.code}`,
                  note: `Restocked combo constituent product (${p.name})`,
                  productId: p.id,
                },
              });
            }

            for (const v of item.comboProduct.variants || []) {
              const currentStock = v.stock ?? 0;
              const newStock = currentStock + q;

              await tx.variant.update({
                where: { id: v.id },
                data: { stock: newStock },
              });

              await tx.stockEvent.create({
                data: {
                  type: StockEventType.INCREASE,
                  quantity: q,
                  previousStock: currentStock,
                  newStock,
                  reason: `Order Deletion: ${order.code}`,
                  note: `Restocked combo constituent variant (${v.sku})`,
                  variantId: v.id,
                },
              });
            }
          }
        }
      }

      // 2. Delete Order (cascade deletes orderItems)
      await tx.order.delete({
        where: { id: orderId },
      });
    });

    revalidatePath("/admin/management/orders/all-orders");
    revalidatePath("/admin/management/orders/web-orders");
    revalidatePath("/admin/management/orders/other-orders");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory/modify-stock");

    return {
      success: true,
      message: `Order #${order.code} deleted successfully.${restoreStock ? " Inventory stock was restored." : ""}`,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Orders.DeleteOrder] Error:", error);
    return {
      success: false,
      message: "Failed to delete order.",
    };
  }
}
