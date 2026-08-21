"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getMeAction } from "@/actions/auth/get-me";
import { Role, EmailDeliveryStatus } from "@/generated/prisma/enums";
import { AdminEmailLogSummary } from "./types";
import { sendEmail } from "@/lib/mail";

/**
 * Fetch delivery audit logs for email dispatches
 */
export async function getEmailLogsAction(params?: {
  page?: number;
  pageSize?: number;
  status?: EmailDeliveryStatus;
  search?: string;
}): Promise<{
  success: boolean;
  logs?: AdminEmailLogSummary[];
  total?: number;
  page?: number;
  pageSize?: number;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, logs: [], total: 0 };
    }

    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.min(100, Math.max(1, params?.pageSize || 30));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};
    if (params?.status) {
      where.status = params.status;
    }
    if (params?.search) {
      where.OR = [
        { recipientEmail: { contains: params.search, mode: "insensitive" } },
        { recipientName: { contains: params.search, mode: "insensitive" } },
        { subject: { contains: params.search, mode: "insensitive" } },
        { order: { code: { contains: params.search, mode: "insensitive" } } },
      ];
    }

    const [logs, total] = await Promise.all([
      db.emailLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          campaign: { select: { title: true } },
          order: { select: { code: true } },
        },
        skip,
        take: pageSize,
      }),
      db.emailLog.count({ where }),
    ]);

    const formatted: AdminEmailLogSummary[] = logs.map((l) => ({
      id: l.id,
      recipientEmail: l.recipientEmail,
      recipientName: l.recipientName,
      subject: l.subject,
      status: l.status,
      messageId: l.messageId,
      errorMessage: l.errorMessage,
      campaignId: l.campaignId,
      campaignTitle: l.campaign?.title || null,
      orderId: l.orderId,
      orderCode: l.order?.code || null,
      createdAt: l.createdAt.toISOString(),
    }));

    return {
      success: true,
      logs: formatted,
      total,
      page,
      pageSize,
    };
  } catch (error) {
    console.error("[Action.Email.GetLogs] Error:", error);
    return { success: false, logs: [], total: 0 };
  }
}

/**
 * Retry a single failed email dispatch
 */
export async function retryFailedEmailLogAction(logId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const log = await db.emailLog.findUnique({
      where: { id: logId },
      include: { campaign: true },
    });

    if (!log) {
      return { success: false, message: "Log record not found." };
    }

    const html =
      log.campaign?.contentHtml ||
      `<p>Retrying email dispatch: ${log.subject}</p>`;

    const res = await sendEmail({
      to: log.recipientEmail,
      subject: log.subject,
      htmlContent: html,
    });

    if (res.success) {
      await db.emailLog.update({
        where: { id: logId },
        data: {
          status: EmailDeliveryStatus.SENT,
          messageId: res.messageId || null,
          errorMessage: null,
        },
      });

      revalidatePath("/admin/support-marketing/marketing/email");

      return {
        success: true,
        message: `Email to ${log.recipientEmail} resent successfully!`,
      };
    } else {
      await db.emailLog.update({
        where: { id: logId },
        data: {
          status: EmailDeliveryStatus.FAILED,
          errorMessage: res.error || "Retry failed",
        },
      });

      return {
        success: false,
        message: `Retry failed: ${res.error || "Unknown error"}`,
      };
    }
  } catch (error) {
    console.error("[Action.Email.RetryLog] Error:", error);
    return {
      success: false,
      message: "An unexpected error occurred during retry.",
    };
  }
}
