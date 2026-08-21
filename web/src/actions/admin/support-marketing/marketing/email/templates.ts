"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  EmailTemplateCategory,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import { AdminEmailTemplateSummary } from "./types";

const SEED_EMAIL_TEMPLATES = [
  {
    title: "VIP Pet Parent 15% OFF Exclusive",
    subject: "🐾 Exclusive 15% OFF for our VIP Pet Parent!",
    previewText: "Treat your furry friend to premium nutrition & treats today.",
    category: EmailTemplateCategory.PROMOTIONAL,
    variables: ["name", "storeUrl", "couponCode"],
    isDefault: true,
    htmlContent: `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #111827;">
        A Special Reward for You and Your Pet 🐾
      </h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
        Hi <strong>{name}</strong>,
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
        As one of our most valued pet parents, we want to pamper your companion! Use code <strong>VIPMEAW15</strong> at checkout to unlock 15% OFF across our entire catalog.
      </p>
      <div style="background-color: #EDF5FA; border: 2px dashed #56C8D8; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 22px; font-weight: 900; color: #56C8D8; letter-spacing: 2px;">VIPMEAW15</span>
        <p style="margin: 6px 0 0; font-size: 12px; color: #64748b;">Valid for the next 7 days on all products</p>
      </div>
      <div style="text-align: center; margin-top: 24px;">
        <a href="{storeUrl}" style="display: inline-block; background-color: #56C8D8; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
          Shop VIP Deals Now 🛍️
        </a>
      </div>
    `,
    textContent:
      "Hi {name}, enjoy 15% OFF with code VIPMEAW15! Visit: {storeUrl}",
  },
  {
    title: "Weekend Flash Sale 20% OFF Pet Food",
    subject: "⚡ 48-Hour Flash Sale: 20% OFF Premium Cat & Dog Food!",
    previewText: "Stock up on top imported food brands at unbeatable prices.",
    category: EmailTemplateCategory.PROMOTIONAL,
    variables: ["name", "storeUrl"],
    isDefault: true,
    htmlContent: `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #111827;">
        ⚡ 48-Hour Pet Food Flash Sale is LIVE!
      </h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
        Hi <strong>{name}</strong>,
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
        Running low on dry kibble, wet pouches, or gravy treats? Enjoy flat 20% OFF all imported cat and dog food brands this weekend only.
      </p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="{storeUrl}" style="display: inline-block; background-color: #56C8D8; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
          Grab Flash Deals 🛒
        </a>
      </div>
    `,
    textContent:
      "Hi {name}, 48-Hour Flash Sale: 20% OFF on all pet foods! Shop: {storeUrl}",
  },
  {
    title: "Abandoned Cart Recovery Reminder",
    subject: "🐾 Your pet's favorite items are waiting in your cart!",
    previewText: "Complete your order before your items go out of stock.",
    category: EmailTemplateCategory.ABANDONED_CART,
    variables: ["name", "storeUrl"],
    isDefault: true,
    htmlContent: `
      <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 800; color: #111827;">
        Did You Forget Something? 🐾
      </h2>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
        Hi <strong>{name}</strong>,
      </p>
      <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">
        We noticed you left some wonderful pet goodies in your shopping bag. We've safely saved your cart so you can pick up right where you left off!
      </p>
      <div style="text-align: center; margin-top: 28px;">
        <a href="{storeUrl}/cart" style="display: inline-block; background-color: #56C8D8; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
          Complete My Order 🛍️
        </a>
      </div>
    `,
    textContent:
      "Hi {name}, your pet essentials are waiting in your cart! Complete your order: {storeUrl}/cart",
  },
];

/**
 * Fetch all email templates with auto-seeding
 */
export async function getEmailTemplatesAction(): Promise<{
  success: boolean;
  templates?: AdminEmailTemplateSummary[];
}> {
  try {
    let templates = await db.emailTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (templates.length === 0) {
      for (const t of SEED_EMAIL_TEMPLATES) {
        await db.emailTemplate.create({
          data: t,
        });
      }
      templates = await db.emailTemplate.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    const formatted: AdminEmailTemplateSummary[] = templates.map((t) => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      previewText: t.previewText,
      category: t.category,
      htmlContent: t.htmlContent,
      textContent: t.textContent,
      variables: t.variables,
      isDefault: t.isDefault,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    }));

    return {
      success: true,
      templates: formatted,
    };
  } catch (error) {
    console.error("[Action.Email.GetTemplates] Error:", error);
    return { success: false, templates: [] };
  }
}

/**
 * Create a new email template
 */
export async function createEmailTemplateAction(input: {
  title: string;
  subject: string;
  previewText?: string;
  category: EmailTemplateCategory;
  htmlContent: string;
  textContent?: string;
  variables?: string[];
}): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    if (
      !input.title?.trim() ||
      !input.subject?.trim() ||
      !input.htmlContent?.trim()
    ) {
      return {
        success: false,
        message: "Title, Subject, and HTML Content are required.",
      };
    }

    await db.emailTemplate.create({
      data: {
        title: input.title.trim(),
        subject: input.subject.trim(),
        previewText: input.previewText?.trim() || null,
        category: input.category || EmailTemplateCategory.PROMOTIONAL,
        htmlContent: input.htmlContent,
        textContent: input.textContent || null,
        variables: input.variables || ["name", "storeUrl"],
      },
    });

    revalidatePath("/admin/support-marketing/marketing/email");

    await recordAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.EMAIL,
      entityName: input.title,
      summary: `Email Template "${input.title}" created (${input.category})`,
      severity: AuditSeverity.INFO,
      newState: {
        title: input.title,
        subject: input.subject,
        category: input.category,
      },
      userId: session.id,
      path: "/admin/support-marketing/marketing/email",
    });

    return {
      success: true,
      message: `Email template "${input.title}" saved successfully!`,
    };
  } catch (error) {
    console.error("[Action.Email.CreateTemplate] Error:", error);
    return { success: false, message: "Failed to create email template." };
  }
}

/**
 * Delete an email template
 */
export async function deleteEmailTemplateAction(templateId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    await db.emailTemplate.delete({
      where: { id: templateId },
    });

    revalidatePath("/admin/support-marketing/marketing/email");

    await recordAuditLog({
      action: AuditAction.DELETE,
      entity: AuditEntity.EMAIL,
      entityId: templateId,
      summary: `Email Template was deleted`,
      severity: AuditSeverity.INFO,
      userId: session.id,
      path: "/admin/support-marketing/marketing/email",
    });

    return {
      success: true,
      message: "Template deleted successfully.",
    };
  } catch (error) {
    console.error("[Action.Email.DeleteTemplate] Error:", error);
    return { success: false, message: "Failed to delete email template." };
  }
}
