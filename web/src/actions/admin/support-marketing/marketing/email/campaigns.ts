"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  EmailCampaignType,
  EmailCampaignStatus,
  EmailDeliveryStatus,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import { resolveEmailAudienceRecipients } from "./segments";
import { EmailAudienceFilter, AdminEmailCampaignSummary } from "./types";
import { sendEmail } from "@/lib/mail";
import { wrapEmailHtml } from "@/lib/email-templates";

export interface CreateEmailCampaignInput {
  title: string;
  subject: string;
  previewText?: string;
  contentHtml: string;
  contentText?: string;
  type?: EmailCampaignType;
  filters: EmailAudienceFilter;
  scheduleAt?: string | null;
}

/**
 * Fetch all email marketing campaigns
 */
export async function getEmailCampaignsAction(params?: {
  page?: number;
  pageSize?: number;
  status?: EmailCampaignStatus;
  search?: string;
}): Promise<{
  success: boolean;
  campaigns?: AdminEmailCampaignSummary[];
  total?: number;
  page?: number;
  pageSize?: number;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, campaigns: [], total: 0 };
    }

    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.min(100, Math.max(1, params?.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.search) {
      where.OR = [
        { title: { contains: params.search, mode: "insensitive" } },
        { subject: { contains: params.search, mode: "insensitive" } },
        { targetSegment: { contains: params.search, mode: "insensitive" } },
      ];
    }

    const [campaigns, total] = await Promise.all([
      db.emailCampaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.emailCampaign.count({ where }),
    ]);

    const formatted: AdminEmailCampaignSummary[] = campaigns.map((c) => ({
      id: c.id,
      title: c.title,
      subject: c.subject,
      previewText: c.previewText,
      type: c.type,
      status: c.status,
      targetSegment: c.targetSegment,
      totalRecipients: c.totalRecipients,
      sentCount: c.sentCount,
      failedCount: c.failedCount,
      scheduledAt: c.scheduledAt ? c.scheduledAt.toISOString() : null,
      completedAt: c.completedAt ? c.completedAt.toISOString() : null,
      createdAt: c.createdAt.toISOString(),
    }));

    return {
      success: true,
      campaigns: formatted,
      total,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("[Action.Email.GetCampaigns] Error:", error);
    return { success: false, campaigns: [], total: 0 };
  }
}

/**
 * Creates and initiates/schedules an email marketing campaign
 */
export async function createEmailCampaignAction(
  input: CreateEmailCampaignInput,
): Promise<{
  success: boolean;
  message: string;
  campaignId?: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    if (
      !input.title?.trim() ||
      !input.subject?.trim() ||
      !input.contentHtml?.trim()
    ) {
      return {
        success: false,
        message: "Title, Subject, and Email Content are required.",
      };
    }

    // 1. Resolve audience recipients
    const recipients = await resolveEmailAudienceRecipients(input.filters);
    if (recipients.length === 0) {
      return {
        success: false,
        message:
          "Audience segment resolved to 0 email recipients. Please expand your criteria.",
      };
    }

    const isScheduled =
      !!input.scheduleAt && new Date(input.scheduleAt) > new Date();

    // 2. Create campaign record
    const campaign = await db.emailCampaign.create({
      data: {
        title: input.title.trim(),
        subject: input.subject.trim(),
        previewText: input.previewText?.trim() || null,
        contentHtml: input.contentHtml,
        contentText: input.contentText || null,
        type: input.type || EmailCampaignType.PROMOTIONAL_FLASH,
        status: isScheduled
          ? EmailCampaignStatus.SCHEDULED
          : EmailCampaignStatus.SENDING,
        targetSegment: input.filters.targetType,
        segmentFilters: JSON.parse(JSON.stringify(input.filters)),
        totalRecipients: recipients.length,
        scheduledAt: isScheduled ? new Date(input.scheduleAt!) : null,
      },
    });

    // 3. If immediate, trigger dispatch asynchronously
    if (!isScheduled) {
      executeEmailCampaignDispatch(campaign.id, recipients, {
        subject: input.subject.trim(),
        previewText: input.previewText?.trim(),
        contentHtml: input.contentHtml,
        contentText: input.contentText,
      }).catch((err) => {
        console.error(
          `[EmailCampaign.Dispatch] Background error for ${campaign.id}:`,
          err,
        );
      });
    }

    revalidatePath("/admin/support-marketing/marketing/email");

    await recordAuditLog({
      action: AuditAction.BROADCAST_SENT,
      entity: AuditEntity.EMAIL,
      entityId: campaign.id,
      entityName: campaign.title,
      summary: `Email Campaign "${campaign.title}" launched to ${recipients.length} recipients. Subject: ${campaign.subject}`,
      severity:
        recipients.length > 500 ? AuditSeverity.WARNING : AuditSeverity.INFO,
      newState: {
        title: campaign.title,
        subject: campaign.subject,
        type: campaign.type,
        recipientsCount: recipients.length,
      },
      userId: session.id,
      path: "/admin/support-marketing/marketing/email",
    });

    return {
      success: true,
      message: isScheduled
        ? `Campaign "${input.title}" scheduled for ${new Date(input.scheduleAt!).toLocaleString()} (${recipients.length} recipients).`
        : `Campaign "${input.title}" created and broadcasting to ${recipients.length} recipients!`,
      campaignId: campaign.id,
    };
  } catch (error) {
    console.error("[Action.Email.CreateCampaign] Error:", error);
    return { success: false, message: "Failed to create email campaign." };
  }
}

/**
 * Background email dispatch engine (Batching & logging)
 */
export async function executeEmailCampaignDispatch(
  campaignId: string,
  recipients: Array<{ email: string; name: string; userId?: string | null }>,
  content: {
    subject: string;
    previewText?: string;
    contentHtml: string;
    contentText?: string;
  },
) {
  try {
    let sentCount = 0;
    let failedCount = 0;
    const BATCH_SIZE = 5;

    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const batch = recipients.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (r) => {
          // Replace template variables
          const personalizedHtml = content.contentHtml
            .replace(/\{name\}/gi, r.name || "Valued Customer")
            .replace(/\{email\}/gi, r.email)
            .replace(
              /\{storeUrl\}/gi,
              process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com",
            );

          const fullHtml = personalizedHtml.includes("<html")
            ? personalizedHtml
            : wrapEmailHtml({
                title: content.subject,
                previewText: content.previewText,
                bodyContent: personalizedHtml,
                recipientEmail: r.email,
                showUnsubscribe: true,
              });

          const res = await sendEmail({
            to: r.email,
            subject: content.subject.replace(
              /\{name\}/gi,
              r.name || "Customer",
            ),
            htmlContent: fullHtml,
            textContent: content.contentText
              ? content.contentText.replace(/\{name\}/gi, r.name || "Customer")
              : undefined,
          });

          if (res.success) {
            sentCount++;
            await db.emailLog.create({
              data: {
                campaignId,
                recipientEmail: r.email,
                recipientName: r.name,
                subject: content.subject,
                status: EmailDeliveryStatus.SENT,
                messageId: res.messageId || null,
                userId: r.userId || null,
              },
            });
          } else {
            failedCount++;
            await db.emailLog.create({
              data: {
                campaignId,
                recipientEmail: r.email,
                recipientName: r.name,
                subject: content.subject,
                status: EmailDeliveryStatus.FAILED,
                errorMessage: res.error || "Email delivery failed",
                userId: r.userId || null,
              },
            });
          }
        }),
      );
    }

    // Finalize campaign record
    await db.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status:
          failedCount === recipients.length
            ? EmailCampaignStatus.FAILED
            : EmailCampaignStatus.COMPLETED,
        sentCount,
        failedCount,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(
      `[EmailCampaign.Dispatch] Error in campaign ${campaignId}:`,
      error,
    );
    await db.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: EmailCampaignStatus.FAILED,
        completedAt: new Date(),
      },
    });
  }
}

/**
 * Deletes an email campaign
 */
export async function deleteEmailCampaignAction(campaignId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const existing = await db.emailCampaign.findUnique({
      where: { id: campaignId },
      select: { title: true, subject: true, totalRecipients: true },
    });

    await db.emailCampaign.delete({
      where: { id: campaignId },
    });

    revalidatePath("/admin/support-marketing/marketing/email");

    await recordAuditLog({
      action: AuditAction.DELETE,
      entity: AuditEntity.EMAIL,
      entityId: campaignId,
      entityName: existing?.title || "Email Campaign",
      summary: `Email Campaign "${existing?.title || campaignId}" deleted`,
      severity: AuditSeverity.INFO,
      previousState: {
        title: existing?.title,
        subject: existing?.subject,
        totalRecipients: existing?.totalRecipients,
      },
      userId: session.id,
      path: "/admin/support-marketing/marketing/email",
    });

    return {
      success: true,
      message: "Email campaign deleted successfully.",
    };
  } catch (error) {
    console.error("[Action.Email.DeleteCampaign] Error:", error);
    return { success: false, message: "Failed to delete email campaign." };
  }
}
