"use server";

import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";
import { fraudSpyRequest } from "./client";
import {
  fraudSearchInputSchema,
  type FraudCheckerSearchResult,
} from "@/schemas/fraud-checker";

export interface CheckCustomerFraudResult {
  success: boolean;
  message?: string;
  data?: FraudCheckerSearchResult;
  riskSummary?: {
    level: "Low" | "Medium" | "High" | "Critical";
    color: string;
    successRatio: number;
    totalOrders: number;
    deliveredCount: number;
    returnedCount: number;
    fraudReportCount: number;
    verdict: string;
  };
}

/**
 * Checks delivery history and fraud reports for a customer phone number across all couriers.
 */
export async function checkCustomerFraudAction(
  rawPhone: string,
): Promise<CheckCustomerFraudResult> {
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
          "Unauthorized. Staff or Admin privileges required to use Fraud Checker.",
      };
    }

    const validation = fraudSearchInputSchema.safeParse({ phone: rawPhone });
    if (!validation.success) {
      return {
        success: false,
        message:
          validation.error.issues[0]?.message || "Invalid phone number format.",
      };
    }

    const cleanPhone = validation.data.phone;

    const response = await fraudSpyRequest<FraudCheckerSearchResult>(
      "/api/v1/search",
      {
        method: "POST",
        body: { phone: cleanPhone },
      },
    );

    if (!response.success || !response.data) {
      return {
        success: false,
        message:
          response.message || "Failed to retrieve courier delivery history.",
      };
    }

    const result = response.data;

    // Calculate risk summary and verdict
    const successRatio = result.overall?.success_ratio ?? 0;
    const totalOrders = result.overall?.total ?? 0;
    const deliveredCount = result.overall?.delivered ?? 0;
    const returnedCount = result.overall?.returned ?? 0;
    const fraudReportCount = result.fraud_reports?.count ?? 0;
    const apiRiskLevel = result.fraud_reports?.risk?.level || "Low";

    let riskLevel: "Low" | "Medium" | "High" | "Critical" = "Low";
    let color = "text-emerald-600 bg-emerald-500/10 border-emerald-500/30";
    let verdict = "Safe Customer. High delivery success rate.";

    if (fraudReportCount >= 2 || (totalOrders >= 3 && successRatio < 50)) {
      riskLevel = "Critical";
      color = "text-rose-600 bg-rose-500/10 border-rose-500/30";
      verdict =
        "High Risk! Multiple fraud reports or severe return history detected. Exercise extreme caution.";
    } else if (
      fraudReportCount === 1 ||
      (totalOrders >= 5 && successRatio < 70)
    ) {
      riskLevel = "High";
      color = "text-amber-600 bg-amber-500/10 border-amber-500/30";
      verdict =
        "Moderate Risk. Noticeable return rate or existing fraud report. Phone verification recommended.";
    } else if (
      apiRiskLevel === "Medium" ||
      (totalOrders >= 2 && successRatio < 80)
    ) {
      riskLevel = "Medium";
      color = "text-yellow-600 bg-yellow-500/10 border-yellow-500/30";
      verdict = "Average Delivery History. Standard COD dispatch suitable.";
    } else if (totalOrders === 0) {
      verdict = "New Customer. No prior integrated courier records found.";
    }

    // Record forensic audit log entry
    await recordAuditLog({
      action: AuditAction.OTHER,
      entity: AuditEntity.OTHER,
      entityName: `Fraud Check: ${cleanPhone}`,
      summary: `Fraud Check executed for phone "${cleanPhone}" (Success Rate: ${successRatio}%, Risk: ${riskLevel})`,
      severity:
        riskLevel === "Critical" ? AuditSeverity.WARNING : AuditSeverity.INFO,
      newState: {
        phone: cleanPhone,
        totalOrders,
        deliveredCount,
        returnedCount,
        successRatio,
        fraudReportCount,
        riskLevel,
      },
      userId: sessionUser.id,
      path: "/admin/management/orders/fraud-checker",
    }).catch(() => {});

    return {
      success: true,
      data: result,
      riskSummary: {
        level: riskLevel,
        color,
        successRatio,
        totalOrders,
        deliveredCount,
        returnedCount,
        fraudReportCount,
        verdict,
      },
    };
  } catch (error) {
    console.error("[Action.FraudChecker.Search.Error]:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while performing the fraud check.",
    };
  }
}
