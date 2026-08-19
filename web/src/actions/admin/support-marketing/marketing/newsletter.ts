"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { Role, NewsletterStatus } from "@/generated/prisma/enums";
import { revalidatePath } from "next/cache";
import {
  AdminNewsletterSubscriber,
  AdminNewsletterStats,
  AdminAddSubscriberInput,
  AdminBroadcastEmailInput,
  adminAddSubscriberSchema,
  adminBroadcastEmailSchema,
} from "@/schemas/admin/support-marketing/marketing/newsletter";

/**
 * Fetch all newsletter subscribers with KPI metrics.
 */
export async function getAdminNewsletterSubscribersAction(): Promise<{
  success: boolean;
  message?: string;
  subscribers?: AdminNewsletterSubscriber[];
  stats?: AdminNewsletterStats;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized access." };
    }

    const subscribers = await db.newsletterSubscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let activeSubscribers = 0;
    let unsubscribedCount = 0;
    let newThisMonthCount = 0;

    for (const sub of subscribers) {
      if (sub.status === NewsletterStatus.SUBSCRIBED) {
        activeSubscribers++;
      } else {
        unsubscribedCount++;
      }

      if (new Date(sub.createdAt) >= startOfMonth) {
        newThisMonthCount++;
      }
    }

    const stats: AdminNewsletterStats = {
      totalSubscribers: subscribers.length,
      activeSubscribers,
      unsubscribedCount,
      newThisMonthCount,
    };

    return {
      success: true,
      subscribers,
      stats,
    };
  } catch (error) {
    console.error("[Action.Admin.Newsletter.Get] Error:", error);
    return {
      success: false,
      message: "Failed to load newsletter subscribers.",
    };
  }
}

/**
 * Manually add a subscriber from admin panel.
 */
export async function adminAddSubscriberAction(
  input: AdminAddSubscriberInput,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = adminAddSubscriberSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid input.",
      };
    }

    const cleanEmail = parsed.data.email.toLowerCase().trim();

    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: parsed.data.status,
          source: parsed.data.source || "MANUAL",
        },
      });
    } else {
      await db.newsletterSubscriber.create({
        data: {
          email: cleanEmail,
          status: parsed.data.status,
          source: parsed.data.source || "MANUAL",
        },
      });
    }

    revalidatePath("/admin/support-marketing/marketing/newsletter");

    return {
      success: true,
      message: `Subscriber ${cleanEmail} saved successfully!`,
    };
  } catch (error) {
    console.error("[Action.Admin.Newsletter.Add] Error:", error);
    return { success: false, message: "Failed to add subscriber." };
  }
}

/**
 * Toggle subscriber status (SUBSCRIBED <-> UNSUBSCRIBED).
 */
export async function adminToggleSubscriberStatusAction(
  subscriberId: string,
  newStatus: NewsletterStatus,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    await db.newsletterSubscriber.update({
      where: { id: subscriberId },
      data: { status: newStatus },
    });

    revalidatePath("/admin/support-marketing/marketing/newsletter");

    return {
      success: true,
      message: `Subscriber status updated to ${newStatus}.`,
    };
  } catch (error) {
    console.error("[Action.Admin.Newsletter.Toggle] Error:", error);
    return { success: false, message: "Failed to update subscriber status." };
  }
}

/**
 * Delete a subscriber.
 */
export async function adminDeleteSubscriberAction(
  subscriberId: string,
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    await db.newsletterSubscriber.delete({
      where: { id: subscriberId },
    });

    revalidatePath("/admin/support-marketing/marketing/newsletter");

    return {
      success: true,
      message: "Subscriber removed successfully.",
    };
  } catch (error) {
    console.error("[Action.Admin.Newsletter.Delete] Error:", error);
    return { success: false, message: "Failed to delete subscriber." };
  }
}

import { sendEmail } from "@/lib/mail";

function buildNewsletterHtml(params: {
  subject: string;
  previewText?: string;
  message: string;
  recipientEmail: string;
}): string {
  const formattedMessage = params.message
    .split("\n\n")
    .map(
      (p) =>
        `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">${p.replace(
          /\n/g,
          "<br/>",
        )}</p>`,
    )
    .join("");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com";
  const unsubscribeUrl = `${appUrl}/unsubscribe?email=${encodeURIComponent(
    params.recipientEmail,
  )}`;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${params.subject}</title>
  ${
    params.previewText
      ? `<div style="display: none; max-height: 0px; overflow: hidden;">${params.previewText}</div>`
      : ""
  }
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e5e7eb;">
    <tr>
      <td style="background-color: #EDF5FA; padding: 28px; text-align: center; border-bottom: 2px solid #D4EEFC;">
        <span style="font-size: 26px; font-weight: 900; color: #56C8D8; letter-spacing: -0.5px;">MEAWLAND 🐾</span>
        <p style="margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">VIP Pet Parent Updates</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px 28px;">
        <h1 style="margin: 0 0 20px; font-size: 20px; font-weight: 800; color: #111827; line-height: 1.3;">
          ${params.subject}
        </h1>
        ${formattedMessage}
        <div style="margin-top: 28px; text-align: center;">
          <a href="${appUrl}" style="display: inline-block; background-color: #56C8D8; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 12px; box-shadow: 0 2px 4px rgba(86, 200, 216, 0.3);">
            Visit Meawland Store 🛍️
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color: #f9fafb; padding: 20px 28px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 11px; color: #9ca3af;">
        <p style="margin: 0 0 8px;">You are receiving this email because you subscribed to the Meawland VIP Club.</p>
        <p style="margin: 0;">
          <a href="${unsubscribeUrl}" style="color: #6b7280; text-decoration: underline;">
            Unsubscribe from newsletter
          </a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Broadcast email simulation / dispatch to active subscribers.
 */
export async function adminSendBroadcastAction(
  input: AdminBroadcastEmailInput,
): Promise<{
  success: boolean;
  message: string;
  recipientCount?: number;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = adminBroadcastEmailSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message:
          parsed.error.issues[0]?.message || "Invalid broadcast payload.",
      };
    }

    const { subject, previewText, message, targetAudience, testEmail } =
      parsed.data;

    let recipients: string[] = [];

    if (targetAudience === "TEST_ONLY") {
      if (!testEmail) {
        return {
          success: false,
          message: "Please provide a valid test email.",
        };
      }
      recipients = [testEmail];
    } else {
      const activeSubscribers = await db.newsletterSubscriber.findMany({
        where: { status: NewsletterStatus.SUBSCRIBED },
        select: { email: true },
      });
      recipients = activeSubscribers.map((s) => s.email);
    }

    if (recipients.length === 0) {
      return {
        success: false,
        message: "No active subscribers found to receive broadcast.",
      };
    }

    // Send emails in batches of 5
    const BATCH_SIZE = 5;
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map((email) => {
          const html = buildNewsletterHtml({
            subject,
            previewText,
            message,
            recipientEmail: email,
          });

          return sendEmail({
            to: email,
            subject,
            htmlContent: html,
            textContent: `${subject}\n\n${message}\n\nVisit: ${process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com"}`,
          });
        }),
      );
    }

    return {
      success: true,
      message:
        targetAudience === "TEST_ONLY"
          ? `Test email sent successfully to ${testEmail}!`
          : `Newsletter broadcast successfully dispatched to all ${recipients.length} active subscribers!`,
      recipientCount: recipients.length,
    };
  } catch (error) {
    console.error("[Action.Admin.Newsletter.Broadcast] Error:", error);
    return { success: false, message: "Failed to dispatch broadcast." };
  }
}
