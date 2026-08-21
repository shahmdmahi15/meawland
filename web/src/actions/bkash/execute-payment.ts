"use server";

import { env } from "@/env";
import { getBkashToken } from "@/actions/bkash/grant-token";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

export type BkashExecutePaymentResponse = {
  statusCode: string;
  statusMessage: string;
  paymentID: string;
  payerReference: string;
  customerMsisdn: string;
  trxID: string;
  amount: string;
  transactionStatus: string;
  paymentExecuteTime: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
};

type BkashExecutePaymentErrorResponse = {
  statusCode?: string;
  statusMessage?: string;
  errorCode?: string;
  errorMessage?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// Execute Payment Action
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Finalizes a bKash payment after the customer has completed the payment flow
 * on bKash's hosted page and been redirected back via the callback URL.
 *
 * This should be called from the bKash callback handler when `status=success`.
 * The `paymentID` comes from the callback URL query parameters.
 *
 * A payment is considered successful only when `transactionStatus === "Completed"`.
 */
export async function executeBkashPaymentAction(paymentID: string): Promise<{
  success: boolean;
  message?: string;
  data?: BkashExecutePaymentResponse;
}> {
  try {
    if (!paymentID) {
      return {
        success: false,
        message: "Payment ID is required to execute a bKash payment.",
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
      `${env.BKASH_BASE_URL}/tokenized/checkout/execute`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: idToken,
          "X-App-Key": env.BKASH_APP_KEY,
        },
        body: JSON.stringify({ paymentID }),
        cache: "no-store",
      },
    );

    const data = (await response.json()) as
      BkashExecutePaymentResponse | BkashExecutePaymentErrorResponse;

    if (!response.ok || !("trxID" in data)) {
      const errorData = data as BkashExecutePaymentErrorResponse;
      console.error("[Actions.Bkash.ExecutePayment] API error:", errorData);
      return {
        success: false,
        message:
          errorData.statusMessage ||
          errorData.errorMessage ||
          "Failed to execute bKash payment.",
      };
    }

    const executeData = data as BkashExecutePaymentResponse;

    if (
      executeData.statusCode !== "0000" ||
      executeData.transactionStatus !== "Completed"
    ) {
      console.error(
        "[Actions.Bkash.ExecutePayment] Non-completed status:",
        executeData,
      );
      return {
        success: false,
        message:
          executeData.statusMessage ||
          `bKash payment was not completed. Status: ${executeData.transactionStatus}`,
        data: executeData,
      };
    }

    return {
      success: true,
      data: executeData,
    };
  } catch (error) {
    console.error("[Actions.Bkash.ExecutePayment]:", error);
    return {
      success: false,
      message: "Failed to execute bKash payment. Please try again.",
    };
  }
}
