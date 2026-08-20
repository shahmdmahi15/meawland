"use server";

import { env } from "@/env";
import type { SmsBalanceResponse } from "./types";
import { getSmsErrorMessage, getSmsBaseUrl } from "./client";

/**
 * Queries remaining SMS credit balance from BulkSMSBD API
 */
export async function getSmsBalanceAction(): Promise<{
  success: boolean;
  balance?: number;
  message?: string;
  data?: SmsBalanceResponse;
}> {
  try {
    const apiKey = env.SMS_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        message: "SMS API Key is not configured in environment.",
      };
    }

    const baseUrl = getSmsBaseUrl();

    // The API supports both GET and POST with api_key
    const response = await fetch(
      `${baseUrl}/getBalanceApi?api_key=${encodeURIComponent(apiKey)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      },
    );

    const data = (await response.json()) as SmsBalanceResponse;

    const responseCode = Number(data.response_code);

    // Some responses return response_code === 202, or a raw balance property
    const rawBalance = data.balance ?? data.user_balance;

    if (responseCode === 202 || rawBalance !== undefined) {
      const parsedBalance =
        typeof rawBalance === "number"
          ? rawBalance
          : parseFloat(String(rawBalance || "0"));

      return {
        success: true,
        balance: isNaN(parsedBalance) ? 0 : parsedBalance,
        message: data.message || `Current SMS balance: ${parsedBalance}`,
        data,
      };
    }

    const errorMessage =
      data.error_message ||
      data.message ||
      getSmsErrorMessage(responseCode) ||
      "Failed to retrieve SMS balance.";

    console.error("[Actions.SMS.GetBalance] API Error:", data);

    return {
      success: false,
      message: errorMessage,
      data,
    };
  } catch (error) {
    console.error("[Actions.SMS.GetBalance] Exception:", error);
    return {
      success: false,
      message: "Failed to connect to SMS balance gateway.",
    };
  }
}
