"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import {
  CourierProvider,
  CourierStatus,
  OrderStatus,
  PaymentStatus,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import {
  createSteadfastOrderAction,
  createSteadfastBulkOrderAction,
  getSteadfastStatusByConsignmentIdAction,
  createSteadfastReturnRequestAction,
} from "@/actions/steadfast";
import { triggerOrderDispatchedSms } from "@/actions/admin/support-marketing/marketing/sms/automations";
import { triggerOrderDispatchedEmail } from "@/actions/admin/support-marketing/marketing/email/automations";
import { revalidatePath } from "next/cache";

// ────────────────────────────────────────────────────────────────────────────────
// Helper: Map Steadfast raw delivery status string to CourierStatus enum
// ────────────────────────────────────────────────────────────────────────────────

function mapSteadfastToCourierStatus(rawStatus?: string | null): CourierStatus {
  if (!rawStatus) return CourierStatus.IN_REVIEW;
  const s = rawStatus.toLowerCase().trim();

  switch (s) {
    case "pending":
      return CourierStatus.PENDING;
    case "delivered_approval_pending":
      return CourierStatus.DELIVERED_APPROVAL_PENDING;
    case "partial_delivered_approval_pending":
      return CourierStatus.PARTIAL_DELIVERED_APPROVAL_PENDING;
    case "cancelled_approval_pending":
      return CourierStatus.CANCELLED_APPROVAL_PENDING;
    case "unknown_approval_pending":
      return CourierStatus.UNKNOWN_APPROVAL_PENDING;
    case "delivered":
      return CourierStatus.DELIVERED;
    case "partial_delivered":
      return CourierStatus.PARTIAL_DELIVERED;
    case "cancelled":
      return CourierStatus.CANCELLED;
    case "hold":
      return CourierStatus.HOLD;
    case "in_review":
      return CourierStatus.IN_REVIEW;
    default:
      return CourierStatus.UNKNOWN;
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Helper: Map CourierStatus to OrderStatus
// ────────────────────────────────────────────────────────────────────────────────

function mapCourierToOrderStatus(
  courierStatus: CourierStatus,
  currentOrderStatus: OrderStatus,
): OrderStatus {
  switch (courierStatus) {
    case CourierStatus.DELIVERED:
      return OrderStatus.DELIVERED;
    case CourierStatus.PARTIAL_DELIVERED:
      return OrderStatus.PARTIAL_DELIVERED;
    case CourierStatus.CANCELLED:
      return OrderStatus.CANCELLED;
    case CourierStatus.HOLD:
      return OrderStatus.HOLD;
    case CourierStatus.DELIVERED_APPROVAL_PENDING:
      return OrderStatus.DELIVERY_APPROVAL_PENDING;
    case CourierStatus.PARTIAL_DELIVERED_APPROVAL_PENDING:
      return OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING;
    case CourierStatus.CANCELLED_APPROVAL_PENDING:
      return OrderStatus.CANCELLED_APPROVAL_PENDING;
    case CourierStatus.UNKNOWN_APPROVAL_PENDING:
      return OrderStatus.UNKNOWN_APPROVAL_PENDING;
    case CourierStatus.PENDING:
      return OrderStatus.PENDING;
    case CourierStatus.IN_REVIEW:
      return currentOrderStatus === OrderStatus.PENDING
        ? OrderStatus.PENDING
        : OrderStatus.IN_REVIEW;
    default:
      return currentOrderStatus;
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// 1. Send Single Order to Steadfast
// ────────────────────────────────────────────────────────────────────────────────

export type SendOrderToSteadfastInput = {
  orderId: string;
  deliveryType?: 0 | 1; // 0 = Home Delivery, 1 = Hub Pick Up
  note?: string | null;
  itemDescription?: string | null;
  totalLot?: number | null;
};

export async function sendOrderToSteadfastAction(
  input: SendOrderToSteadfastInput,
): Promise<{
  success: boolean;
  message?: string;
  consignmentId?: number;
  trackingCode?: string;
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

    if (!input.orderId) {
      return { success: false, message: "Order ID is required." };
    }

    const order = await db.order.findUnique({
      where: { id: input.orderId },
      include: {
        shipment: true,
        payment: true,
      },
    });

    if (!order) {
      return { success: false, message: "Order not found." };
    }

    if (order.shipment && order.shipment.consignmentId) {
      return {
        success: false,
        message: `This order has already been sent to Steadfast (Consignment ID: #${order.shipment.consignmentId}, Tracking: ${order.shipment.trackingCode}).`,
      };
    }

    // Determine COD Amount: If paid (e.g. bKash / prepaid), COD is 0 BDT
    const isPrepaid = order.paymentStatus === PaymentStatus.PAID;
    const codAmount = isPrepaid
      ? 0
      : Math.max(0, Math.round(parseFloat(order.finalCost) || 0));

    const fullAddress = [order.address, order.district]
      .filter(Boolean)
      .join(", ");

    // Dispatch to Steadfast API
    const result = await createSteadfastOrderAction({
      invoice: order.code,
      recipient_name: order.name,
      recipient_phone: order.phone,
      recipient_address: fullAddress,
      cod_amount: codAmount,
      note: input.note ?? order.note ?? undefined,
      recipient_email: order.email || undefined,
      item_description: input.itemDescription || undefined,
      total_lot: input.totalLot || order.totalQuantity || 1,
      delivery_type: input.deliveryType ?? 0,
    });

    if (!result.success || !result.consignment) {
      return {
        success: false,
        message: result.message || "Failed to create consignment on Steadfast.",
      };
    }

    const consignment = result.consignment;
    const courierStatus = mapSteadfastToCourierStatus(consignment.status);

    // Save or update Shipment record in PostgreSQL
    await db.$transaction(async (tx) => {
      await tx.shipment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          provider: CourierProvider.STEADFAST,
          consignmentId: consignment.consignment_id,
          trackingCode: consignment.tracking_code,
          invoice: consignment.invoice,
          recipientName: consignment.recipient_name,
          recipientPhone: consignment.recipient_phone,
          recipientAddress: consignment.recipient_address,
          codAmount: String(consignment.cod_amount),
          deliveryType: input.deliveryType ?? 0,
          note: consignment.note,
          status: courierStatus,
          rawStatus: consignment.status,
          rawResponse: result.data as any,
          lastCheckedAt: new Date(),
        },
        update: {
          provider: CourierProvider.STEADFAST,
          consignmentId: consignment.consignment_id,
          trackingCode: consignment.tracking_code,
          invoice: consignment.invoice,
          recipientName: consignment.recipient_name,
          recipientPhone: consignment.recipient_phone,
          recipientAddress: consignment.recipient_address,
          codAmount: String(consignment.cod_amount),
          deliveryType: input.deliveryType ?? 0,
          note: consignment.note,
          status: courierStatus,
          rawStatus: consignment.status,
          rawResponse: result.data as any,
          lastCheckedAt: new Date(),
        },
      });

      // Update Order status if currently IN_REVIEW / PENDING
      const updatedOrderStatus = mapCourierToOrderStatus(
        courierStatus,
        order.status,
      );
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: updatedOrderStatus,
        },
      });
    });

    // Trigger automated SMS notification with Steadfast tracking code
    triggerOrderDispatchedSms({
      id: order.id,
      code: order.code,
      phone: order.phone,
      name: order.name,
      trackingCode: consignment.tracking_code,
      userId: order.userId,
    }).catch((err) => {
      console.error("[Steadfast.SMS] Failed to send dispatch SMS:", err);
    });

    // Trigger automated Email notification with Steadfast tracking details
    if (order.email) {
      triggerOrderDispatchedEmail({
        id: order.id,
        code: order.code,
        email: order.email,
        name: order.name,
        trackingCode: consignment.tracking_code,
        courierName: "Steadfast Courier",
        userId: order.userId,
      }).catch((err) => {
        console.error("[Steadfast.Email] Failed to send dispatch email:", err);
      });
    }

    // Record Audit Log for courier handover
    await recordAuditLog({
      action: AuditAction.COURIER_DISPATCH,
      entity: AuditEntity.SHIPMENT,
      entityId: consignment.consignment_id
        ? String(consignment.consignment_id)
        : order.id,
      entityName: `Order #${order.code}`,
      summary: `Order #${order.code} dispatched via Steadfast Courier. Consignment: ${consignment.consignment_id}, Tracking: ${consignment.tracking_code}`,
      severity: AuditSeverity.INFO,
      newState: {
        consignmentId: consignment.consignment_id,
        trackingCode: consignment.tracking_code,
        codAmount: consignment.cod_amount,
        status: consignment.status,
      },
      userId: sessionUser.id,
      path: "/admin/management/orders",
    });

    revalidatePath("/admin/management/orders/all-orders");
    revalidatePath(`/admin/management/orders/all-orders/${order.code}`);
    revalidatePath("/account/orders");
    revalidatePath("/account/tracking");

    return {
      success: true,
      message: `Consignment created successfully! CID: #${consignment.consignment_id}, Tracking: ${consignment.tracking_code}`,
      consignmentId: consignment.consignment_id,
      trackingCode: consignment.tracking_code,
    };
  } catch (error) {
    console.error("[Actions.Admin.SendToSteadfast] Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error dispatching order to Steadfast.",
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// 2. Bulk Send Orders to Steadfast
// ────────────────────────────────────────────────────────────────────────────────

export async function bulkSendOrdersToSteadfastAction(
  orderIds: string[],
): Promise<{
  success: boolean;
  message?: string;
  successCount?: number;
  failureCount?: number;
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

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return { success: false, message: "No orders selected." };
    }

    const orders = await db.order.findMany({
      where: {
        id: { in: orderIds },
        OR: [{ shipment: null }, { shipment: { consignmentId: null } }],
      },
      include: {
        shipment: true,
        payment: true,
      },
      take: 500,
    });

    if (orders.length === 0) {
      return {
        success: false,
        message: "All selected orders have already been sent to Steadfast.",
      };
    }

    const bulkItems = orders.map((order) => {
      const isPrepaid = order.paymentStatus === PaymentStatus.PAID;
      const codAmount = isPrepaid
        ? 0
        : Math.max(0, Math.round(parseFloat(order.finalCost) || 0));
      const fullAddress = [order.address, order.district]
        .filter(Boolean)
        .join(", ");

      return {
        invoice: order.code,
        recipient_name: order.name,
        recipient_phone: order.phone,
        recipient_address: fullAddress,
        cod_amount: codAmount,
        note: order.note || undefined,
        recipient_email: order.email || undefined,
        total_lot: order.totalQuantity || 1,
      };
    });

    const result = await createSteadfastBulkOrderAction(bulkItems);

    if (!result.success || !result.results) {
      return {
        success: false,
        message: result.message || "Failed to create bulk orders on Steadfast.",
      };
    }

    let successCount = 0;
    let failureCount = 0;

    for (const resItem of result.results) {
      if (resItem.status === "success" && resItem.consignment_id) {
        const matchingOrder = orders.find((o) => o.code === resItem.invoice);
        if (matchingOrder) {
          successCount++;
          const courierStatus = CourierStatus.IN_REVIEW;

          await db.shipment.upsert({
            where: { orderId: matchingOrder.id },
            create: {
              orderId: matchingOrder.id,
              provider: CourierProvider.STEADFAST,
              consignmentId: resItem.consignment_id,
              trackingCode: resItem.tracking_code,
              invoice: resItem.invoice,
              recipientName: resItem.recipient_name,
              recipientPhone: resItem.recipient_phone,
              recipientAddress: resItem.recipient_address,
              codAmount: String(resItem.cod_amount),
              status: courierStatus,
              rawStatus: resItem.status,
              lastCheckedAt: new Date(),
            },
            update: {
              provider: CourierProvider.STEADFAST,
              consignmentId: resItem.consignment_id,
              trackingCode: resItem.tracking_code,
              invoice: resItem.invoice,
              recipientName: resItem.recipient_name,
              recipientPhone: resItem.recipient_phone,
              recipientAddress: resItem.recipient_address,
              codAmount: String(resItem.cod_amount),
              status: courierStatus,
              rawStatus: resItem.status,
              lastCheckedAt: new Date(),
            },
          });
        }
      } else {
        failureCount++;
      }
    }

    revalidatePath("/admin/management/orders/all-orders");
    revalidatePath("/account/orders");
    revalidatePath("/account/tracking");

    return {
      success: true,
      message: `Bulk dispatch completed: ${successCount} orders created on Steadfast, ${failureCount} failed.`,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error("[Actions.Admin.BulkSendToSteadfast] Error:", error);
    return {
      success: false,
      message: "Unexpected error during bulk Steadfast dispatch.",
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// 3. Sync Shipment Status from Steadfast
// ────────────────────────────────────────────────────────────────────────────────

export async function syncSteadfastShipmentStatusAction(
  orderId: string,
): Promise<{
  success: boolean;
  message?: string;
  delivery_status?: string;
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

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order || !order.shipment || !order.shipment.consignmentId) {
      return {
        success: false,
        message: "This order has not been dispatched to Steadfast yet.",
      };
    }

    const statusRes = await getSteadfastStatusByConsignmentIdAction(
      order.shipment.consignmentId,
    );

    if (!statusRes.success || !statusRes.delivery_status) {
      return {
        success: false,
        message:
          statusRes.message ||
          "Failed to fetch live delivery status from Steadfast.",
      };
    }

    const courierStatus = mapSteadfastToCourierStatus(
      statusRes.delivery_status,
    );
    const updatedOrderStatus = mapCourierToOrderStatus(
      courierStatus,
      order.status,
    );

    await db.$transaction(async (tx) => {
      await tx.shipment.update({
        where: { orderId: order.id },
        data: {
          status: courierStatus,
          rawStatus: statusRes.delivery_status,
          lastCheckedAt: new Date(),
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: updatedOrderStatus,
          ...(courierStatus === CourierStatus.DELIVERED &&
            order.paymentStatus !== PaymentStatus.PAID && {
              paymentStatus: PaymentStatus.PAID,
            }),
        },
      });
    });

    revalidatePath("/admin/management/orders/all-orders");
    revalidatePath(`/admin/management/orders/all-orders/${order.code}`);
    revalidatePath("/account/orders");
    revalidatePath("/account/tracking");

    return {
      success: true,
      message: `Status synced: ${statusRes.delivery_status}`,
      delivery_status: statusRes.delivery_status,
    };
  } catch (error) {
    console.error("[Actions.Admin.SyncSteadfastStatus] Error:", error);
    return {
      success: false,
      message: "Unexpected error syncing Steadfast status.",
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// 4. Create Return Request from Admin
// ────────────────────────────────────────────────────────────────────────────────

export async function createSteadfastReturnRequestFromAdminAction(
  orderId: string,
  reason?: string,
): Promise<{
  success: boolean;
  message?: string;
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

    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { shipment: true },
    });

    if (!order || !order.shipment || !order.shipment.consignmentId) {
      return {
        success: false,
        message: "Order has not been sent to Steadfast.",
      };
    }

    const returnRes = await createSteadfastReturnRequestAction({
      consignment_id: order.shipment.consignmentId,
      reason,
    });

    if (!returnRes.success) {
      return {
        success: false,
        message:
          returnRes.message || "Failed to create return request on Steadfast.",
      };
    }

    await db.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.RETURNED_PARTIAL,
      },
    });

    revalidatePath("/admin/management/orders/all-orders");
    revalidatePath(`/admin/management/orders/all-orders/${order.code}`);

    return {
      success: true,
      message: "Steadfast return request initiated successfully.",
    };
  } catch (error) {
    console.error("[Actions.Admin.ReturnRequest] Error:", error);
    return {
      success: false,
      message: "Unexpected error creating Steadfast return request.",
    };
  }
}
