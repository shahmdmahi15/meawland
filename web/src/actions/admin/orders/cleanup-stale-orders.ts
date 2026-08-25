"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  StockEventType,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export interface CleanupStaleOrdersResult {
  success: boolean;
  message?: string;
  cancelledCount: number;
  restockedItemCount: number;
}

/**
 * Cancels stale, unpaid bKash orders older than the specified age (default: 60 minutes)
 * and safely restocks inventory for all products, variants, and combo constituents.
 */
export async function cleanupStaleOrdersAction(
  maxAgeMinutes = 60,
): Promise<CleanupStaleOrdersResult> {
  try {
    const sessionUser = await getMeAction();
    // Allow admin/owner or automated internal invocation
    if (
      sessionUser &&
      sessionUser.role !== Role.ADMIN &&
      sessionUser.role !== Role.OWNER
    ) {
      return {
        success: false,
        message: "Unauthorized. Admin privileges required.",
        cancelledCount: 0,
        restockedItemCount: 0,
      };
    }

    const cutoffDate = new Date(Date.now() - maxAgeMinutes * 60 * 1000);

    // Find all stale pending bKash orders
    const staleOrders = await db.order.findMany({
      where: {
        paymentMethod: PaymentMethod.BKASH,
        paymentStatus: PaymentStatus.PENDING,
        status: OrderStatus.PENDING,
        createdAt: { lt: cutoffDate },
      },
      include: {
        orderItems: {
          include: {
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

    if (staleOrders.length === 0) {
      return {
        success: true,
        message: "No stale unpaid orders found.",
        cancelledCount: 0,
        restockedItemCount: 0,
      };
    }

    let cancelledCount = 0;
    let restockedItemCount = 0;

    for (const order of staleOrders) {
      await db.$transaction(async (tx) => {
        // 1. Mark order and payment as CANCELLED
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.CANCELLED,
            paymentStatus: PaymentStatus.CANCELLED,
          },
        });

        await tx.payment.updateMany({
          where: { orderId: order.id },
          data: {
            status: PaymentStatus.CANCELLED,
            statusMessage:
              "Auto-cancelled due to payment timeout (stale order cleanup).",
          },
        });

        // 2. Restock all items
        for (const item of order.orderItems) {
          const qty = item.quanitity;

          if (item.variantId) {
            const variant = await tx.variant.findUnique({
              where: { id: item.variantId },
              select: { stock: true },
            });
            const prevStock = variant?.stock ?? 0;
            const newStock = prevStock + qty;

            await tx.variant.update({
              where: { id: item.variantId },
              data: { stock: newStock },
            });

            await tx.stockEvent.create({
              data: {
                type: StockEventType.RESTOCK,
                quantity: qty,
                previousStock: prevStock,
                newStock,
                reason: `Auto-cancel timeout #${order.code}`,
                note: `Restocked after order #${order.code} expired unpaid`,
                variantId: item.variantId,
              },
            });
            restockedItemCount += qty;
          } else if (item.productId) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
              select: { stock: true },
            });
            const prevStock = product?.stock ?? 0;
            const newStock = prevStock + qty;

            await tx.product.update({
              where: { id: item.productId },
              data: { stock: newStock },
            });

            await tx.stockEvent.create({
              data: {
                type: StockEventType.RESTOCK,
                quantity: qty,
                previousStock: prevStock,
                newStock,
                reason: `Auto-cancel timeout #${order.code}`,
                note: `Restocked after order #${order.code} expired unpaid`,
                productId: item.productId,
              },
            });
            restockedItemCount += qty;
          } else if (item.comboProduct) {
            for (const p of item.comboProduct.products || []) {
              const product = await tx.product.findUnique({
                where: { id: p.id },
                select: { stock: true },
              });
              const prevStock = product?.stock ?? 0;
              const newStock = prevStock + qty;

              await tx.product.update({
                where: { id: p.id },
                data: { stock: newStock },
              });

              await tx.stockEvent.create({
                data: {
                  type: StockEventType.RESTOCK,
                  quantity: qty,
                  previousStock: prevStock,
                  newStock,
                  reason: `Auto-cancel timeout #${order.code} (Combo)`,
                  note: `Restocked after combo order #${order.code} expired unpaid`,
                  productId: p.id,
                },
              });
              restockedItemCount += qty;
            }

            for (const v of item.comboProduct.variants || []) {
              const variant = await tx.variant.findUnique({
                where: { id: v.id },
                select: { stock: true },
              });
              const prevStock = variant?.stock ?? 0;
              const newStock = prevStock + qty;

              await tx.variant.update({
                where: { id: v.id },
                data: { stock: newStock },
              });

              await tx.stockEvent.create({
                data: {
                  type: StockEventType.RESTOCK,
                  quantity: qty,
                  previousStock: prevStock,
                  newStock,
                  reason: `Auto-cancel timeout #${order.code} (Combo Variant)`,
                  note: `Restocked after combo order #${order.code} expired unpaid`,
                  variantId: v.id,
                },
              });
              restockedItemCount += qty;
            }
          }
        }

        // 3. Record Audit Log
        await recordAuditLog({
          action: AuditAction.STATUS_CHANGE,
          entity: AuditEntity.ORDER,
          entityId: order.id,
          entityName: `Order #${order.code}`,
          summary: `Order #${order.code} auto-cancelled and items restocked due to bKash payment expiration`,
          severity: AuditSeverity.WARNING,
          userId: sessionUser?.id || order.userId,
          path: "/admin/management/orders",
        }).catch(() => {});
      });

      cancelledCount++;
    }

    revalidatePath("/admin/management/orders");
    revalidatePath("/admin/management/products");

    return {
      success: true,
      message: `Successfully cancelled ${cancelledCount} stale order(s) and restocked ${restockedItemCount} item(s).`,
      cancelledCount,
      restockedItemCount,
    };
  } catch (error) {
    console.error("[Action.Orders.CleanupStaleOrders] Error:", error);
    return {
      success: false,
      message: "An error occurred while cleaning up stale orders.",
      cancelledCount: 0,
      restockedItemCount: 0,
    };
  }
}
