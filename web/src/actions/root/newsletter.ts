"use server";

import db from "@/lib/db";
import {
  NewsletterStatus,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import {
  subscribeNewsletterSchema,
  unsubscribeNewsletterSchema,
} from "@/schemas/root/newsletter";
import { recordAuditLog } from "@/lib/audit-logger";
import { trackMetaLeadAction } from "@/actions/meta";
import { revalidatePath } from "next/cache";

/**
 * Subscribe customer email to the newsletter.
 */
export async function subscribeNewsletterAction(
  email: string,
  source: string = "FOOTER",
): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const parsed = subscribeNewsletterSchema.safeParse({ email, source });
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid email address.",
      };
    }

    const cleanEmail = parsed.data.email.toLowerCase().trim();

    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: cleanEmail },
    });

    if (existing) {
      if (existing.status === NewsletterStatus.SUBSCRIBED) {
        return {
          success: true,
          message: "You're already subscribed to Meawland VIP updates! 🐾",
        };
      }

      // Reactivate previously unsubscribed
      await db.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: NewsletterStatus.SUBSCRIBED,
          source: parsed.data.source,
        },
      });

      revalidatePath("/admin/support-marketing/marketing/newsletter");

      return {
        success: true,
        message: "Welcome back! Your subscription has been reactivated. 🐾",
      };
    }

    await db.newsletterSubscriber.create({
      data: {
        email: cleanEmail,
        status: NewsletterStatus.SUBSCRIBED,
        source: parsed.data.source,
      },
    });

    revalidatePath("/admin/support-marketing/marketing/newsletter");

    // Track Meta CAPI Lead Event
    trackMetaLeadAction({
      leadType: "NEWSLETTER",
      email: cleanEmail,
    }).catch((err) => {
      console.error("[Action.Newsletter] Meta CAPI Lead error:", err);
    });

    await recordAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.NEWSLETTER,
      entityName: cleanEmail,
      summary: `Newsletter subscription received for "${cleanEmail}" (Source: ${parsed.data.source})`,
      severity: AuditSeverity.INFO,
      newState: {
        email: cleanEmail,
        source: parsed.data.source,
        status: "SUBSCRIBED",
      },
      path: "/newsletter",
    }).catch(() => {});

    return {
      success: true,
      message: "Thank you for subscribing to Meawland VIP updates! 🐾",
    };
  } catch (error) {
    console.error("[Action.Newsletter.Subscribe] Error:", error);
    return {
      success: false,
      message: "Failed to process newsletter subscription. Please try again.",
    };
  }
}

/**
 * Self-service unsubscribe from newsletter.
 */
export async function unsubscribeNewsletterAction(email: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const parsed = unsubscribeNewsletterSchema.safeParse({ email });
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid email address.",
      };
    }

    const cleanEmail = parsed.data.email.toLowerCase().trim();

    const existing = await db.newsletterSubscriber.findUnique({
      where: { email: cleanEmail },
    });

    if (!existing || existing.status === NewsletterStatus.UNSUBSCRIBED) {
      return {
        success: true,
        message: "This email is not currently subscribed to our newsletter.",
      };
    }

    await db.newsletterSubscriber.update({
      where: { id: existing.id },
      data: {
        status: NewsletterStatus.UNSUBSCRIBED,
      },
    });

    revalidatePath("/admin/support-marketing/marketing/newsletter");

    await recordAuditLog({
      action: AuditAction.STATUS_CHANGE,
      entity: AuditEntity.NEWSLETTER,
      entityName: cleanEmail,
      summary: `Newsletter unsubscribed for "${cleanEmail}"`,
      severity: AuditSeverity.INFO,
      newState: { email: cleanEmail, status: "UNSUBSCRIBED" },
      path: "/unsubscribe",
    }).catch(() => {});

    return {
      success: true,
      message:
        "You have been successfully unsubscribed from Meawland newsletter.",
    };
  } catch (error) {
    console.error("[Action.Newsletter.Unsubscribe] Error:", error);
    return {
      success: false,
      message: "Failed to unsubscribe. Please contact support.",
    };
  }
}
