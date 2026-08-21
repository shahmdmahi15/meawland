"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import db from "@/lib/db";

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;
    if (!rawToken)
      return {
        success: false,
        message: "Session Token not Found",
      };

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const deletedSession = await db.session.delete({
      where: {
        tokenHash,
      },
    });

    cookieStore.delete("__Host-SESSION_TOKEN");

    const { recordAuditLog } = await import("@/lib/audit-logger");
    const { AuditAction, AuditEntity, AuditSeverity } =
      await import("@/generated/prisma/enums");

    await recordAuditLog({
      action: AuditAction.LOGOUT,
      entity: AuditEntity.AUTH,
      userId: deletedSession.userId,
      summary: "User signed out of active session",
      severity: AuditSeverity.INFO,
      path: "/logout",
    }).catch(() => {});

    return {
      success: true,
      message: "Logout Successfully",
    };
  } catch (error) {
    console.error("[Action.Auth.Logout:", error);
    return {
      success: false,
      message: "Failed to logout",
    };
  }
}
