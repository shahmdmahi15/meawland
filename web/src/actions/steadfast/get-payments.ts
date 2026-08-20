"use server";

import { steadfastRequest } from "@/actions/steadfast/client";
import type {
  SteadfastPaymentSummary,
  SteadfastPaymentsListResponse,
  SteadfastSinglePaymentResponse,
} from "@/actions/steadfast/types";

/**
 * Retrieves the list of merchant payout payments from Steadfast Courier.
 * Endpoint: GET /payments
 */
export async function getSteadfastPaymentsAction(): Promise<{
  success: boolean;
  message?: string;
  payments?: SteadfastPaymentSummary[];
  data?: SteadfastPaymentsListResponse;
}> {
  try {
    const result = await steadfastRequest<
      SteadfastPaymentSummary[] | SteadfastPaymentsListResponse
    >("/payments", { method: "GET" });

    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.message || "Failed to retrieve Steadfast payments list.",
      };
    }

    let payments: SteadfastPaymentSummary[] = [];
    if (Array.isArray(result.data)) {
      payments = result.data;
    } else if (result.data.payments && Array.isArray(result.data.payments)) {
      payments = result.data.payments;
    } else if (result.data.data && Array.isArray(result.data.data)) {
      payments = result.data.data;
    }

    return {
      success: true,
      payments,
      data: Array.isArray(result.data) ? { status: 200, payments } : result.data,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.GetPayments] Error:", error);
    return {
      success: false,
      message: "Unexpected error retrieving Steadfast payments list.",
    };
  }
}

/**
 * Retrieves a single payment record along with its itemized consignments breakdown.
 * Endpoint: GET /payments/{payment_id}
 *
 * @param paymentId - The Steadfast Payment ID
 */
export async function getSteadfastPaymentByIdAction(
  paymentId: number | string,
): Promise<{
  success: boolean;
  message?: string;
  payment?: SteadfastSinglePaymentResponse["payment"];
  consignments?: SteadfastSinglePaymentResponse["consignments"];
  data?: SteadfastSinglePaymentResponse;
}> {
  try {
    if (!paymentId) {
      return { success: false, message: "Payment ID is required." };
    }

    const pid = String(paymentId).trim();
    const result = await steadfastRequest<SteadfastSinglePaymentResponse>(
      `/payments/${encodeURIComponent(pid)}`,
      { method: "GET" },
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        message:
          result.message || "Failed to retrieve Steadfast payment details.",
      };
    }

    const payment =
      result.data.payment ||
      result.data.data?.payment;
    const consignments =
      result.data.consignments ||
      result.data.data?.consignments ||
      [];

    return {
      success: true,
      payment,
      consignments,
      data: result.data,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.GetPaymentById] Error:", error);
    return {
      success: false,
      message: "Unexpected error retrieving Steadfast payment details.",
    };
  }
}
