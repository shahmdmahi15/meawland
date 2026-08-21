"use server";

import { steadfastRequest } from "@/actions/steadfast/client";
import type {
  SteadfastDeliveryStatus,
  SteadfastStatusResponse,
} from "@/actions/steadfast/types";

/**
 * Checks consignment delivery status by Consignment ID (CID).
 * Endpoint: GET /status_by_cid/{id}
 *
 * @param consignmentId - The Steadfast Consignment ID
 */
export async function getSteadfastStatusByConsignmentIdAction(
  consignmentId: number | string,
): Promise<{
  success: boolean;
  delivery_status?: SteadfastDeliveryStatus | string;
  status?: number;
  message?: string;
  data?: SteadfastStatusResponse;
}> {
  try {
    if (!consignmentId) {
      return { success: false, message: "Consignment ID is required." };
    }

    const cid = String(consignmentId).trim();
    const result = await steadfastRequest<SteadfastStatusResponse>(
      `/status_by_cid/${encodeURIComponent(cid)}`,
      { method: "GET" },
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        message:
          result.message || "Failed to retrieve status by Consignment ID.",
      };
    }

    return {
      success: true,
      delivery_status: result.data.delivery_status,
      status: result.data.status,
      message: result.data.message,
      data: result.data,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.StatusByCID] Error:", error);
    return {
      success: false,
      message: "Unexpected error checking delivery status by Consignment ID.",
    };
  }
}

/**
 * Checks consignment delivery status by Merchant Invoice / Order Code.
 * Endpoint: GET /status_by_invoice/{invoice}
 *
 * @param invoice - Your order code/invoice number
 */
export async function getSteadfastStatusByInvoiceAction(
  invoice: string,
): Promise<{
  success: boolean;
  delivery_status?: SteadfastDeliveryStatus | string;
  status?: number;
  message?: string;
  data?: SteadfastStatusResponse;
}> {
  try {
    if (!invoice?.trim()) {
      return { success: false, message: "Invoice ID is required." };
    }

    const inv = invoice.trim();
    const result = await steadfastRequest<SteadfastStatusResponse>(
      `/status_by_invoice/${encodeURIComponent(inv)}`,
      { method: "GET" },
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.message || "Failed to retrieve status by Invoice ID.",
      };
    }

    return {
      success: true,
      delivery_status: result.data.delivery_status,
      status: result.data.status,
      message: result.data.message,
      data: result.data,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.StatusByInvoice] Error:", error);
    return {
      success: false,
      message: "Unexpected error checking delivery status by Invoice ID.",
    };
  }
}

/**
 * Checks consignment delivery status by Steadfast Tracking Code.
 * Endpoint: GET /status_by_trackingcode/{trackingCode}
 *
 * @param trackingCode - The Steadfast alphanumeric tracking code
 */
export async function getSteadfastStatusByTrackingCodeAction(
  trackingCode: string,
): Promise<{
  success: boolean;
  delivery_status?: SteadfastDeliveryStatus | string;
  status?: number;
  message?: string;
  data?: SteadfastStatusResponse;
}> {
  try {
    if (!trackingCode?.trim()) {
      return { success: false, message: "Tracking code is required." };
    }

    const code = trackingCode.trim();
    const result = await steadfastRequest<SteadfastStatusResponse>(
      `/status_by_trackingcode/${encodeURIComponent(code)}`,
      { method: "GET" },
    );

    if (!result.success || !result.data) {
      return {
        success: false,
        message:
          result.message || "Failed to retrieve status by tracking code.",
      };
    }

    return {
      success: true,
      delivery_status: result.data.delivery_status,
      status: result.data.status,
      message: result.data.message,
      data: result.data,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.StatusByTrackingCode] Error:", error);
    return {
      success: false,
      message: "Unexpected error checking delivery status by tracking code.",
    };
  }
}
