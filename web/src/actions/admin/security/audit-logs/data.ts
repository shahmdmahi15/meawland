"use server";

import db from "@/lib/db";
import { getAuditLogsAction, getAuditLogStatsAction } from "./logs";
import { Role } from "@/generated/prisma/enums";
import type { AdminAuditLogSummary, AdminAuditLogStats } from "./types";

export interface AuditLogsPageData {
  logs: AdminAuditLogSummary[];
  total: number;
  stats: AdminAuditLogStats;
  adminUsers: Array<{ id: string; name: string; email: string; role: Role }>;
}

export async function getAuditLogsPageDataAction(): Promise<{
  success: boolean;
  data: AuditLogsPageData;
}> {
  try {
    const [logsRes, statsRes, adminUsersRaw] = await Promise.all([
      getAuditLogsAction({ page: 1, pageSize: 25 }),
      getAuditLogStatsAction(),
      db.user.findMany({
        where: {
          role: { in: [Role.ADMIN, Role.OWNER] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
        orderBy: { name: "asc" },
      }),
    ]);

    return {
      success: true,
      data: {
        logs: logsRes.logs || [],
        total: logsRes.total || 0,
        stats: statsRes.stats || {
          totalLogs: 0,
          todayLogs: 0,
          securityAlertsCount: 0,
          stockChangesCount: 0,
          roleChangesCount: 0,
          criticalAlertsCount: 0,
        },
        adminUsers: adminUsersRaw,
      },
    };
  } catch (error) {
    console.error("[Action.Admin.AuditLogs.GetPageData] Error:", error);
    return {
      success: false,
      data: {
        logs: [],
        total: 0,
        stats: {
          totalLogs: 0,
          todayLogs: 0,
          securityAlertsCount: 0,
          stockChangesCount: 0,
          roleChangesCount: 0,
          criticalAlertsCount: 0,
        },
        adminUsers: [],
      },
    };
  }
}
