"use server";

import { env } from "@/env";
import type { ManySmsInput, ManySmsMessageItem, SmsApiResponse } from "./types";
import {
  sanitizeBangladeshiPhoneNumber,
  getSmsErrorMessage,
  getSmsBaseUrl,
} from "./client";

/**
 * Sends distinct personalized messages to multiple recipients (Many-to-Many SMS)
 */
export async function sendManySmsAction(input: ManySmsInput): Promise<{
  success: boolean;
  message?: string;
  sentCount?: number;
  data?: SmsApiResponse;
}> {
  try {
    if (!input.messages || input.messages.length === 0) {
      return {
        success: false,
        message: "Messages list cannot be empty.",
      };
    }

    const sanitizedMessages: ManySmsMessageItem[] = [];

    for (const item of input.messages) {
      const sanitizedPhone = sanitizeBangladeshiPhoneNumber(item.to);
      if (sanitizedPhone && item.message?.trim()) {
        sanitizedMessages.push({
          to: sanitizedPhone,
          message: item.message.trim(),
        });
      }
    }

    if (sanitizedMessages.length === 0) {
      return {
        success: false,
        message: "No valid recipients and messages found in payload.",
      };
    }

    const apiKey = env.SMS_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        message: "SMS API Key is not configured in environment.",
      };
    }

    const senderId = input.senderId || env.SMS_SENDER_ID || "8809648910523";
    const baseUrl = getSmsBaseUrl();

    const response = await fetch(`${baseUrl}/smsapimany`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        senderid: senderId,
        messages: sanitizedMessages,
      }),
      cache: "no-store",
    });

    const data = (await response.json()) as SmsApiResponse;
    const responseCode = Number(data.response_code || data.status_code);

    if (responseCode === 202) {
      return {
        success: true,
        message:
          data.success_message ||
          `Many-to-many SMS batch submitted successfully (${sanitizedMessages.length} messages).`,
        sentCount: sanitizedMessages.length,
        data,
      };
    }

    const errorMessage =
      data.error_message ||
      getSmsErrorMessage(responseCode) ||
      "Failed to send Many-to-Many SMS batch.";

    console.error("[Actions.SMS.SendMany] API Error:", data);

    return {
      success: false,
      message: errorMessage,
      data,
    };
  } catch (error) {
    console.error("[Actions.SMS.SendMany] Exception:", error);
    return {
      success: false,
      message:
        "Failed to connect to SMS gateway for personalized batch dispatch.",
    };
  }
}
