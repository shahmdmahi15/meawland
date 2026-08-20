"use server";

import { steadfastRequest } from "@/actions/steadfast/client";
import type { SteadfastBalanceResponse } from "@/actions/steadfast/types";

/**
 * Retrieves the current merchant balance from Steadfast Courier.
 * Endpoint: GET /get_balance
 */
export async function getSteadfastBalanceAction(): Promise<{
  success: boolean;
  current_balance?: number;
  status?: number;
  message?: string;
  data?: SteadfastBalanceResponse;
}> {
  try {
    const result = await steadfastRequest<SteadfastBalanceResponse>(
      "/get_balance",
      { method: "GET" },
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.message || "Failed to retrieve Steadfast account balance.",
      };
    }

    return {
      success: true,
      current_balance: result.data.current_balance ?? 0,
      status: result.data.status,
      message: result.data.message,
      data: result.data,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.GetBalance] Error:", error);
    return {
      success: false,
      message: "Unexpected error checking Steadfast account balance.",
    };
  }
}
