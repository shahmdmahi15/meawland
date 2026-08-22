"use client";

import React from "react";
import { AdminAuditLogStats } from "@/actions/admin/security/audit-logs/types";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert, History, Clock, Package } from "lucide-react";

interface AuditStatsCardsProps {
  stats: AdminAuditLogStats;
}

export function AuditStatsCards({ stats }: AuditStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {/* 1. Total System Events */}
      <Card className="rounded-3xl border-gray-200 bg-white shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Total Logged Events
            </span>
            <div className="p-1.5 rounded-xl bg-gray-100 text-gray-700">
              <History className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-gray-900">
              {stats.totalLogs.toLocaleString()}
            </p>
            <span className="text-[10px] text-gray-400 font-semibold block">
              Immutable audit ledger
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2. Today's Events */}
      <Card className="rounded-3xl border-gray-200 bg-white shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#0097a7] uppercase tracking-wider">
              Today&apos;s Actions
            </span>
            <div className="p-1.5 rounded-xl bg-[#EDF5FA] text-[#0097a7]">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-[#0097a7]">
              +{stats.todayLogs.toLocaleString()}
            </p>
            <span className="text-[10px] text-[#0097a7] font-bold block">
              Operations today
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 3. Security & Privilege Changes */}
      <Card className="rounded-3xl border-gray-200 bg-white shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
              Security &amp; Roles
            </span>
            <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-purple-900">
              {stats.securityAlertsCount}
            </p>
            <span className="text-[10px] text-purple-700 font-bold block">
              {stats.roleChangesCount} role elevations
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 4. Stock & Inventory Alterations */}
      <Card className="rounded-3xl border-gray-200 bg-white shadow-xs">
        <CardContent className="p-4 flex flex-col justify-between h-full space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
              Stock Alterations
            </span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-amber-900">
              {stats.stockChangesCount}
            </p>
            <span className="text-[10px] text-amber-700 font-bold block">
              Inventory modifications
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
