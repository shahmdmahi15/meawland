"use server";

import { env } from "@/env";
import { getBkashToken } from "@/actions/bkash/grant-token";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

export type BkashRefundTransaction = {
  refundTrxId: string;
  refundTransactionStatus: string;
  refundAmount: string;
  completedTime: string;
};

export type BkashRefundStatusResponse = {
  originalTrxId: string;
  originalTrxAmount: string;
  originalTrxCompletedTime: string;
  refundTransactions: BkashRefundTransaction[];
};

type BkashRefundStatusRawResponse = {
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
  completedTime?: string;
  refundTransactions?: Array<{
    refundTrxID?: string;
    refundTrxId?: string;
    transactionStatus?: string;
    refundTransactionStatus?: string;
    amount?: string;
    refundAmount?: string;
    completedTime?: string;
  }>;
  errorMessageEn?: string;
  errorMessage?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// Refund Status Action
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Checks the status of refund transactions for a specific bKash payment.
 * Endpoint: POST /tokenized/checkout/payment/refund
 *
 * @param paymentId - Payment ID from Create Payment API
 * @param trxId - Transaction ID from Execute Payment API
 */
export async function refundBkashStatusAction(
  paymentId: string,
  trxId: string,
): Promise<{
  success: boolean;
  message?: string;
  data?: BkashRefundStatusResponse;
}> {
  try {
    if (!paymentId || !trxId) {
      return {
        success: false,
        message:
          "Payment ID and Transaction ID are required to check bKash refund status.",
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
          paymentID: paymentId,
          trxID: trxId,
        }),
        cache: "no-store",
      },
    );

    const data = (await response.json()) as BkashRefundStatusRawResponse;

    if (!response.ok || data.statusCode !== "0000") {
      console.error("[Actions.Bkash.RefundStatus] API error:", data);
      return {
        success: false,
        message:
          data.statusMessage ||
          data.errorMessageEn ||
          data.errorMessage ||
          "Failed to check bKash refund status.",
      };
    }

    const refunds: BkashRefundTransaction[] = [];
    if (data.refundTransactions && Array.isArray(data.refundTransactions)) {
      for (const r of data.refundTransactions) {
        refunds.push({
          refundTrxId: r.refundTrxID || r.refundTrxId || "",
          refundTransactionStatus:
            r.refundTransactionStatus || r.transactionStatus || "Completed",
          refundAmount: r.refundAmount || r.amount || "0.00",
          completedTime: r.completedTime || "",
        });
      }
    } else if (data.refundTrxID || data.refundTrxId) {
      refunds.push({
        refundTrxId: data.refundTrxID || data.refundTrxId || "",
        refundTransactionStatus:
          data.refundTransactionStatus || data.transactionStatus || "Completed",
        refundAmount: data.refundAmount || data.amount || "0.00",
        completedTime: data.completedTime || "",
      });
    }

    const statusData: BkashRefundStatusResponse = {
      originalTrxId: data.originalTrxID || data.originalTrxId || trxId,
      originalTrxAmount: data.amount || "0.00",
      originalTrxCompletedTime: data.completedTime || "",
      refundTransactions: refunds,
    };

    return {
      success: true,
      data: statusData,
    };
  } catch (error) {
    console.error("[Actions.Bkash.RefundStatus]:", error);
    return {
      success: false,
      message: "Failed to check bKash refund status. Please try again.",
    };
  }
}
