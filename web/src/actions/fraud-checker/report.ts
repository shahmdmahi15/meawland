"use server";

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
  submitFraudReportSchema,
  type SubmitFraudReportInput,
  type FraudReportSubmitResponse,
} from "@/schemas/fraud-checker";

/**
 * Submits a fraud report to the FraudSpy database.
 */
export async function submitFraudReportAction(
  rawInput: SubmitFraudReportInput,
): Promise<{
  success: boolean;
  message: string;
  data?: FraudReportSubmitResponse;
}> {
  try {
    const sessionUser = await getMeAction();
    if (
      !sessionUser ||
      (sessionUser.role !== Role.ADMIN &&
        sessionUser.role !== Role.OWNER &&
        sessionUser.role !== Role.STAFF)
    ) {
      return {
        success: false,
        message:
          "Unauthorized. Staff or Admin privileges required to submit fraud reports.",
      };
    }

    const validation = submitFraudReportSchema.safeParse(rawInput);
    if (!validation.success) {
      return {
        success: false,
        message: validation.error.issues[0]?.message || "Invalid report input.",
      };
    }

    const data = validation.data;

    const payload = {
      contact_number: data.contact_number,
      contact_name: data.contact_name,
      complain_details: data.complain_details,
      courier_name: data.courier_name || undefined,
      parcel_id: data.parcel_id || undefined,
      categories: data.categories,
      is_anonymous: data.is_anonymous ?? false,
    };

    const response = await fraudSpyRequest<FraudReportSubmitResponse>(
      "/api/v1/fraud-report",
      {
        method: "POST",
        body: payload,
      },
    );

    if (!response.success) {
      return {
        success: false,
        message:
          response.message || "Failed to submit fraud report to FraudSpy.",
      };
    }

    revalidatePath("/admin/management/orders/fraud-checker");
    revalidatePath("/admin/management/orders");

    // Forensic Audit Log
    await recordAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.OTHER,
      entityName: `Fraud Report: ${data.contact_number}`,
      summary: `Fraud Report submitted for customer "${data.contact_name}" (${data.contact_number}). Categories: ${data.categories.join(", ")}`,
      severity: AuditSeverity.WARNING,
      newState: {
        contact_number: data.contact_number,
        contact_name: data.contact_name,
        categories: data.categories,
        courier: data.courier_name,
        parcel_id: data.parcel_id,
        is_anonymous: data.is_anonymous,
      },
      userId: sessionUser.id,
      path: "/admin/management/orders/fraud-checker",
    }).catch(() => {});

    return {
      success: true,
      message:
        response.data?.message ||
        "Fraud report submitted successfully to FraudSpy network.",
      data: response.data,
    };
  } catch (error) {
    console.error("[Action.FraudChecker.SubmitReport.Error]:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while submitting the fraud report.",
    };
  }
}
