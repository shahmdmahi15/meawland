import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { AuditAction, AuditEntity, AuditSeverity, Prisma } from "@/generated/prisma/client";

export interface RecordAuditLogParams {
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  entityName?: string | null;
  summary: string;
  severity?: AuditSeverity;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  userId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  path?: string | null;
}

/**
 * Universal background-safe Audit Logger.
 * Records immutable historical diffs, actor attribution, and forensic telemetry across Meawland.
 */
export async function recordAuditLog(params: RecordAuditLogParams): Promise<void> {
  try {
    let resolvedUserId = params.userId || null;

    if (!resolvedUserId) {
      try {
        const session = await getMeAction();
        if (session?.id) {
          resolvedUserId = session.id;
        }
      } catch {
        // Ignored in non-session background triggers
      }
    }

    await db.auditLog.create({
      data: {
        action: params.action,
        entity: params.entity,
        entityId: params.entityId || null,
        entityName: params.entityName || null,
        summary: params.summary,
        severity: params.severity || AuditSeverity.INFO,
        previousState: (params.previousState as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        newState: (params.newState as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        metadata: (params.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        userId: resolvedUserId,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        path: params.path || null,
      },
    });
  } catch (error) {
    console.error("[AuditLogger] Failed to record audit entry:", error);
  }
}
