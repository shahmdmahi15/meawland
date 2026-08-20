"use server";

import { env } from "@/env";
import { getBkashToken } from "@/actions/bkash/grant-token";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

export type BkashQueryPaymentResponse = {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  mode: string;
  payerReference: string;
  paymentCreateTime: string;
  paymentExecuteTime?: string;
  trxID?: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoice: string;
  verificationStatus?: string;
  agreementID?: string;
  agreementStatus?: string;
  agreementCreateTime?: string;
  agreementExecuteTime?: string;
};

type BkashQueryPaymentErrorResponse = {
  statusCode?: string;
  statusMessage?: string;
  errorCode?: string;
  errorMessage?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// Query Payment Action
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Queries the current status of a bKash payment using the `paymentID`
 * obtained from the Create Payment API.
 *
 * Possible `transactionStatus` values:
 * - `"Initiated"` — Payment has been created but not yet completed
 * - `"Completed"` — Payment has been successfully executed
 *
 * Useful for verifying payment state before/after execution, or for
 * resolving ambiguous callback scenarios.
 */
export async function queryBkashPaymentAction(paymentID: string): Promise<{
  success: boolean;
  message?: string;
  data?: BkashQueryPaymentResponse;
}> {
  try {
    if (!paymentID) {
      return {
        success: false,
        message: "Payment ID is required to query a bKash payment.",
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
      `${env.BKASH_BASE_URL}/tokenized/checkout/payment/status`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: idToken,
          "X-App-Key": env.BKASH_APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
        cache: "no-store",
      },
    );

    const data = (await response.json()) as
      | BkashQueryPaymentResponse
      | BkashQueryPaymentErrorResponse;

    if (
      !response.ok ||
      !("transactionStatus" in data)
    ) {
      const errorData = data as BkashQueryPaymentErrorResponse;
      console.error("[Actions.Bkash.QueryPayment] API error:", errorData);
      return {
        success: false,
        message:
          errorData.statusMessage ||
          errorData.errorMessage ||
          "Failed to query bKash payment status.",
      };
    }

    const queryData = data as BkashQueryPaymentResponse;

    if (queryData.statusCode !== "0000") {
      console.error(
        "[Actions.Bkash.QueryPayment] Non-success status:",
        queryData,
      );
      return {
        success: false,
        message:
          queryData.statusMessage || "Failed to query bKash payment status.",
      };
    }

    return {
      success: true,
      data: queryData,
    };
  } catch (error) {
    console.error("[Actions.Bkash.QueryPayment]:", error);
    return {
      success: false,
      message: "Failed to query bKash payment status. Please try again.",
    };
  }
}
