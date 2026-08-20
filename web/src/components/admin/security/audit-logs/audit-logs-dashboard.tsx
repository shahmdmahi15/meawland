"use client";

import React from "react";
import {
  AdminAuditLogSummary,
  AdminAuditLogStats,
} from "@/actions/admin/security/audit-logs/types";
import { Role } from "@/generated/prisma/enums";
import { AuditStatsCards } from "./audit-stats-cards";
import { AuditLogsTable } from "./audit-logs-table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Lock } from "lucide-react";

interface AuditLogsDashboardProps {
  initialLogs: AdminAuditLogSummary[];
  totalLogs: number;
  stats: AdminAuditLogStats;
  adminUsers: Array<{ id: string; name: string; email: string; role: Role }>;
}

export function AuditLogsDashboard({
  initialLogs,
  totalLogs,
  stats,
  adminUsers,
}: AuditLogsDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EDF5FA] text-[#0097a7] border border-[#D4EEFC]">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                Security &amp; Forensic Audit Trail
              </h1>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold gap-1"
              >
                <Lock className="w-3 h-3 text-purple-600" />
                <span>Tamper-Proof</span>
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Complete historical record of every mutation, order status transition, inventory modification, and administrative privilege change.
            </p>
          </div>
        </div>
      </div>

      {/* Audit Telemetry Cards */}
      <AuditStatsCards stats={stats} />

      {/* Main Audit Table */}
      <AuditLogsTable
        initialLogs={initialLogs}
        totalLogs={totalLogs}
        adminUsers={adminUsers}
      />
    </div>
  );
}
