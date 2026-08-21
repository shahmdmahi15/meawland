"use server";

import { env } from "@/env";
import { getBkashToken } from "@/actions/bkash/grant-token";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

export type BkashCreatePaymentInput = {
  amount: string;
  merchantInvoiceNumber: string;
  payerReference?: string;
  merchantAssociationInfo?: string;
};

export type BkashCreatePaymentResponse = {
  paymentID: string;
  bkashURL: string;
  callbackURL: string;
  successCallbackURL: string;
  failureCallbackURL: string;
  cancelledCallbackURL: string;
  amount: string;
  intent: string;
  currency: string;
  paymentCreateTime: string;
  transactionStatus: string;
  merchantInvoiceNumber: string;
  statusCode: string;
  statusMessage: string;
};

type BkashCreatePaymentErrorResponse = {
  statusCode?: string;
  statusMessage?: string;
  errorCode?: string;
  errorMessage?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// Create Payment Action
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Creates a bKash payment request using the Checkout (URL-based) flow.
 *
 * Returns a `bkashURL` that the customer must be redirected to in order to
 * complete the payment (enter wallet number, OTP, and PIN).
 *
 * After payment completion, bKash redirects the customer back to the
 * callback URL with `paymentID` and `status` query parameters.
 */
export async function createBkashPaymentAction(
  input: BkashCreatePaymentInput,
): Promise<{
  success: boolean;
  message?: string;
  data?: BkashCreatePaymentResponse;
}> {
  try {
    const idToken = await getBkashToken();
    if (!idToken) {
      return {
        success: false,
        message: "Failed to authenticate with bKash. Please try again.",
      };
    }

    const callbackURL = `${env.NEXT_PUBLIC_APP_URL}/api/bkash/callback`;

    const response = await fetch(
      `${env.BKASH_BASE_URL}/tokenized/checkout/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: idToken,
          "X-App-Key": env.BKASH_APP_KEY,
        },
        body: JSON.stringify({
          mode: "0011",
          payerReference: input.payerReference || " ",
          callbackURL,
          amount: input.amount,
          currency: "BDT",
          intent: "sale",
          merchantInvoiceNumber: input.merchantInvoiceNumber,
          ...(input.merchantAssociationInfo && {
            merchantAssociationInfo: input.merchantAssociationInfo,
          }),
        }),
        cache: "no-store",
      },
    );

    const data = (await response.json()) as
      BkashCreatePaymentResponse | BkashCreatePaymentErrorResponse;

    if (!response.ok || !("bkashURL" in data) || !data.bkashURL) {
      const errorData = data as BkashCreatePaymentErrorResponse;
      console.error("[Actions.Bkash.CreatePayment] API error:", errorData);
      return {
        success: false,
        message:
          errorData.statusMessage ||
          errorData.errorMessage ||
          "Failed to create bKash payment.",
      };
    }

    const paymentData = data as BkashCreatePaymentResponse;

    if (paymentData.statusCode !== "0000") {
      console.error(
        "[Actions.Bkash.CreatePayment] Non-success status:",
        paymentData,
      );
      return {
        success: false,
        message:
          paymentData.statusMessage ||
          "bKash payment creation was not successful.",
      };
    }

    return {
      success: true,
      data: paymentData,
    };
  } catch (error) {
    console.error("[Actions.Bkash.CreatePayment]:", error);
    return {
      success: false,
      message: "Failed to create bKash payment. Please try again.",
    };
  }
}
