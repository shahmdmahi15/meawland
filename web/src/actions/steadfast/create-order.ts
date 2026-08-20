"use server";

import { steadfastRequest } from "@/actions/steadfast/client";
import type {
  SteadfastCreateOrderInput,
  SteadfastCreateOrderResponse,
} from "@/actions/steadfast/types";

/**
 * Places a single consignment order to Steadfast Courier.
 * Endpoint: POST /create_order
 *
 * @param input - Consignment details (invoice, recipient info, cod_amount, etc.)
 */
export async function createSteadfastOrderAction(
  input: SteadfastCreateOrderInput,
): Promise<{
  success: boolean;
  message?: string;
  consignment?: SteadfastCreateOrderResponse["consignment"];
  data?: SteadfastCreateOrderResponse;
  errors?: Record<string, string[]>;
}> {
  try {
    // 1. Basic client-side validation
    if (!input.invoice?.trim()) {
      return { success: false, message: "Invoice ID is required." };
    }
    if (!input.recipient_name?.trim()) {
      return { success: false, message: "Recipient name is required." };
    }
    if (!input.recipient_phone?.trim()) {
      return { success: false, message: "Recipient phone number is required." };
    }
    if (!input.recipient_address?.trim()) {
      return { success: false, message: "Recipient address is required." };
    }
    if (typeof input.cod_amount !== "number" || input.cod_amount < 0) {
      return {
        success: false,
        message: "COD amount must be a non-negative number.",
      };
    }

    // Clean phone number (strip whitespace, ensure standard format)
    const cleanedPhone = input.recipient_phone.replace(/\D/g, "");
    if (cleanedPhone.length < 11) {
      return {
        success: false,
        message: "Recipient phone must be at least 11 digits.",
      };
    }

    // 2. Dispatch request to Steadfast API
    const result = await steadfastRequest<SteadfastCreateOrderResponse>(
      "/create_order",
      {
        method: "POST",
        body: {
          invoice: input.invoice.trim(),
          recipient_name: input.recipient_name.trim().slice(0, 100),
          recipient_phone: cleanedPhone.slice(-11),
          recipient_address: input.recipient_address.trim().slice(0, 250),
          cod_amount: input.cod_amount,
          ...(input.note && { note: input.note.trim() }),
          ...(input.alternative_phone && {
            alternative_phone: input.alternative_phone
              .replace(/\D/g, "")
              .slice(-11),
          }),
          ...(input.recipient_email && {
            recipient_email: input.recipient_email.trim().toLowerCase(),
          }),
          ...(input.item_description && {
            item_description: input.item_description.trim(),
          }),
          ...(typeof input.total_lot === "number" && {
            total_lot: input.total_lot,
          }),
          ...(typeof input.delivery_type === "number" && {
            delivery_type: input.delivery_type,
          }),
        },
      },
    );

    if (!result.success || !result.data?.consignment) {
      return {
        success: false,
        message: result.message || "Failed to create consignment on Steadfast.",
        errors: result.errors,
        data: result.data,
      };
    }

    return {
      success: true,
      message:
        result.data.message || "Consignment created successfully on Steadfast.",
      consignment: result.data.consignment,
      data: result.data,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.CreateOrder] Error:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Unexpected error creating Steadfast consignment.",
    };
  }
}
