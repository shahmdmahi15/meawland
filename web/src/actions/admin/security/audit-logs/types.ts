import { z } from "zod";
import {
  AuditAction,
  AuditEntity,
  AuditSeverity,
  Role,
} from "@/generated/prisma/enums";

export const adminAuditLogFilterSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  entity: z.nativeEnum(AuditEntity).optional(),
  action: z.nativeEnum(AuditAction).optional(),
  severity: z.nativeEnum(AuditSeverity).optional(),
  userId: z.string().trim().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type AdminAuditLogFilterInput = z.infer<
  typeof adminAuditLogFilterSchema
>;

export interface AdminAuditLogSummary {
  id: string;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string | null;
  entityName: string | null;
  summary: string;
  severity: AuditSeverity;
  ipAddress: string | null;
  userAgent: string | null;
  path: string | null;
  actor: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: Role;
  } | null;
  hasStateDiff: boolean;
  createdAt: string;
}

export interface AdminAuditLogDetails extends AdminAuditLogSummary {
  previousState: Record<string, unknown> | null;
  newState: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
}

export interface AdminAuditLogStats {
  totalLogs: number;
  todayLogs: number;
  securityAlertsCount: number;
  stockChangesCount: number;
  roleChangesCount: number;
  criticalAlertsCount: number;
}
