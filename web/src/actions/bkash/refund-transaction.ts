"use server";

import { env } from "@/env";
import { getBkashToken } from "@/actions/bkash/grant-token";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

export type BkashRefundTransactionInput = {
  paymentId: string;
  trxId: string;
  refundAmount: string;
  sku: string;
  reason: string;
};

export type BkashRefundTransactionResponse = {
  originalTrxId: string;
  refundTrxId: string;
  refundTransactionStatus: string;
  refundAmount: string;
  currency: string;
  completedTime: string;
  statusCode: string;
  statusMessage: string;
};

type BkashRefundRawResponse = {
  statusCode?: string;
  statusMessage?: string;
  originalTrxID?: string;
  originalTrxId?: string;
  refundTrxID?: string;
  refundTrxId?: string;
  transactionStatus?: string;
  refundTransactionStatus?: string;
  amount?: string;
  refundAmount?: string;
  currency?: string;
  completedTime?: string;
  errorCode?: string;
  errorMessage?: string;
  errorMessageEn?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// Refund Transaction Action
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Processes a refund for a bKash transaction using the Tokenized Checkout API.
 * Endpoint: POST /tokenized/checkout/payment/refund
 *
 * @param input.paymentId - Payment ID from Create Payment API
 * @param input.trxId - Transaction ID from Execute Payment API
 * @param input.refundAmount - Amount to refund (e.g. "100.00")
 * @param input.sku - Product/service reference or order code
 * @param input.reason - Reason for the refund
 */
export async function refundBkashTransactionAction(
  input: BkashRefundTransactionInput,
): Promise<{
  success: boolean;
  message?: string;
  data?: BkashRefundTransactionResponse;
}> {
  try {
    if (!input.paymentId || !input.trxId || !input.refundAmount) {
      return {
        success: false,
        message:
          "Payment ID, Transaction ID, and refund amount are required for a bKash refund.",
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
      `${env.BKASH_BASE_URL}/tokenized/checkout/payment/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: idToken,
          "X-App-Key": env.BKASH_APP_KEY,
        },
        body: JSON.stringify({
          paymentID: input.paymentId,
          amount: input.refundAmount,
          trxID: input.trxId,
          sku: input.sku,
          reason: input.reason,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(30000), // 30s timeout
      },
    );

    const data = (await response.json()) as BkashRefundRawResponse;

    const refundTrxId = data.refundTrxID || data.refundTrxId;
    const status = data.refundTransactionStatus || data.transactionStatus;

    if (!response.ok || !refundTrxId || data.statusCode !== "0000") {
      console.error("[Actions.Bkash.RefundTransaction] API error:", data);
      return {
        success: false,
        message:
          data.statusMessage ||
          data.errorMessageEn ||
          data.errorMessage ||
          "Failed to process bKash refund.",
      };
    }

    const normalizedData: BkashRefundTransactionResponse = {
      originalTrxId: data.originalTrxID || data.originalTrxId || input.trxId,
      refundTrxId,
      refundTransactionStatus: status || "Completed",
      refundAmount: data.refundAmount || data.amount || input.refundAmount,
      currency: data.currency || "BDT",
      completedTime: data.completedTime || new Date().toISOString(),
      statusCode: data.statusCode || "0000",
      statusMessage: data.statusMessage || "Successful",
    };

    if (
      normalizedData.refundTransactionStatus.toLowerCase() !== "completed"
    ) {
      console.error(
        "[Actions.Bkash.RefundTransaction] Non-completed status:",
        data,
      );
      return {
        success: false,
        message: `bKash refund was not completed. Status: ${normalizedData.refundTransactionStatus}`,
        data: normalizedData,
      };
    }

    return {
      success: true,
      data: normalizedData,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      console.error(
        "[Actions.Bkash.RefundTransaction] Request timed out.",
      );
      return {
        success: false,
        message:
          "bKash refund request timed out. Please check refund status to verify the result.",
      };
    }

    console.error("[Actions.Bkash.RefundTransaction]:", error);
    return {
      success: false,
      message: "Failed to refund bKash transaction. Please try again.",
    };
  }
}
