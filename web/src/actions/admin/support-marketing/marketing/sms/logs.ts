"use server";

import db from "@/lib/db";
import { SmsDeliveryStatus } from "@/generated/prisma/enums";
import type { AdminSmsLogSummary } from "./types";
import { sendSingleSmsAction } from "@/actions/sms/send-sms";
import { revalidatePath } from "next/cache";

/**
 * Retrieves paginated SMS delivery audit logs
 */
export async function getSmsLogsAction(options?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SmsDeliveryStatus | "ALL";
}): Promise<{
  success: boolean;
  logs: AdminSmsLogSummary[];
  total: number;
  page: number;
  totalPages: number;
}> {
  try {
    const page = Math.max(1, options?.page || 1);
    const pageSize = Math.max(1, Math.min(100, options?.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const where: Record<string, unknown> = {};

    if (options?.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { recipientPhone: { contains: q } },
        { recipientName: { contains: q, mode: "insensitive" } },
        { message: { contains: q, mode: "insensitive" } },
      ];
    }

    if (options?.status && options.status !== "ALL") {
      where.status = options.status;
    }

    const [rawLogs, total] = await Promise.all([
      db.smsLog.findMany({
        where,
        include: {
          campaign: { select: { title: true } },
          order: { select: { code: true } },
          user: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.smsLog.count({ where }),
    ]);

    const logs: AdminSmsLogSummary[] = rawLogs.map((l) => ({
      id: l.id,
      recipientPhone: l.recipientPhone,
      recipientName: l.recipientName,
      message: l.message,
      status: l.status,
      responseCode: l.responseCode,
      statusMessage: l.statusMessage,
      campaignId: l.campaignId,
      campaignTitle: l.campaign?.title,
      orderId: l.orderId,
      orderCode: l.order?.code,
      userId: l.userId,
      userName: l.user?.name,
      createdAt: l.createdAt,
    }));

    return {
      success: true,
      logs,
      total,
      page,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch (error) {
    console.error("[Action.SMS.GetLogs] Error:", error);
    return {
      success: false,
      logs: [],
      total: 0,
      page: 1,
      totalPages: 1,
    };
  }
}

/**
 * Retries dispatching a failed SMS log item
 */
export async function retryFailedSmsLogAction(logId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    const logItem = await db.smsLog.findUnique({
      where: { id: logId },
    });

    if (!logItem) {
      return {
        success: false,
        message: "SMS log record not found.",
      };
    }

    const res = await sendSingleSmsAction({
      recipient: logItem.recipientPhone,
      message: logItem.message,
    });

    await db.smsLog.update({
      where: { id: logId },
      data: {
        status: res.success ? SmsDeliveryStatus.SUBMITTED : SmsDeliveryStatus.FAILED,
        responseCode: res.data?.response_code ? Number(res.data.response_code) : undefined,
        statusMessage: res.message,
        rawResponse: res.data ? (res.data as object) : undefined,
      },
    });

    revalidatePath("/admin/support-marketing/marketing/sms");

    return {
      success: res.success,
      message: res.message || (res.success ? "SMS resent successfully." : "Retry failed."),
    };
  } catch (error) {
    console.error("[Action.SMS.RetryLog] Error:", error);
    return {
      success: false,
      message: "Failed to retry sending SMS.",
    };
  }
}
