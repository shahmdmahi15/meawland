"use server";

import { steadfastRequest } from "@/actions/steadfast/client";
import type {
  SteadfastCreateReturnRequestInput,
  SteadfastReturnRequest,
  SteadfastReturnRequestsListResponse,
  SteadfastSingleReturnResponse,
} from "@/actions/steadfast/types";

/**
 * Creates a return request for a consignment on Steadfast Courier.
 * Endpoint: POST /create_return_request
 *
 * @param input - Consignment identifier (consignment_id, invoice, or tracking_code) and optional reason
 */
export async function createSteadfastReturnRequestAction(
  input: SteadfastCreateReturnRequestInput,
): Promise<{
  success: boolean;
  message?: string;
  data?: SteadfastReturnRequest;
}> {
  try {
    const identifierKey = input.consignment_id
      ? "consignment_id"
      : input.invoice
        ? "invoice"
        : input.tracking_code
          ? "tracking_code"
          : null;

    if (!identifierKey) {
      return {
        success: false,
        message:
          "Either consignment_id, invoice, or tracking_code is required to create a return request.",
      };
    }

    const payload: Record<string, unknown> = {
      [identifierKey]:
        identifierKey === "consignment_id"
          ? Number(input.consignment_id) || input.consignment_id
          : String(input[identifierKey]).trim(),
      ...(input.reason && { reason: input.reason.trim() }),
    };

    const result = await steadfastRequest<
      SteadfastReturnRequest | SteadfastSingleReturnResponse
    >("/create_return_request", {
      method: "POST",
      body: payload,
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        message:
          result.message || "Failed to create return request on Steadfast.",
      };
    }

    const returnData = (
      "data" in result.data && result.data.data ? result.data.data : result.data
    ) as SteadfastReturnRequest;

    const { recordAuditLog } = await import("@/lib/audit-logger");
    const { AuditAction, AuditEntity, AuditSeverity } =
      await import("@/generated/prisma/enums");

    await recordAuditLog({
      action: AuditAction.STATUS_CHANGE,
      entity: AuditEntity.SHIPMENT,
      entityId: input.consignment_id
        ? String(input.consignment_id)
        : input.tracking_code || input.invoice,
      entityName: `Consignment Return (${input.invoice || input.tracking_code || input.consignment_id})`,
      summary: `Courier Return Request submitted to Steadfast for Consignment (Reason: ${input.reason || "N/A"})`,
      severity: AuditSeverity.WARNING,
      newState: { returnData },
      path: "/admin/management/orders",
    }).catch(() => {});

    return {
      success: true,
      message: "Return request created successfully on Steadfast.",
      data: returnData,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.CreateReturnRequest] Error:", error);
    return {
      success: false,
      message: "Unexpected error creating Steadfast return request.",
    };
  }
}

/**
 * Retrieves a single return request by its Return ID.
 * Endpoint: GET /get_return_request/{id}
 *
 * @param id - The Steadfast Return Request ID
 */
export async function getSteadfastReturnRequestByIdAction(
  id: number | string,
): Promise<{
  success: boolean;
  message?: string;
  data?: SteadfastReturnRequest;
}> {
  try {
    if (!id) {
      return { success: false, message: "Return request ID is required." };
    }

    const result = await steadfastRequest<
      SteadfastReturnRequest | SteadfastSingleReturnResponse
    >(`/get_return_request/${encodeURIComponent(String(id).trim())}`, {
      method: "GET",
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.message || "Failed to retrieve return request details.",
      };
    }

    const returnData = (
      "data" in result.data && result.data.data ? result.data.data : result.data
    ) as SteadfastReturnRequest;

    return {
      success: true,
      data: returnData,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.GetReturnRequestById] Error:", error);
    return {
      success: false,
      message: "Unexpected error retrieving return request.",
    };
  }
}

/**
 * Retrieves all return requests from Steadfast.
 * Endpoint: GET /get_return_requests
 */
export async function getSteadfastReturnRequestsAction(): Promise<{
  success: boolean;
  message?: string;
  data?: SteadfastReturnRequest[];
}> {
  try {
    const result = await steadfastRequest<
      SteadfastReturnRequest[] | SteadfastReturnRequestsListResponse
    >("/get_return_requests", {
      method: "GET",
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        message: result.message || "Failed to retrieve return requests list.",
      };
    }

    let returnRequests: SteadfastReturnRequest[] = [];
    if (Array.isArray(result.data)) {
      returnRequests = result.data;
    } else if (result.data.data && Array.isArray(result.data.data)) {
      returnRequests = result.data.data;
    }

    return {
      success: true,
      data: returnRequests,
    };
  } catch (error) {
    console.error("[Actions.Steadfast.GetReturnRequests] Error:", error);
    return {
      success: false,
      message: "Unexpected error retrieving return requests list.",
    };
  }
}
