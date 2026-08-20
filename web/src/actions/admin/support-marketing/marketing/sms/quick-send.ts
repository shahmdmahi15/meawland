"use server";

import db from "@/lib/db";
import { SmsDeliveryStatus } from "@/generated/prisma/enums";
import { sendBulkSmsAction, sendSingleSmsAction } from "@/actions/sms/send-sms";
import { sanitizePhoneNumbers } from "@/actions/sms/client";
import { revalidatePath } from "next/cache";

/**
 * Sends an instant custom SMS to one or more recipient numbers and records audit logs
 */
export async function sendQuickDirectSmsAction(input: {
  recipients: string; // Comma or newline separated
  message: string;
  senderId?: string;
}): Promise<{
  success: boolean;
  message?: string;
  sentCount?: number;
}> {
  try {
    if (!input.recipients?.trim() || !input.message?.trim()) {
      return {
        success: false,
        message: "Recipients and message content are required.",
      };
    }

    const rawList = input.recipients
      .split(/[\n,;]+/)
      .map((n) => n.trim())
      .filter(Boolean);

    const sanitizedNumbers = sanitizePhoneNumbers(rawList);

    if (sanitizedNumbers.length === 0) {
      return {
        success: false,
        message:
          "No valid Bangladeshi phone numbers found. Please check format (e.g. 017XXXXXXXX).",
      };
    }

    if (sanitizedNumbers.length === 1) {
      const phone = sanitizedNumbers[0];
      const res = await sendSingleSmsAction({
        recipient: phone,
        message: input.message.trim(),
        senderId: input.senderId,
      });

      await db.smsLog.create({
        data: {
          recipientPhone: phone,
          recipientName: "Direct Recipient",
          message: input.message.trim(),
          status: res.success
            ? SmsDeliveryStatus.SUBMITTED
            : SmsDeliveryStatus.FAILED,
          responseCode: res.data?.response_code
            ? Number(res.data.response_code)
            : undefined,
          statusMessage: res.message,
          rawResponse: res.data ? (res.data as object) : undefined,
        },
      });

      revalidatePath("/admin/support-marketing/marketing/sms");

      return {
        success: res.success,
        message:
          res.message ||
          (res.success
            ? "SMS submitted successfully."
            : "Failed to send SMS."),
        sentCount: res.success ? 1 : 0,
      };
    }

    // Bulk One-to-Many
    const res = await sendBulkSmsAction({
      recipients: sanitizedNumbers,
      message: input.message.trim(),
      senderId: input.senderId,
    });

    const isSuccess = res.success;

    await db.smsLog.createMany({
      data: sanitizedNumbers.map((phone) => ({
        recipientPhone: phone,
        recipientName: "Direct Recipient",
        message: input.message.trim(),
        status: isSuccess
          ? SmsDeliveryStatus.SUBMITTED
          : SmsDeliveryStatus.FAILED,
        responseCode: res.data?.response_code
          ? Number(res.data.response_code)
          : undefined,
        statusMessage: res.message,
        rawResponse: res.data ? (res.data as object) : undefined,
      })),
    });

    revalidatePath("/admin/support-marketing/marketing/sms");

    return {
      success: isSuccess,
      message:
        res.message ||
        (isSuccess
          ? `SMS broadcast submitted to ${sanitizedNumbers.length} recipients.`
          : "Failed to dispatch bulk SMS."),
      sentCount: isSuccess ? sanitizedNumbers.length : 0,
    };
  } catch (error) {
    console.error("[Action.SMS.SendQuick] Error:", error);
    return {
      success: false,
      message: "An unexpected error occurred while sending SMS.",
    };
  }
}
