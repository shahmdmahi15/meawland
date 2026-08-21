"use server";

import db from "@/lib/db";
import { env } from "@/env";
import {
  SmsCampaignStatus,
  SmsCampaignType,
  SmsDeliveryStatus,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import {
  CreateSmsCampaignSchema,
  type CreateSmsCampaignInput,
  type AdminSmsCampaignSummary,
} from "./types";
import { resolveAudienceRecipients } from "./segments";
import { sendManySmsAction } from "@/actions/sms/send-many-sms";
import { revalidatePath } from "next/cache";

/**
 * Retrieves all SMS marketing campaigns
 */
export async function getSmsCampaignsAction(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SmsCampaignStatus | "ALL";
  type?: SmsCampaignType | "ALL";
}): Promise<{
  success: boolean;
  campaigns: AdminSmsCampaignSummary[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const page = Math.max(1, options?.page || 1);
    const pageSize = Math.max(1, Math.min(100, options?.pageSize || 15));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (options?.search?.trim()) {
      where.OR = [
        { title: { contains: options.search.trim(), mode: "insensitive" } },
        { message: { contains: options.search.trim(), mode: "insensitive" } },
      ];
    }

    if (options?.status && options.status !== "ALL") {
      where.status = options.status;
    }

    if (options?.type && options.type !== "ALL") {
      where.type = options.type;
    }

    const [rawCampaigns, total] = await Promise.all([
      db.smsCampaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.smsCampaign.count({ where }),
    ]);

    const campaigns: AdminSmsCampaignSummary[] = rawCampaigns.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      status: c.status,
      message: c.message,
      senderId: c.senderId,
      targetSegment: c.targetSegment,
      segmentFilters:
        c.segmentFilters as AdminSmsCampaignSummary["segmentFilters"],
      totalRecipients: c.totalRecipients,
      sentCount: c.sentCount,
      failedCount: c.failedCount,
      estimatedCost: c.estimatedCost,
      actualCost: c.actualCost,
      scheduledAt: c.scheduledAt,
      completedAt: c.completedAt,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return {
      success: true,
      campaigns,
      total,
      page,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch (error) {
    console.error("[Action.SMS.GetCampaigns] Error:", error);
    return {
      success: false,
      campaigns: [],
      total: 0,
      page: 1,
      totalPages: 1,
    };
  }
}

/**
 * Creates and optionally executes or schedules a new SMS marketing campaign
 */
export async function createSmsCampaignAction(
  input: CreateSmsCampaignInput,
): Promise<{
  success: boolean;
  message?: string;
  campaignId?: string;
}> {
  try {
    const validated = CreateSmsCampaignSchema.safeParse(input);
    if (!validated.success) {
      return {
        success: false,
        message:
          validated.error.issues[0]?.message || "Invalid campaign input.",
      };
    }

    const data = validated.data;
    const recipients = await resolveAudienceRecipients(data.filters);

    if (recipients.length === 0) {
      return {
        success: false,
        message: "No recipients matched the chosen audience criteria.",
      };
    }

    // Cost estimation (approx 0.35 BDT per SMS part)
    const charLength = data.message.length;
    const isUnicode = /[^\u0000-\u007f]/.test(data.message);
    const maxCharsPerSms = isUnicode ? 70 : 160;
    const partsPerMsg = Math.max(1, Math.ceil(charLength / maxCharsPerSms));
    const estimatedCost = (recipients.length * partsPerMsg * 0.35).toFixed(2);

    const isScheduled =
      !!data.scheduleAt && new Date(data.scheduleAt) > new Date();

    const campaign = await db.smsCampaign.create({
      data: {
        title: data.title.trim(),
        type: data.type,
        status: isScheduled
          ? SmsCampaignStatus.SCHEDULED
          : SmsCampaignStatus.PROCESSING,
        message: data.message.trim(),
        senderId: data.senderId || env.SMS_SENDER_ID,
        targetSegment: data.filters.targetType,
        segmentFilters: data.filters,
        totalRecipients: recipients.length,
        estimatedCost,
        scheduledAt: isScheduled ? new Date(data.scheduleAt!) : null,
      },
    });

    // If not scheduled for later, execute immediately
    if (!isScheduled) {
      // Execute in background
      executeCampaignDispatch(
        campaign.id,
        recipients,
        data.message,
        data.senderId,
      );
    }

    revalidatePath("/admin/support-marketing/marketing/sms");

    // Record Audit Log
    await recordAuditLog({
      action: AuditAction.BROADCAST_SENT,
      entity: AuditEntity.SMS,
      entityId: campaign.id,
      entityName: campaign.title,
      summary: `SMS Campaign "${campaign.title}" launched to ${recipients.length} recipients. Est Cost: ৳${estimatedCost}`,
      severity:
        recipients.length > 500 ? AuditSeverity.WARNING : AuditSeverity.INFO,
      newState: {
        title: campaign.title,
        type: campaign.type,
        recipientsCount: recipients.length,
        estimatedCost,
      },
      path: "/admin/support-marketing/marketing/sms",
    });

    return {
      success: true,
      message: isScheduled
        ? `Campaign scheduled for ${new Date(data.scheduleAt!).toLocaleString()}.`
        : `Campaign created and broadcast started to ${recipients.length} recipients.`,
      campaignId: campaign.id,
    };
  } catch (error) {
    console.error("[Action.SMS.CreateCampaign] Error:", error);
    return {
      success: false,
      message: "Failed to create SMS campaign.",
    };
  }
}

/**
 * Executes campaign dispatch in chunks, injecting dynamic customer variables
 */
async function executeCampaignDispatch(
  campaignId: string,
  recipients: Array<{
    phone: string;
    name: string;
    userId?: string | null;
    orderId?: string | null;
    district?: string | null;
  }>,
  rawTemplate: string,
  senderId?: string,
) {
  try {
    let sentCount = 0;
    let failedCount = 0;

    // Process in batches of 50
    const batchSize = 50;

    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const messages = batch.map((r) => {
        let msg = rawTemplate;
        msg = msg.replace(/\{name\}/gi, r.name || "Customer");
        msg = msg.replace(/\{phone\}/gi, r.phone);
        msg = msg.replace(/\{district\}/gi, r.district || "Bangladesh");
        msg = msg.replace(/\{storeUrl\}/gi, env.NEXT_PUBLIC_APP_URL);
        return {
          to: r.phone,
          message: msg,
          recipientName: r.name,
          userId: r.userId,
          orderId: r.orderId,
        };
      });

      const res = await sendManySmsAction({
        messages: messages.map((m) => ({ to: m.to, message: m.message })),
        senderId,
      });

      const isBatchSuccess = res.success;

      // Log results in database
      await db.smsLog.createMany({
        data: messages.map((m) => ({
          campaignId,
          recipientPhone: m.to,
          recipientName: m.recipientName,
          message: m.message,
          status: isBatchSuccess
            ? SmsDeliveryStatus.SUBMITTED
            : SmsDeliveryStatus.FAILED,
          responseCode: isBatchSuccess ? 202 : 1005,
          statusMessage: res.message || (isBatchSuccess ? "Sent" : "Failed"),
          rawResponse: res.data ? (res.data as object) : undefined,
          userId: m.userId || undefined,
          orderId: m.orderId || undefined,
        })),
      });

      if (isBatchSuccess) {
        sentCount += batch.length;
      } else {
        failedCount += batch.length;
      }
    }

    // Finalize campaign record
    await db.smsCampaign.update({
      where: { id: campaignId },
      data: {
        status:
          failedCount === recipients.length
            ? SmsCampaignStatus.FAILED
            : SmsCampaignStatus.COMPLETED,
        sentCount,
        failedCount,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(
      `[Campaign.Dispatch] Error in campaign ${campaignId}:`,
      error,
    );
    await db.smsCampaign.update({
      where: { id: campaignId },
      data: {
        status: SmsCampaignStatus.FAILED,
        completedAt: new Date(),
      },
    });
  }
}

/**
 * Deletes a draft, failed, or completed campaign
 */
export async function deleteSmsCampaignAction(campaignId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const existing = await db.smsCampaign.findUnique({
      where: { id: campaignId },
      select: { title: true, totalRecipients: true },
    });

    await db.smsCampaign.delete({
      where: { id: campaignId },
    });

    revalidatePath("/admin/support-marketing/marketing/sms");

    await recordAuditLog({
      action: AuditAction.DELETE,
      entity: AuditEntity.SMS,
      entityId: campaignId,
      entityName: existing?.title || "SMS Campaign",
      summary: `SMS Campaign "${existing?.title || campaignId}" deleted`,
      severity: AuditSeverity.INFO,
      previousState: {
        title: existing?.title,
        totalRecipients: existing?.totalRecipients,
      },
      path: "/admin/support-marketing/marketing/sms",
    });

    return {
      success: true,
      message: "Campaign deleted successfully.",
    };
  } catch (error) {
    console.error("[Action.SMS.DeleteCampaign] Error:", error);
    return {
      success: false,
      message: "Failed to delete campaign.",
    };
  }
}
