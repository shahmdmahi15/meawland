"use client";

import React from "react";
import { DashboardSystemHealth } from "@/actions/admin/dashboard/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Cpu,
  Database,
  Cloud,
  CheckCircle2,
  Clock,
  HardDrive,
} from "lucide-react";

interface SystemHealthCardProps {
  system: DashboardSystemHealth;
}

export function SystemHealthCard({ system }: SystemHealthCardProps) {
  return (
    <Card className="rounded-3xl border-gray-200 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <Server className="w-4 h-4 text-[#56C8D8]" />
            <span>Infrastructure &amp; Server Telemetry</span>
          </h2>
          <p className="text-xs text-gray-500">
            Node {system.nodeVersion} • Next.js {system.nextVersion} • {system.platform}
          </p>
        </div>

        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-1"
        >
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Operational</span>
        </Badge>
      </div>

      {/* System Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        {/* Server Uptime */}
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[10px] font-bold uppercase">Uptime</span>
            <Clock className="w-3.5 h-3.5" />
          </div>
          <p className="text-base font-black text-gray-900 font-mono">
            {system.serverUptimeFormatted}
          </p>
        </div>

        {/* Database Ping */}
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[10px] font-bold uppercase">DB Latency</span>
            <Database className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-base font-black text-gray-900 font-mono">
            {system.dbLatencyMs} ms
          </p>
        </div>

        {/* Node Heap Memory */}
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[10px] font-bold uppercase">Heap Used</span>
            <Cpu className="w-3.5 h-3.5 text-[#56C8D8]" />
          </div>
          <p className="text-base font-black text-gray-900 font-mono">
            {system.memoryUsageMb.heapUsed} MB
          </p>
        </div>

        {/* Cloud Media Engine */}
        <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[10px] font-bold uppercase">Storage</span>
            <Cloud className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <p className="text-base font-black text-gray-900 truncate">
            AWS S3
          </p>
        </div>
      </div>

      {/* Memory Utilization Progress Bar */}
      <div className="space-y-1.5 pt-2 border-t border-gray-100 text-xs">
        <div className="flex justify-between text-[11px] font-semibold text-gray-700">
          <span className="flex items-center gap-1">
            <HardDrive className="w-3.5 h-3.5 text-gray-400" /> Server Memory Load
          </span>
          <span className="font-mono">{system.memoryUsageMb.heapUsed} MB / {system.memoryUsageMb.heapTotal} MB Heap ({system.memoryUsageMb.systemUsagePct}% Sys RAM)</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#56C8D8]"
            style={{ width: `${Math.min(100, Math.max(10, system.memoryUsageMb.systemUsagePct))}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
