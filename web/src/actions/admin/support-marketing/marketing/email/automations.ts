"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getMeAction } from "@/actions/auth/get-me";
import { Role, EmailDeliveryStatus } from "@/generated/prisma/enums";
import { sendEmail } from "@/lib/mail";
import {
  buildOrderPlacedEmailHtml,
  buildOrderDispatchedEmailHtml,
  buildOrderDeliveredEmailHtml,
  buildBkashPaymentEmailHtml,
  buildWelcomeUserEmailHtml,
} from "@/lib/email-templates";

export interface EmailAutomationSettingsSummary {
  id: string;
  orderPlacedEmail: boolean;
  orderDispatchedEmail: boolean;
  orderDeliveredEmail: boolean;
  bkashPaymentPaidEmail: boolean;
  welcomeNewUserEmail: boolean;
  abandonedCartEmail: boolean;
  orderPlacedSubject?: string | null;
  orderDispatchedSubject?: string | null;
  orderDeliveredSubject?: string | null;
  bkashPaidSubject?: string | null;
  welcomeUserSubject?: string | null;
}

export interface UpdateEmailAutomationSettingsInput {
  orderPlacedEmail: boolean;
  orderDispatchedEmail: boolean;
  orderDeliveredEmail: boolean;
  bkashPaymentPaidEmail: boolean;
  welcomeNewUserEmail: boolean;
  abandonedCartEmail: boolean;
  orderPlacedSubject?: string | null;
  orderDispatchedSubject?: string | null;
  orderDeliveredSubject?: string | null;
  bkashPaidSubject?: string | null;
  welcomeUserSubject?: string | null;
}

/**
 * Retrieves current store email automation settings
 */
export async function getEmailAutomationSettingsAction(): Promise<{
  success: boolean;
  settings?: EmailAutomationSettingsSummary;
}> {
  try {
    let settings = await db.emailAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await db.emailAutomationSettings.create({
        data: {
          id: "default",
          orderPlacedEmail: true,
          orderDispatchedEmail: true,
          orderDeliveredEmail: true,
          bkashPaymentPaidEmail: true,
          welcomeNewUserEmail: true,
          abandonedCartEmail: false,
        },
      });
    }

    return {
      success: true,
      settings: {
        id: settings.id,
        orderPlacedEmail: settings.orderPlacedEmail,
        orderDispatchedEmail: settings.orderDispatchedEmail,
        orderDeliveredEmail: settings.orderDeliveredEmail,
        bkashPaymentPaidEmail: settings.bkashPaymentPaidEmail,
        welcomeNewUserEmail: settings.welcomeNewUserEmail,
        abandonedCartEmail: settings.abandonedCartEmail,
        orderPlacedSubject: settings.orderPlacedSubject,
        orderDispatchedSubject: settings.orderDispatchedSubject,
        orderDeliveredSubject: settings.orderDeliveredSubject,
        bkashPaidSubject: settings.bkashPaidSubject,
        welcomeUserSubject: settings.welcomeUserSubject,
      },
    };
  } catch (error) {
    console.error("[Action.Email.GetAutomationSettings] Error:", error);
    return { success: false };
  }
}

/**
 * Updates store email automation triggers and custom subject lines
 */
export async function updateEmailAutomationSettingsAction(
  input: UpdateEmailAutomationSettingsInput,
): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    await db.emailAutomationSettings.upsert({
      where: { id: "default" },
      update: {
        orderPlacedEmail: input.orderPlacedEmail,
        orderDispatchedEmail: input.orderDispatchedEmail,
        orderDeliveredEmail: input.orderDeliveredEmail,
        bkashPaymentPaidEmail: input.bkashPaymentPaidEmail,
        welcomeNewUserEmail: input.welcomeNewUserEmail,
        abandonedCartEmail: input.abandonedCartEmail,
        orderPlacedSubject: input.orderPlacedSubject || null,
        orderDispatchedSubject: input.orderDispatchedSubject || null,
        orderDeliveredSubject: input.orderDeliveredSubject || null,
        bkashPaidSubject: input.bkashPaidSubject || null,
        welcomeUserSubject: input.welcomeUserSubject || null,
      },
      create: {
        id: "default",
        orderPlacedEmail: input.orderPlacedEmail,
        orderDispatchedEmail: input.orderDispatchedEmail,
        orderDeliveredEmail: input.orderDeliveredEmail,
        bkashPaymentPaidEmail: input.bkashPaymentPaidEmail,
        welcomeNewUserEmail: input.welcomeNewUserEmail,
        abandonedCartEmail: input.abandonedCartEmail,
        orderPlacedSubject: input.orderPlacedSubject || null,
        orderDispatchedSubject: input.orderDispatchedSubject || null,
        orderDeliveredSubject: input.orderDeliveredSubject || null,
        bkashPaidSubject: input.bkashPaidSubject || null,
        welcomeUserSubject: input.welcomeUserSubject || null,
      },
    });

    revalidatePath("/admin/support-marketing/marketing/email");

    return {
      success: true,
      message: "Email automation settings updated successfully.",
    };
  } catch (error) {
    console.error("[Action.Email.UpdateAutomationSettings] Error:", error);
    return {
      success: false,
      message: "Failed to update email automation settings.",
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Automated Lifecycle Event Triggers
// ────────────────────────────────────────────────────────────────────────────────

/**
 * 1. Trigger Order Placed Confirmation Email
 */
export async function triggerOrderPlacedEmail(params: {
  id: string;
  code: string;
  email: string;
  name: string;
  grandTotal: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  items?: Array<{ name: string; quantity: number; price: string }>;
  subtotal?: string;
  deliveryFee?: string;
  discount?: string;
  userId?: string | null;
}) {
  try {
    const settings = await db.emailAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.orderPlacedEmail) {
      return;
    }

    const cleanEmail = params.email?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    const subject =
      settings?.orderPlacedSubject ||
      `Order Confirmed #${params.code} | Meawland 🐾`;

    const htmlContent = buildOrderPlacedEmailHtml({
      orderCode: params.code,
      customerName: params.name || "Pet Parent",
      recipientEmail: cleanEmail,
      items: params.items,
      subtotal: params.subtotal,
      deliveryFee: params.deliveryFee,
      discount: params.discount,
      grandTotal: params.grandTotal,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus,
      shippingAddress: params.shippingAddress,
    });

    const res = await sendEmail({
      to: cleanEmail,
      subject,
      htmlContent,
    });

    await db.emailLog.create({
      data: {
        recipientEmail: cleanEmail,
        recipientName: params.name,
        subject,
        status: res.success ? EmailDeliveryStatus.SENT : EmailDeliveryStatus.FAILED,
        messageId: res.messageId || null,
        errorMessage: res.error || null,
        orderId: params.id,
        userId: params.userId || null,
      },
    });
  } catch (error) {
    console.error("[Lifecycle.Email.OrderPlaced] Error:", error);
  }
}

/**
 * 2. Trigger Order Dispatched / Shipped Email
 */
export async function triggerOrderDispatchedEmail(params: {
  id: string;
  code: string;
  email: string;
  name: string;
  trackingCode?: string;
  courierName?: string;
  userId?: string | null;
}) {
  try {
    const settings = await db.emailAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.orderDispatchedEmail) {
      return;
    }

    const cleanEmail = params.email?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    const subject =
      settings?.orderDispatchedSubject ||
      `Your Order #${params.code} is on the way! 🚚 | Meawland`;

    const htmlContent = buildOrderDispatchedEmailHtml({
      orderCode: params.code,
      customerName: params.name || "Pet Parent",
      recipientEmail: cleanEmail,
      courierName: params.courierName || "Steadfast Courier",
      trackingCode: params.trackingCode,
    });

    const res = await sendEmail({
      to: cleanEmail,
      subject,
      htmlContent,
    });

    await db.emailLog.create({
      data: {
        recipientEmail: cleanEmail,
        recipientName: params.name,
        subject,
        status: res.success ? EmailDeliveryStatus.SENT : EmailDeliveryStatus.FAILED,
        messageId: res.messageId || null,
        errorMessage: res.error || null,
        orderId: params.id,
        userId: params.userId || null,
      },
    });
  } catch (error) {
    console.error("[Lifecycle.Email.OrderDispatched] Error:", error);
  }
}

/**
 * 3. Trigger Order Delivered Confirmation Email
 */
export async function triggerOrderDeliveredEmail(params: {
  id: string;
  code: string;
  email: string;
  name: string;
  userId?: string | null;
}) {
  try {
    const settings = await db.emailAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.orderDeliveredEmail) {
      return;
    }

    const cleanEmail = params.email?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    const subject =
      settings?.orderDeliveredSubject ||
      `Delivered! Order #${params.code} | Meawland 🐾`;

    const htmlContent = buildOrderDeliveredEmailHtml({
      orderCode: params.code,
      customerName: params.name || "Pet Parent",
      recipientEmail: cleanEmail,
    });

    const res = await sendEmail({
      to: cleanEmail,
      subject,
      htmlContent,
    });

    await db.emailLog.create({
      data: {
        recipientEmail: cleanEmail,
        recipientName: params.name,
        subject,
        status: res.success ? EmailDeliveryStatus.SENT : EmailDeliveryStatus.FAILED,
        messageId: res.messageId || null,
        errorMessage: res.error || null,
        orderId: params.id,
        userId: params.userId || null,
      },
    });
  } catch (error) {
    console.error("[Lifecycle.Email.OrderDelivered] Error:", error);
  }
}

/**
 * 4. Trigger bKash Payment Verified Email
 */
export async function triggerBkashPaidEmail(params: {
  id: string;
  code: string;
  email: string;
  name: string;
  amount: string;
  trxID: string;
  userId?: string | null;
}) {
  try {
    const settings = await db.emailAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.bkashPaymentPaidEmail) {
      return;
    }

    const cleanEmail = params.email?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    const subject =
      settings?.bkashPaidSubject ||
      `bKash Payment Verified for Order #${params.code} 💳 | Meawland`;

    const htmlContent = buildBkashPaymentEmailHtml({
      orderCode: params.code,
      customerName: params.name || "Pet Parent",
      recipientEmail: cleanEmail,
      amount: params.amount,
      trxID: params.trxID,
    });

    const res = await sendEmail({
      to: cleanEmail,
      subject,
      htmlContent,
    });

    await db.emailLog.create({
      data: {
        recipientEmail: cleanEmail,
        recipientName: params.name,
        subject,
        status: res.success ? EmailDeliveryStatus.SENT : EmailDeliveryStatus.FAILED,
        messageId: res.messageId || null,
        errorMessage: res.error || null,
        orderId: params.id,
        userId: params.userId || null,
      },
    });
  } catch (error) {
    console.error("[Lifecycle.Email.BkashPaid] Error:", error);
  }
}

/**
 * 5. Trigger Welcome New Registered Customer Email
 */
export async function triggerWelcomeUserEmail(params: {
  id: string;
  name: string;
  email: string;
}) {
  try {
    const settings = await db.emailAutomationSettings.findUnique({
      where: { id: "default" },
    });

    if (settings && !settings.welcomeNewUserEmail) {
      return;
    }

    const cleanEmail = params.email?.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) return;

    const subject =
      settings?.welcomeUserSubject ||
      `Welcome to Meawland! 🐾 Enjoy 10% OFF Your First Pet Order`;

    const htmlContent = buildWelcomeUserEmailHtml({
      customerName: params.name || "Pet Parent",
      recipientEmail: cleanEmail,
      couponCode: "WELCOME10",
    });

    const res = await sendEmail({
      to: cleanEmail,
      subject,
      htmlContent,
    });

    await db.emailLog.create({
      data: {
        recipientEmail: cleanEmail,
        recipientName: params.name,
        subject,
        status: res.success ? EmailDeliveryStatus.SENT : EmailDeliveryStatus.FAILED,
        messageId: res.messageId || null,
        errorMessage: res.error || null,
        userId: params.id,
      },
    });
  } catch (error) {
    console.error("[Lifecycle.Email.WelcomeUser] Error:", error);
  }
}
