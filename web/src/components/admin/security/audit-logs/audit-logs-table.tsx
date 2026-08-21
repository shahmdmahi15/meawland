"use client";

import React, { useState, useTransition } from "react";
import { AdminAuditLogSummary } from "@/actions/admin/security/audit-logs/types";
import {
  AuditAction,
  AuditEntity,
  AuditSeverity,
  Role,
} from "@/generated/prisma/enums";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  Eye,
  Shield,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
  Layers,
  FileCode,
} from "lucide-react";
import { getAuditLogsAction } from "@/actions/admin/security/audit-logs/logs";
import { AuditLogDetailsModal } from "./audit-log-details-modal";
import { AuditExportModal } from "./audit-export-modal";

interface AuditLogsTableProps {
  initialLogs: AdminAuditLogSummary[];
  totalLogs: number;
  adminUsers: Array<{ id: string; name: string; email: string; role: Role }>;
}

const SEVERITY_BADGE_STYLE: Record<
  AuditSeverity,
  { label: string; className: string }
> = {
  [AuditSeverity.INFO]: {
    label: "INFO",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  [AuditSeverity.WARNING]: {
    label: "WARNING",
    className: "bg-amber-50 text-amber-800 border-amber-300 font-bold",
  },
  [AuditSeverity.CRITICAL]: {
    label: "CRITICAL",
    className: "bg-rose-50 text-rose-800 border-rose-300 font-bold",
  },
  [AuditSeverity.SECURITY]: {
    label: "SECURITY",
    className: "bg-purple-50 text-purple-800 border-purple-300 font-bold",
  },
};

export function AuditLogsTable({
  initialLogs,
  totalLogs: initialTotal,
  adminUsers,
}: AuditLogsTableProps) {
  const [logs, setLogs] = useState<AdminAuditLogSummary[]>(initialLogs);
  const [total, setTotal] = useState<number>(initialTotal);
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);

  // Filters State
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState<string>("ALL");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [severityFilter, setSeverityFilter] = useState<string>("ALL");
  const [userFilter, setUserFilter] = useState<string>("ALL");

  const [selectedLog, setSelectedLog] = useState<AdminAuditLogSummary | null>(
    null,
  );
  const [isRefreshing, startTransition] = useTransition();

  const handleFetch = (
    nextPage = page,
    nextSearch = search,
    nextEntity = entityFilter,
    nextAction = actionFilter,
    nextSeverity = severityFilter,
    nextUser = userFilter,
  ) => {
    startTransition(async () => {
      const res = await getAuditLogsAction({
        page: nextPage,
        pageSize,
        search: nextSearch.trim() || undefined,
        entity: nextEntity !== "ALL" ? (nextEntity as AuditEntity) : undefined,
        action: nextAction !== "ALL" ? (nextAction as AuditAction) : undefined,
        severity:
          nextSeverity !== "ALL" ? (nextSeverity as AuditSeverity) : undefined,
        userId: nextUser !== "ALL" ? nextUser : undefined,
      });

      if (res.success && res.logs) {
        setLogs(res.logs);
        setTotal(res.total || 0);
        setPage(nextPage);
      }
    });
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-3xl bg-gray-50/80 border border-gray-200 space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input
              placeholder="Search audit trail, entity, actor, IP..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                handleFetch(
                  1,
                  e.target.value,
                  entityFilter,
                  actionFilter,
                  severityFilter,
                  userFilter,
                );
              }}
              className="pl-8.5 h-9 text-xs bg-white rounded-xl"
            />
          </div>

          {/* Export & Refresh */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <AuditExportModal />
            <Button
              size="sm"
              variant="outline"
              disabled={isRefreshing}
              onClick={() => handleFetch()}
              className="h-9 text-xs font-semibold gap-1.5 bg-white border-gray-200 shadow-xs cursor-pointer rounded-xl"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter Dropdowns Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-200/60">
          {/* Entity Filter */}
          <Select
            value={entityFilter}
            onValueChange={(val) => {
              if (!val) return;
              setEntityFilter(val);
              handleFetch(
                1,
                search,
                val,
                actionFilter,
                severityFilter,
                userFilter,
              );
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white rounded-xl">
              <SelectValue>
                {entityFilter === "ALL" ? "All Entities" : entityFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-56 z-50 bg-white">
              <SelectItem value="ALL" className="text-xs">
                All Entities
              </SelectItem>
              {Object.values(AuditEntity).map((e) => (
                <SelectItem key={e} value={e} className="text-xs">
                  {e}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Action Filter */}
          <Select
            value={actionFilter}
            onValueChange={(val) => {
              if (!val) return;
              setActionFilter(val);
              handleFetch(
                1,
                search,
                entityFilter,
                val,
                severityFilter,
                userFilter,
              );
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white rounded-xl">
              <SelectValue>
                {actionFilter === "ALL" ? "All Actions" : actionFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-56 z-50 bg-white">
              <SelectItem value="ALL" className="text-xs">
                All Actions
              </SelectItem>
              {Object.values(AuditAction).map((a) => (
                <SelectItem key={a} value={a} className="text-xs">
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Severity Filter */}
          <Select
            value={severityFilter}
            onValueChange={(val) => {
              if (!val) return;
              setSeverityFilter(val);
              handleFetch(
                1,
                search,
                entityFilter,
                actionFilter,
                val,
                userFilter,
              );
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white rounded-xl">
              <SelectValue>
                {severityFilter === "ALL" ? "All Severities" : severityFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-50 bg-white">
              <SelectItem value="ALL" className="text-xs">
                All Severities
              </SelectItem>
              {Object.values(AuditSeverity).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Actor User Filter */}
          <Select
            value={userFilter}
            onValueChange={(val) => {
              if (!val) return;
              setUserFilter(val);
              handleFetch(
                1,
                search,
                entityFilter,
                actionFilter,
                severityFilter,
                val,
              );
            }}
          >
            <SelectTrigger className="h-8 text-xs bg-white rounded-xl">
              <SelectValue>
                {userFilter === "ALL"
                  ? "All Actors"
                  : adminUsers.find((u) => u.id === userFilter)?.name ||
                    "Selected Actor"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-56 z-50 bg-white">
              <SelectItem value="ALL" className="text-xs">
                All Actors
              </SelectItem>
              {adminUsers.map((u) => (
                <SelectItem key={u.id} value={u.id} className="text-xs">
                  {u.name} ({u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-3xl border border-gray-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-gray-50/80">
            <TableRow>
              <TableHead className="text-xs font-bold text-gray-700 pl-5">
                Timestamp
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Action / Target
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Summary &amp; Narrative
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Actor Attribution
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Severity
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right pr-5">
                Inspect
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-44 text-center text-xs text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Shield className="w-8 h-8 text-gray-300" />
                    <p className="font-bold text-gray-700">
                      No audit log entries found
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Administrative mutations and system changes will be
                      permanently tracked here.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const sevConfig =
                  SEVERITY_BADGE_STYLE[log.severity] ||
                  SEVERITY_BADGE_STYLE.INFO;

                return (
                  <TableRow
                    key={log.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    {/* Timestamp */}
                    <TableCell className="pl-5 py-3.5 text-xs text-gray-600 whitespace-nowrap">
                      <div>
                        <p className="font-bold text-gray-900 leading-tight">
                          {new Date(log.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {new Date(log.createdAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            second: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>
                    </TableCell>

                    {/* Action & Target */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono font-bold bg-[#EDF5FA] text-[#0097a7] border-[#D4EEFC]"
                        >
                          {log.action}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="text-[9px] font-mono text-gray-600 bg-gray-50"
                        >
                          {log.entity}
                        </Badge>
                      </div>
                      {log.entityName && (
                        <p className="text-[11px] font-bold text-gray-800 truncate max-w-xs mt-1">
                          {log.entityName}
                        </p>
                      )}
                    </TableCell>

                    {/* Summary */}
                    <TableCell className="max-w-md">
                      <p className="text-xs text-gray-800 font-medium line-clamp-2">
                        {log.summary}
                      </p>
                      {log.hasStateDiff && (
                        <span className="text-[10px] text-purple-600 font-bold flex items-center gap-1 mt-0.5">
                          <FileCode className="w-3 h-3" /> State Delta Captured
                        </span>
                      )}
                    </TableCell>

                    {/* Actor */}
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-[#56C8D8] text-white flex items-center justify-center text-[10px] font-black shrink-0">
                          {log.actor?.name
                            ? log.actor.name[0].toUpperCase()
                            : "S"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 leading-tight">
                            {log.actor?.name || "System"}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            {log.actor ? log.actor.role : "AUTOMATED"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Severity */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[9px] ${sevConfig.className}`}
                      >
                        {sevConfig.label}
                      </Badge>
                    </TableCell>

                    {/* Action button */}
                    <TableCell className="text-right pr-5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLog(log)}
                        className="h-8 text-xs font-bold gap-1 text-[#0097a7] hover:bg-[#EDF5FA] rounded-xl cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 px-3">
          <span>
            Showing {(page - 1) * pageSize + 1} &ndash;{" "}
            {Math.min(page * pageSize, total)} of {total.toLocaleString()} total
            events
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || isRefreshing}
              onClick={() => handleFetch(page - 1)}
              className="h-8 text-xs font-bold rounded-xl bg-white border-gray-200 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>Previous</span>
            </Button>

            <span className="font-bold text-gray-700 px-2">
              Page {page} of {totalPages}
            </span>

            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || isRefreshing}
              onClick={() => handleFetch(page + 1)}
              className="h-8 text-xs font-bold rounded-xl bg-white border-gray-200 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedLog && (
        <AuditLogDetailsModal
          logSummary={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
}
