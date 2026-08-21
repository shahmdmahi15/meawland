"use server";

import db from "@/lib/db";
import {
  UpdateSmsAutomationSettingsSchema,
  type UpdateSmsAutomationSettingsInput,
} from "./types";
import {
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";

export type SmsAutomationSettingsSummary = {
  id: string;
  orderPlacedSms: boolean;
  orderDispatchedSms: boolean;
  orderDeliveredSms: boolean;
  bkashPaymentPaidSms: boolean;
  orderPlacedTemplate: string | null;
  orderDispatchedTemplate: string | null;
  orderDeliveredTemplate: string | null;
  bkashPaidTemplate: string | null;
};

/**
 * Retrieves the store SMS automation settings, creating default record if none exists
 */
export async function getSmsAutomationSettingsAction(): Promise<{
  success: boolean;
  settings?: SmsAutomationSettingsSummary;
}> {
  try {
    let settings = await db.smsAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await db.smsAutomationSettings.create({
        data: {
          id: "default",
          orderPlacedSms: true,
          orderDispatchedSms: true,
          orderDeliveredSms: true,
          bkashPaymentPaidSms: true,
          orderPlacedTemplate:
            "Dear {name}, your Meawland order #{orderCode} (BDT {amount}) is confirmed! We are preparing your pet essentials. Track live: {trackingUrl}",
          orderDispatchedTemplate:
            "Your Meawland order #{orderCode} is on the way via Steadfast Courier! Tracking: {trackingCode}. Track live: {trackingUrl}",
          orderDeliveredTemplate:
            "Dear {name}, your Meawland order #{orderCode} has been delivered! Thank you for choosing Meawland for your pet needs.",
          bkashPaidTemplate:
            "bKash Payment Verified! 🐾 Order #{orderCode} of BDT {amount} (TrxID: {trxID}) has been received successfully. Thank you!",
        },
      });
    }

    return {
      success: true,
      settings: {
        id: settings.id,
        orderPlacedSms: settings.orderPlacedSms,
        orderDispatchedSms: settings.orderDispatchedSms,
        orderDeliveredSms: settings.orderDeliveredSms,
        bkashPaymentPaidSms: settings.bkashPaymentPaidSms,
        orderPlacedTemplate: settings.orderPlacedTemplate,
        orderDispatchedTemplate: settings.orderDispatchedTemplate,
        orderDeliveredTemplate: settings.orderDeliveredTemplate,
        bkashPaidTemplate: settings.bkashPaidTemplate,
      },
    };
  } catch (error) {
    console.error("[Action.SMS.GetAutomationSettings] Error:", error);
    return {
      success: false,
    };
  }
}

/**
 * Updates store SMS automation triggers and custom templates
 */
export async function updateSmsAutomationSettingsAction(
  input: UpdateSmsAutomationSettingsInput,
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const validated = UpdateSmsAutomationSettingsSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        message:
          validated.error.issues[0]?.message || "Invalid settings input.",
      };
    }

    const data = validated.data;

    await db.smsAutomationSettings.upsert({
      where: { id: "default" },
      update: {
        orderPlacedSms: data.orderPlacedSms,
        orderDispatchedSms: data.orderDispatchedSms,
        orderDeliveredSms: data.orderDeliveredSms,
        bkashPaymentPaidSms: data.bkashPaymentPaidSms,
        orderPlacedTemplate: data.orderPlacedTemplate,
        orderDispatchedTemplate: data.orderDispatchedTemplate,
        orderDeliveredTemplate: data.orderDeliveredTemplate,
        bkashPaidTemplate: data.bkashPaidTemplate,
      },
      create: {
        id: "default",
        orderPlacedSms: data.orderPlacedSms,
        orderDispatchedSms: data.orderDispatchedSms,
        orderDeliveredSms: data.orderDeliveredSms,
        bkashPaymentPaidSms: data.bkashPaymentPaidSms,
        orderPlacedTemplate: data.orderPlacedTemplate,
        orderDispatchedTemplate: data.orderDispatchedTemplate,
        orderDeliveredTemplate: data.orderDeliveredTemplate,
        bkashPaidTemplate: data.bkashPaidTemplate,
      },
    });

    revalidatePath("/admin/support-marketing/marketing/sms");

    await recordAuditLog({
      action: AuditAction.SETTINGS_UPDATE,
      entity: AuditEntity.SYSTEM_SETTINGS,
      summary: "SMS Automation Lifecycle Settings & Templates updated",
      severity: AuditSeverity.INFO,
      newState: {
        orderPlacedSms: data.orderPlacedSms,
        orderDispatchedSms: data.orderDispatchedSms,
        orderDeliveredSms: data.orderDeliveredSms,
        bkashPaymentPaidSms: data.bkashPaymentPaidSms,
      },
      path: "/admin/support-marketing/marketing/sms",
    }).catch(() => {});

    return {
      success: true,
      message: "SMS automation settings updated successfully.",
    };
  } catch (error) {
    console.error("[Action.SMS.UpdateAutomationSettings] Error:", error);
    return {
      success: false,
      message: "Failed to update SMS automation settings.",
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Automated Lifecycle Event Triggers
// ────────────────────────────────────────────────────────────────────────────────

import { env } from "@/env";
import { SmsDeliveryStatus } from "@/generated/prisma/enums";
import { sendSingleSmsAction } from "@/actions/sms/send-sms";

/**
 * Triggers automated SMS when an order is placed
 */
export async function triggerOrderPlacedSms(order: {
  id: string;
  code: string;
  phone?: string | null;
  name?: string | null;
  finalCost: string;
  userId?: string | null;
}) {
  try {
    if (!order.phone) return;

    const settings = await db.smsAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.orderPlacedSms) return;

    const template =
      settings?.orderPlacedTemplate ||
      "Dear {name}, your Meawland order #{orderCode} (BDT {amount}) is confirmed! We are preparing your pet essentials. Track live: {trackingUrl}";

    const trackingUrl = `${env.NEXT_PUBLIC_APP_URL}/account/tracking?order=${order.code}`;
    let msg = template;
    msg = msg.replace(/\{name\}/gi, order.name || "Customer");
    msg = msg.replace(/\{orderCode\}/gi, order.code);
    msg = msg.replace(
      /\{amount\}/gi,
      parseFloat(order.finalCost || "0").toLocaleString(),
    );
    msg = msg.replace(/\{trackingUrl\}/gi, trackingUrl);

    const res = await sendSingleSmsAction({
      recipient: order.phone,
      message: msg,
    });

    await db.smsLog.create({
      data: {
        recipientPhone: order.phone,
        recipientName: order.name,
        message: msg,
        status: res.success
          ? SmsDeliveryStatus.SUBMITTED
          : SmsDeliveryStatus.FAILED,
        responseCode: res.data?.response_code
          ? Number(res.data.response_code)
          : undefined,
        statusMessage: res.message,
        rawResponse: res.data ? (res.data as object) : undefined,
        orderId: order.id,
        userId: order.userId || undefined,
      },
    });
  } catch (err) {
    console.error("[SMS.Trigger.OrderPlaced] Error:", err);
  }
}

/**
 * Triggers automated SMS when an order is dispatched to Steadfast Courier
 */
export async function triggerOrderDispatchedSms(order: {
  id: string;
  code: string;
  phone?: string | null;
  name?: string | null;
  trackingCode?: string | null;
  userId?: string | null;
}) {
  try {
    if (!order.phone) return;

    const settings = await db.smsAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.orderDispatchedSms) return;

    const template =
      settings?.orderDispatchedTemplate ||
      "Your Meawland order #{orderCode} is on the way via Steadfast Courier! Tracking: {trackingCode}. Track live: {trackingUrl}";

    const trackingUrl = `${env.NEXT_PUBLIC_APP_URL}/account/tracking?order=${order.code}`;
    let msg = template;
    msg = msg.replace(/\{name\}/gi, order.name || "Customer");
    msg = msg.replace(/\{orderCode\}/gi, order.code);
    msg = msg.replace(/\{trackingCode\}/gi, order.trackingCode || "In Transit");
    msg = msg.replace(/\{trackingUrl\}/gi, trackingUrl);

    const res = await sendSingleSmsAction({
      recipient: order.phone,
      message: msg,
    });

    await db.smsLog.create({
      data: {
        recipientPhone: order.phone,
        recipientName: order.name,
        message: msg,
        status: res.success
          ? SmsDeliveryStatus.SUBMITTED
          : SmsDeliveryStatus.FAILED,
        responseCode: res.data?.response_code
          ? Number(res.data.response_code)
          : undefined,
        statusMessage: res.message,
        rawResponse: res.data ? (res.data as object) : undefined,
        orderId: order.id,
        userId: order.userId || undefined,
      },
    });
  } catch (err) {
    console.error("[SMS.Trigger.OrderDispatched] Error:", err);
  }
}

/**
 * Triggers automated SMS when parcel is delivered to customer
 */
export async function triggerOrderDeliveredSms(order: {
  id: string;
  code: string;
  phone?: string | null;
  name?: string | null;
  userId?: string | null;
}) {
  try {
    if (!order.phone) return;

    const settings = await db.smsAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.orderDeliveredSms) return;

    const template =
      settings?.orderDeliveredTemplate ||
      "Dear {name}, your Meawland order #{orderCode} has been delivered! Thank you for choosing Meawland for your pet needs.";

    let msg = template;
    msg = msg.replace(/\{name\}/gi, order.name || "Customer");
    msg = msg.replace(/\{orderCode\}/gi, order.code);

    const res = await sendSingleSmsAction({
      recipient: order.phone,
      message: msg,
    });

    await db.smsLog.create({
      data: {
        recipientPhone: order.phone,
        recipientName: order.name,
        message: msg,
        status: res.success
          ? SmsDeliveryStatus.SUBMITTED
          : SmsDeliveryStatus.FAILED,
        responseCode: res.data?.response_code
          ? Number(res.data.response_code)
          : undefined,
        statusMessage: res.message,
        rawResponse: res.data ? (res.data as object) : undefined,
        orderId: order.id,
        userId: order.userId || undefined,
      },
    });
  } catch (err) {
    console.error("[SMS.Trigger.OrderDelivered] Error:", err);
  }
}

/**
 * Triggers automated SMS when bKash payment is verified
 */
export async function triggerBkashPaidSms(order: {
  id: string;
  code: string;
  phone?: string | null;
  name?: string | null;
  finalCost: string;
  trxID: string;
  userId?: string | null;
}) {
  try {
    if (!order.phone) return;

    const settings = await db.smsAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.bkashPaymentPaidSms) return;

    const template =
      settings?.bkashPaidTemplate ||
      "bKash Payment Verified! 🐾 Order #{orderCode} of BDT {amount} (TrxID: {trxID}) has been received successfully. Thank you!";

    let msg = template;
    msg = msg.replace(/\{name\}/gi, order.name || "Customer");
    msg = msg.replace(/\{orderCode\}/gi, order.code);
    msg = msg.replace(
      /\{amount\}/gi,
      parseFloat(order.finalCost || "0").toLocaleString(),
    );
    msg = msg.replace(/\{trxID\}/gi, order.trxID);

    const res = await sendSingleSmsAction({
      recipient: order.phone,
      message: msg,
    });

    await db.smsLog.create({
      data: {
        recipientPhone: order.phone,
        recipientName: order.name,
        message: msg,
        status: res.success
          ? SmsDeliveryStatus.SUBMITTED
          : SmsDeliveryStatus.FAILED,
        responseCode: res.data?.response_code
          ? Number(res.data.response_code)
          : undefined,
        statusMessage: res.message,
        rawResponse: res.data ? (res.data as object) : undefined,
        orderId: order.id,
        userId: order.userId || undefined,
      },
    });
  } catch (err) {
    console.error("[SMS.Trigger.BkashPaid] Error:", err);
  }
}
