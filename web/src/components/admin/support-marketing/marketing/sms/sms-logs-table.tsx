"use client";

import React, { useState, useTransition } from "react";
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
import { SmsDeliveryStatus } from "@/generated/prisma/enums";
import type { AdminSmsLogSummary } from "@/actions/admin/support-marketing/marketing/sms/types";
import {
  getSmsLogsAction,
  retryFailedSmsLogAction,
} from "@/actions/admin/support-marketing/marketing/sms/logs";
import { toast } from "sonner";
import {
  Search,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
} from "lucide-react";

interface SmsLogsTableProps {
  initialLogs: AdminSmsLogSummary[];
  totalLogs: number;
}

const STATUS_CONFIG: Record<
  SmsDeliveryStatus,
  { label: string; color: string; icon: React.ElementType }
> = {
  [SmsDeliveryStatus.PENDING]: {
    label: "Pending",
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: Clock,
  },
  [SmsDeliveryStatus.SUBMITTED]: {
    label: "Submitted",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    icon: Send,
  },
  [SmsDeliveryStatus.DELIVERED]: {
    label: "Delivered",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  [SmsDeliveryStatus.FAILED]: {
    label: "Failed",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    icon: AlertCircle,
  },
};

export function SmsLogsTable({ initialLogs, totalLogs }: SmsLogsTableProps) {
  const [logs, setLogs] = useState(initialLogs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleFilter = (status: string, query: string) => {
    startTransition(async () => {
      const res = await getSmsLogsAction({
        status: status as SmsDeliveryStatus | "ALL",
        search: query,
        page: 1,
        pageSize: 30,
      });
      if (res.success) {
        setLogs(res.logs);
      }
    });
  };

  const handleRetry = async (logId: string) => {
    try {
      setRetryingId(logId);
      const res = await retryFailedSmsLogAction(logId);
      if (res.success) {
        toast.success(res.message || "SMS resent successfully!");
        setLogs((prev) =>
          prev.map((l) =>
            l.id === logId
              ? { ...l, status: SmsDeliveryStatus.SUBMITTED, responseCode: 202 }
              : l,
          ),
        );
      } else {
        toast.error(res.message || "Retry failed.");
      }
    } catch {
      toast.error("Failed to retry SMS.");
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by phone, name, or text..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              handleFilter(statusFilter, e.target.value);
            }}
            className="pl-8 h-8 text-xs bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (!val) return;
              setStatusFilter(val);
              handleFilter(val, search);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-36 bg-white">
              <SelectValue>
                {statusFilter === "ALL"
                  ? "All Statuses"
                  : STATUS_CONFIG[statusFilter as SmsDeliveryStatus]?.label ||
                    statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-50 bg-white">
              <SelectItem value="ALL" className="text-xs">
                All Statuses
              </SelectItem>
              {Object.values(SmsDeliveryStatus).map((st) => (
                <SelectItem key={st} value={st} className="text-xs">
                  {STATUS_CONFIG[st]?.label || st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-gray-50/70">
            <TableRow>
              <TableHead className="font-bold text-xs">Recipient</TableHead>
              <TableHead className="font-bold text-xs">
                Message Content
              </TableHead>
              <TableHead className="font-bold text-xs">
                Source / Linked
              </TableHead>
              <TableHead className="text-center font-bold text-xs">
                Status
              </TableHead>
              <TableHead className="text-center font-bold text-xs">
                Response Code
              </TableHead>
              <TableHead className="text-center font-bold text-xs">
                Timestamp
              </TableHead>
              <TableHead className="text-right font-bold text-xs pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-40 text-center text-muted-foreground text-xs"
                >
                  No SMS delivery logs recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const statusMeta = STATUS_CONFIG[log.status];
                const StatusIcon = statusMeta?.icon || Clock;

                return (
                  <TableRow key={log.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <div className="space-y-0.5">
                        <span className="font-bold font-mono text-xs text-gray-900">
                          {log.recipientPhone}
                        </span>
                        {log.recipientName && (
                          <div className="text-[11px] text-gray-500">
                            {log.recipientName}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-md">
                      <p className="font-mono text-xs text-gray-700 line-clamp-2">
                        {log.message}
                      </p>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5 text-[11px]">
                        {log.campaignTitle && (
                          <Badge variant="outline" className="text-[10px]">
                            Campaign: {log.campaignTitle}
                          </Badge>
                        )}
                        {log.orderCode && (
                          <span className="text-primary font-bold block">
                            Order #{log.orderCode}
                          </span>
                        )}
                        {!log.campaignTitle && !log.orderCode && (
                          <span className="text-gray-400">Direct / System</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] uppercase font-bold gap-1 ${statusMeta?.color}`}
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{statusMeta?.label || log.status}</span>
                      </Badge>
                    </TableCell>

                    <TableCell className="text-center font-mono text-xs font-bold text-gray-600">
                      {log.responseCode || "—"}
                    </TableCell>

                    <TableCell className="text-center text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      {log.status === SmsDeliveryStatus.FAILED && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={retryingId === log.id}
                          onClick={() => handleRetry(log.id)}
                          className="h-7 text-xs px-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 gap-1 cursor-pointer"
                          title="Retry Sending SMS"
                        >
                          <RotateCcw
                            className={`w-3.5 h-3.5 ${
                              retryingId === log.id ? "animate-spin" : ""
                            }`}
                          />
                          <span>Retry</span>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
