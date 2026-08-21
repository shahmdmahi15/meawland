import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { env } from "@/env";
import {
  CourierStatus,
  OrderStatus,
  PaymentStatus,
} from "@/generated/prisma/enums";
import type { SteadfastWebhookPayload } from "@/actions/steadfast/types";
import { triggerOrderDeliveredSms } from "@/actions/admin/support-marketing/marketing/sms/automations";
import { triggerOrderDeliveredEmail } from "@/actions/admin/support-marketing/marketing/email/automations";
import { revalidatePath } from "next/cache";

// ────────────────────────────────────────────────────────────────────────────────
// Helpers: Map Steadfast delivery status string to CourierStatus & OrderStatus
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
    case CourierStatus.IN_REVIEW:
    default:
      return currentOrderStatus;
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Webhook Handler: POST /api/steadfast/webhook
// ────────────────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication Check (Bearer Token or API Key)
    const authHeader =
      request.headers.get("authorization") ||
      request.headers.get("Authorization");

    const expectedToken =
      env.STEADFAST_WEBHOOK_AUTH_TOKEN || env.STEADFAST_API_KEY;

    if (expectedToken) {
      if (!authHeader) {
        console.warn(
          "[API.Steadfast.Webhook] Missing Authorization header in request.",
        );
        return NextResponse.json(
          {
            status: "error",
            message: "Unauthorized. Missing authorization token.",
          },
          { status: 401 },
        );
      }

      const rawToken = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7).trim()
        : authHeader.trim();

      const isValidToken =
        rawToken === expectedToken ||
        rawToken === env.STEADFAST_API_KEY ||
        rawToken === env.STEADFAST_WEBHOOK_AUTH_TOKEN;

      if (!isValidToken) {
        console.warn(
          "[API.Steadfast.Webhook] Invalid Authorization token provided:",
          rawToken,
        );
        return NextResponse.json(
          {
            status: "error",
            message: "Unauthorized. Invalid authorization token.",
          },
          { status: 401 },
        );
      }
    }

    // 2. Parse JSON Payload
    const payload = (await request.json()) as SteadfastWebhookPayload;

    if (!payload || !payload.notification_type) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid webhook payload. Missing notification_type.",
        },
        { status: 400 },
      );
    }

    console.log(
      `[API.Steadfast.Webhook] Received notification "${payload.notification_type}":`,
      payload,
    );

    const consignmentIdNum = payload.consignment_id
      ? Number(payload.consignment_id)
      : null;
    const invoiceStr = payload.invoice ? String(payload.invoice).trim() : null;

    if (!consignmentIdNum && !invoiceStr) {
      return NextResponse.json(
        {
          status: "error",
          message: "Missing consignment_id and invoice identifiers.",
        },
        { status: 400 },
      );
    }

    // 3. Find matching Shipment and Order in database
    const shipment = await db.shipment.findFirst({
      where: {
        OR: [
          ...(consignmentIdNum ? [{ consignmentId: consignmentIdNum }] : []),
          ...(invoiceStr ? [{ invoice: invoiceStr }] : []),
          ...(invoiceStr ? [{ order: { code: invoiceStr } }] : []),
        ],
      },
      include: {
        order: {
          include: {
            payment: true,
          },
        },
      },
    });

    if (!shipment || !shipment.order) {
      console.warn(
        `[API.Steadfast.Webhook] No matching shipment found for consignment_id=${consignmentIdNum}, invoice=${invoiceStr}`,
      );
      return NextResponse.json(
        {
          status: "error",
          message: "Consignment or order not found in database.",
        },
        { status: 404 },
      );
    }

    const order = shipment.order;

    // 4. Handle Notification Type: delivery_status
    if (payload.notification_type === "delivery_status") {
      const newCourierStatus = mapSteadfastToCourierStatus(payload.status);
      const newOrderStatus = mapCourierToOrderStatus(
        newCourierStatus,
        order.status,
      );

      const isDelivered =
        newCourierStatus === CourierStatus.DELIVERED ||
        newCourierStatus === CourierStatus.PARTIAL_DELIVERED;

      await db.$transaction(async (tx) => {
        // Update Shipment record
        await tx.shipment.update({
          where: { id: shipment.id },
          data: {
            status: newCourierStatus,
            rawStatus: payload.status || shipment.rawStatus,
            codAmount:
              payload.cod_amount !== undefined
                ? payload.cod_amount.toFixed(2)
                : shipment.codAmount,
            lastCheckedAt: new Date(),
            rawResponse: payload as object,
          },
        });

        // Update Order record
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: newOrderStatus,
            // If delivered via COD, mark order payment as PAID
            ...(isDelivered && order.paymentStatus === PaymentStatus.PENDING
              ? { paymentStatus: PaymentStatus.PAID }
              : {}),
          },
        });

        // If payment record exists and order was delivered, mark payment as PAID
        if (
          isDelivered &&
          order.payment &&
          order.payment.status === PaymentStatus.PENDING
        ) {
          await tx.payment.update({
            where: { id: order.payment.id },
            data: {
              status: PaymentStatus.PAID,
              transactionStatus: "Completed",
              statusMessage: "COD collected on delivery by Steadfast Courier.",
            },
          });
        }
      });

      // If order was delivered, send delivery celebration SMS & Email
      if (isDelivered && order.phone) {
        triggerOrderDeliveredSms({
          id: order.id,
          code: order.code,
          phone: order.phone,
          name: order.name,
          userId: order.userId,
        }).catch((err) => {
          console.error("[Steadfast.Webhook.SMS] Error:", err);
        });
      }

      if (isDelivered && order.email) {
        triggerOrderDeliveredEmail({
          id: order.id,
          code: order.code,
          email: order.email,
          name: order.name,
          userId: order.userId,
        }).catch((err) => {
          console.error("[Steadfast.Webhook.Email] Error:", err);
        });
      }

      // Revalidate cache paths
      revalidatePath("/admin/management/orders");
      revalidatePath(`/admin/management/orders/${order.code}`);
      revalidatePath("/account/orders");
      revalidatePath("/account/tracking");

      return NextResponse.json({
        status: "success",
        message: "Webhook received successfully.",
      });
    }

    // 5. Handle Notification Type: tracking_update
    if (payload.notification_type === "tracking_update") {
      await db.shipment.update({
        where: { id: shipment.id },
        data: {
          lastCheckedAt: new Date(),
          rawResponse: {
            ...((shipment.rawResponse as object) || {}),
            latest_tracking_message: payload.tracking_message,
            latest_tracking_updated_at: payload.updated_at,
          },
        },
      });

      // Revalidate tracking pages
      revalidatePath("/account/tracking");
      revalidatePath(`/admin/management/orders/${order.code}`);

      return NextResponse.json({
        status: "success",
        message: "Webhook received successfully.",
      });
    }

    // 6. Unknown notification type fallback
    const rawNotificationType =
      (payload as { notification_type?: string })?.notification_type ||
      "unknown";
    return NextResponse.json({
      status: "success",
      message: `Webhook received for notification_type "${rawNotificationType}".`,
    });
  } catch (error) {
    console.error("[API.Steadfast.Webhook] Internal Error:", error);
    return NextResponse.json(
      {
        status: "error",
        message: "Internal server error while processing webhook.",
      },
      { status: 500 },
    );
  }
}
