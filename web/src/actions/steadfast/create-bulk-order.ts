"use server";

import { steadfastRequest } from "@/actions/steadfast/client";
import type {
  SteadfastBulkOrderItem,
  SteadfastBulkOrderResponse,
  SteadfastBulkOrderResultItem,
} from "@/actions/steadfast/types";

/**
 * Creates bulk orders on Steadfast Courier (maximum 500 items per request).
 * Endpoint: POST /create_order/bulk-order
 *
 * @param orders - Array of consignment items
 */
export async function createSteadfastBulkOrderAction(
  orders: SteadfastBulkOrderItem[],
): Promise<{
  success: boolean;
  message?: string;
  results?: SteadfastBulkOrderResultItem[];
  data?: SteadfastBulkOrderResponse;
  errors?: Record<string, string[]>;
}> {
  try {
    if (!Array.isArray(orders) || orders.length === 0) {
      return {
        success: false,
        message: "At least one order item is required for bulk creation.",
      };
    }

    if (orders.length > 500) {
      return {
        success: false,
        message: "Maximum 500 orders allowed per bulk creation request.",
      };
    }

    // Format and sanitize each order item
    const formattedData = orders.map((order) => {
      const cleanedPhone = (order.recipient_phone || "").replace(/\D/g, "");
      return {
        invoice: String(order.invoice).trim(),
        recipient_name: (order.recipient_name || "").trim().slice(0, 100),
        recipient_phone: cleanedPhone.slice(-11),
        recipient_address: (order.recipient_address || "").trim().slice(0, 250),
        cod_amount: typeof order.cod_amount === "number" ? order.cod_amount : Number(order.cod_amount) || 0,
        note: order.note ? String(order.note).trim() : null,
        ...(order.alternative_phone && {
          alternative_phone: order.alternative_phone.replace(/\D/g, "").slice(-11),
        }),
        ...(order.recipient_email && {
          recipient_email: order.recipient_email.trim().toLowerCase(),
        }),
        ...(order.item_description && {
          item_description: order.item_description.trim(),
        }),
        ...(typeof order.total_lot === "number" && {
          total_lot: order.total_lot,
        }),
        ...(typeof order.delivery_type === "number" && {
          delivery_type: order.delivery_type,
        }),
      };
    });

    // Steadfast bulk order expects { data: "[JSON string]" } or { data: [...] }
    const result = await steadfastRequest<
      SteadfastBulkOrderResultItem[] | SteadfastBulkOrderResponse
    >("/create_order/bulk-order", {
      method: "POST",
      body: {
        data: JSON.stringify(formattedData),
      },
      timeoutMs: 60000, // 60s timeout for bulk processing
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.message || "Failed to create bulk orders on Steadfast.",
        errors: result.errors,
      };
    }

    // Handle both array response and wrapped response formats
    let results: SteadfastBulkOrderResultItem[] = [];
    if (Array.isArray(result.data)) {
      results = result.data;
    } else if (result.data.data && Array.isArray(result.data.data)) {
      results = result.data.data;
    }

    const successCount = results.filter((r) => r.status === "success").length;
    const errorCount = results.filter((r) => r.status !== "success").length;

    return {
      success: true,
      message: `Bulk processing completed: ${successCount} succeeded, ${errorCount} failed.`,
      results,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.CreateBulkOrder] Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error during Steadfast bulk order creation.",
    };
  }
}
