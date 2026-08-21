"use server";

import { env } from "@/env";
import { getBkashToken } from "@/actions/bkash/grant-token";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

export type BkashSearchTransactionResponse = {
  statusCode: string;
  statusMessage: string;
  trxID: string;
  transactionStatus: string;
  transactionType: string;
  amount: string;
  currency: string;
  customerMsisdn: string;
  organizationShortCode: string;
  initiationTime: string;
  completedTime: string;
  transactionReference?: string;
};

type BkashSearchTransactionErrorResponse = {
  statusCode?: string;
  statusMessage?: string;
  errorCode?: string;
  errorMessage?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// Search Transaction Action
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Searches for detailed information about a specific bKash transaction
 * using the `trxID` obtained from the Execute Payment API response.
 *
 * Returns comprehensive transaction details including customer MSISDN,
 * initiation/completion times, and organization info. Useful for admin
 * reconciliation, dispute resolution, and order verification.
 */
export async function searchBkashTransactionAction(trxID: string): Promise<{
  success: boolean;
  message?: string;
  data?: BkashSearchTransactionResponse;
}> {
  try {
    if (!trxID) {
      return {
        success: false,
        message: "Transaction ID is required to search a bKash transaction.",
      };
    }

    const idToken = await getBkashToken();
    if (!idToken) {
      return {
        success: false,
        message: "Failed to authenticate with bKash. Please try again.",
      };
    }

    const response = await fetch(
      `${env.BKASH_BASE_URL}/tokenized/checkout/general/searchTransaction`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: idToken,
          "X-App-Key": env.BKASH_APP_KEY,
        },
        body: JSON.stringify({ trxID }),
        cache: "no-store",
      },
    );

    const data = (await response.json()) as
      BkashSearchTransactionResponse | BkashSearchTransactionErrorResponse;

    if (!response.ok || !("trxID" in data)) {
      const errorData = data as BkashSearchTransactionErrorResponse;
      console.error("[Actions.Bkash.SearchTransaction] API error:", errorData);
      return {
        success: false,
        message:
          errorData.statusMessage ||
          errorData.errorMessage ||
          "Failed to search bKash transaction.",
      };
    }

    const searchData = data as BkashSearchTransactionResponse;

    if (searchData.statusCode !== "0000") {
      console.error(
        "[Actions.Bkash.SearchTransaction] Non-success status:",
        searchData,
      );
      return {
        success: false,
        message:
          searchData.statusMessage || "Failed to search bKash transaction.",
      };
    }

    return {
      success: true,
      data: searchData,
    };
  } catch (error) {
    console.error("[Actions.Bkash.SearchTransaction]:", error);
    return {
      success: false,
      message: "Failed to search bKash transaction. Please try again.",
    };
  }
}
