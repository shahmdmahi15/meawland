"use server";

import { env } from "@/env";
import type {
  SingleSmsInput,
  BulkSmsInput,
  SmsApiResponse,
} from "./types";
import {
  sanitizeBangladeshiPhoneNumber,
  sanitizePhoneNumbers,
  getSmsErrorMessage,
  getSmsBaseUrl,
} from "./client";

/**
 * Sends a single SMS to a recipient phone number via BulkSMSBD API
 */
export async function sendSingleSmsAction(
  input: SingleSmsInput,
): Promise<{
  success: boolean;
  message?: string;
  data?: SmsApiResponse;
}> {
  try {
    if (!input.recipient || !input.message?.trim()) {
      return {
        success: false,
        message: "Recipient phone number and message body are required.",
      };
    }

    const sanitizedPhone = sanitizeBangladeshiPhoneNumber(input.recipient);
    if (!sanitizedPhone) {
      return {
        success: false,
        message: `Invalid Bangladeshi mobile number: "${input.recipient}". Must be 11 digits (e.g. 017XXXXXXXX).`,
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

    const response = await fetch(`${baseUrl}/smsapi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        senderid: senderId,
        number: sanitizedPhone,
        message: input.message.trim(),
      }),
      cache: "no-store",
    });

    const data = (await response.json()) as SmsApiResponse;

    const responseCode = Number(data.response_code || data.status_code);

    if (responseCode === 202) {
      return {
        success: true,
        message: data.success_message || "SMS submitted successfully.",
        data,
      };
    }

    const errorMessage =
      data.error_message ||
      getSmsErrorMessage(responseCode) ||
      "Failed to send SMS.";

    console.error("[Actions.SMS.SendSingle] API Error:", data);

    return {
      success: false,
      message: errorMessage,
      data,
    };
  } catch (error) {
    console.error("[Actions.SMS.SendSingle] Exception:", error);
    return {
      success: false,
      message: "Failed to connect to SMS gateway. Please try again.",
    };
  }
}

/**
 * Sends a single message to multiple phone numbers (One-to-Many Bulk SMS)
 */
export async function sendBulkSmsAction(
  input: BulkSmsInput,
): Promise<{
  success: boolean;
  message?: string;
  sentCount?: number;
  data?: SmsApiResponse;
}> {
  try {
    if (!input.recipients || input.recipients.length === 0 || !input.message?.trim()) {
      return {
        success: false,
        message: "At least one recipient and a message body are required.",
      };
    }

    const sanitizedNumbers = sanitizePhoneNumbers(input.recipients);
    if (sanitizedNumbers.length === 0) {
      return {
        success: false,
        message: "No valid Bangladeshi phone numbers found in recipients list.",
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

    // Bulk numbers separated by comma (e.g. "88017xxxxxxxx,88018xxxxxxxx")
    const commaSeparatedNumbers = sanitizedNumbers.join(",");

    const response = await fetch(`${baseUrl}/smsapi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        senderid: senderId,
        number: commaSeparatedNumbers,
        message: input.message.trim(),
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
          `Bulk SMS submitted successfully to ${sanitizedNumbers.length} recipients.`,
        sentCount: sanitizedNumbers.length,
        data,
      };
    }

    const errorMessage =
      data.error_message ||
      getSmsErrorMessage(responseCode) ||
      "Failed to send Bulk SMS.";

    console.error("[Actions.SMS.SendBulk] API Error:", data);

    return {
      success: false,
      message: errorMessage,
      data,
    };
  } catch (error) {
    console.error("[Actions.SMS.SendBulk] Exception:", error);
    return {
      success: false,
      message: "Failed to connect to SMS gateway for bulk dispatch.",
    };
  }
}
