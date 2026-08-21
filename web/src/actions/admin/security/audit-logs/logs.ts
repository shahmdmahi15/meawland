"use server";

import db from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import {
  AdminAuditLogFilterInput,
  AdminAuditLogSummary,
  AdminAuditLogDetails,
  AdminAuditLogStats,
  adminAuditLogFilterSchema,
} from "./types";

/**
 * Fetch paginated audit log entries with granular multi-facet filtering.
 */
export async function getAuditLogsAction(
  rawInput: Partial<AdminAuditLogFilterInput> = {},
): Promise<{
  success: boolean;
  message?: string;
  logs?: AdminAuditLogSummary[];
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const parsed = adminAuditLogFilterSchema.safeParse(rawInput);
    const {
      page = 1,
      pageSize = 20,
      search,
      entity,
      action,
      severity,
      userId,
      startDate,
      endDate,
    } = parsed.success ? parsed.data : rawInput;

    const where: Prisma.AuditLogWhereInput = {};

    if (entity) {
      where.entity = entity;
    }

    if (action) {
      where.action = action;
    }

    if (severity) {
      where.severity = severity;
    }

    if (userId) {
      where.userId = userId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { summary: { contains: q, mode: "insensitive" } },
        { entityName: { contains: q, mode: "insensitive" } },
        { entityId: { contains: q, mode: "insensitive" } },
        { ipAddress: { contains: q, mode: "insensitive" } },
        {
          user: {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          },
        },
      ];
    }

    const [total, rawLogs] = await Promise.all([
      db.auditLog.count({ where }),
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const logs: AdminAuditLogSummary[] = rawLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      entityName: log.entityName,
      summary: log.summary,
      severity: log.severity,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      path: log.path,
      actor: log.user
        ? {
            id: log.user.id,
            name: log.user.name,
            email: log.user.email,
            avatar: log.user.avatar,
            role: log.user.role,
          }
        : null,
      hasStateDiff: Boolean(log.previousState || log.newState),
      createdAt: log.createdAt.toISOString(),
    }));

    return {
      success: true,
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  } catch (error) {
    console.error("[Action.Admin.AuditLogs.Get] Error:", error);
    return { success: false, message: "Failed to retrieve audit logs." };
  }
}

/**
 * Fetch detailed state diff and metadata for a specific audit log entry.
 */
export async function getAuditLogDetailsAction(logId: string): Promise<{
  success: boolean;
  message?: string;
  log?: AdminAuditLogDetails;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const log = await db.auditLog.findUnique({
      where: { id: logId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      return { success: false, message: "Audit log entry not found." };
    }

    return {
      success: true,
      log: {
        id: log.id,
        action: log.action,
        entity: log.entity,
        entityId: log.entityId,
        entityName: log.entityName,
        summary: log.summary,
        severity: log.severity,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
        path: log.path,
        actor: log.user
          ? {
              id: log.user.id,
              name: log.user.name,
              email: log.user.email,
              avatar: log.user.avatar,
              role: log.user.role,
            }
          : null,
        hasStateDiff: Boolean(log.previousState || log.newState),
        previousState: log.previousState as Record<string, unknown> | null,
        newState: log.newState as Record<string, unknown> | null,
        metadata: log.metadata as Record<string, unknown> | null,
        createdAt: log.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("[Action.Admin.AuditLogs.Details] Error:", error);
    return { success: false, message: "Failed to retrieve audit log details." };
  }
}

/**
 * Aggregate telemetry for audit overview cards.
 */
export async function getAuditLogStatsAction(): Promise<{
  success: boolean;
  stats: AdminAuditLogStats;
}> {
  try {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
    );

    const [
      totalLogs,
      todayLogs,
      securityAlertsCount,
      stockChangesCount,
      roleChangesCount,
      criticalAlertsCount,
    ] = await Promise.all([
      db.auditLog.count(),
      db.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
      db.auditLog.count({
        where: {
          OR: [
            { severity: AuditSeverity.SECURITY },
            { action: AuditAction.ROLE_CHANGE },
            { action: AuditAction.PASSWORD_RESET },
          ],
        },
      }),
      db.auditLog.count({
        where: {
          OR: [
            { action: AuditAction.STOCK_CHANGE },
            { entity: AuditEntity.STOCK },
          ],
        },
      }),
      db.auditLog.count({
        where: { action: AuditAction.ROLE_CHANGE },
      }),
      db.auditLog.count({
        where: { severity: AuditSeverity.CRITICAL },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalLogs,
        todayLogs,
        securityAlertsCount,
        stockChangesCount,
        roleChangesCount,
        criticalAlertsCount,
      },
    };
  } catch (error) {
    console.error("[Action.Admin.AuditLogs.Stats] Error:", error);
    return {
      success: false,
      stats: {
        totalLogs: 0,
        todayLogs: 0,
        securityAlertsCount: 0,
        stockChangesCount: 0,
        roleChangesCount: 0,
        criticalAlertsCount: 0,
      },
    };
  }
}

/**
 * Export filtered audit logs to CSV for compliance and forensic investigations.
 */
export async function exportAuditLogsAction(
  filter: Partial<AdminAuditLogFilterInput> = {},
): Promise<{
  success: boolean;
  csvContent?: string;
  message?: string;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    const where: Prisma.AuditLogWhereInput = {};
    if (filter.entity) where.entity = filter.entity;
    if (filter.action) where.action = filter.action;
    if (filter.severity) where.severity = filter.severity;
    if (filter.userId) where.userId = filter.userId;

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 2000,
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    });

    const headers = [
      "Timestamp",
      "Action",
      "Entity",
      "Entity Name / ID",
      "Summary",
      "Severity",
      "Actor Name",
      "Actor Email",
      "Actor Role",
      "IP Address",
      "Path",
    ];

    const rows = logs.map((log) => [
      `"${log.createdAt.toISOString()}"`,
      `"${log.action}"`,
      `"${log.entity}"`,
      `"${(log.entityName || log.entityId || "").replace(/"/g, '""')}"`,
      `"${log.summary.replace(/"/g, '""')}"`,
      `"${log.severity}"`,
      `"${(log.user?.name || "System").replace(/"/g, '""')}"`,
      `"${log.user?.email || "system@meawland.com"}"`,
      `"${log.user?.role || "SYSTEM"}"`,
      `"${log.ipAddress || ""}"`,
      `"${log.path || ""}"`,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((r) => r.join(",")),
    ].join("\n");

    return {
      success: true,
      csvContent,
      message: `Exported ${logs.length} audit log entries.`,
    };
  } catch (error) {
    console.error("[Action.Admin.AuditLogs.Export] Error:", error);
    return { success: false, message: "Failed to export audit logs." };
  }
}
