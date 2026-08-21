"use server";

import { env } from "@/env";
import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import { revalidatePath } from "next/cache";
import { fraudSpyRequest } from "./client";
import {
  connectSteadfastSchema,
  type ConnectSteadfastInput,
  type SteadfastConnectResponse,
} from "@/schemas/fraud-checker";

/**
 * Connects Steadfast Courier credentials with FraudSpy for automatic parcel sync.
 */
export async function connectSteadfastToFraudSpyAction(
  rawInput?: Partial<ConnectSteadfastInput>,
): Promise<{
  success: boolean;
  message: string;
  data?: SteadfastConnectResponse;
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN && sessionUser.role !== Role.OWNER)
    ) {
      return {
        success: false,
        message:
          "Unauthorized. Admin privileges required to manage courier credentials.",
      };
    }

    const apiKey = rawInput?.api_key || env.STEADFAST_API_KEY;
    const secretKey = rawInput?.secret_key || env.STEADFAST_SECRET_KEY;

    const validation = connectSteadfastSchema.safeParse({
      api_key: apiKey,
      secret_key: secretKey,
    });

    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message ||
          "Invalid Steadfast credentials.",
      };
    }

    const response = await fraudSpyRequest<SteadfastConnectResponse>(
      "/api/v1/steadfast/connect",
      {
        method: "POST",
        body: {
          api_key: validation.data.api_key,
          secret_key: validation.data.secret_key,
        },
      },
    );

    if (!response.success) {
      return {
        success: false,
        message:
          response.message ||
          "Failed to connect Steadfast credentials with FraudSpy.",
      };
    }

    revalidatePath("/admin/management/orders/fraud-checker");

    await recordAuditLog({
      action: AuditAction.SETTINGS_UPDATE,
      entity: AuditEntity.SHIPMENT,
      summary:
        "Steadfast Courier API credentials connected with FraudSpy network",
      severity: AuditSeverity.INFO,
      newState: {
        status: "ACTIVE",
        maskedKey: response.data?.credential?.api_key_masked,
      },
      userId: sessionUser.id,
      path: "/admin/management/orders/fraud-checker",
    }).catch(() => {});

    return {
      success: true,
      message:
        response.data?.message ||
        "Steadfast API credentials connected successfully with FraudSpy.",
      data: response.data,
    };
  } catch (error) {
    console.error("[Action.FraudChecker.ConnectSteadfast.Error]:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while connecting Steadfast credentials.",
    };
  }
}
