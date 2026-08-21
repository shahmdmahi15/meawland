"use client";

import React, { useState, useTransition } from "react";
import { AdminEmailLogSummary } from "@/actions/admin/support-marketing/marketing/email/types";
import { EmailDeliveryStatus } from "@/generated/prisma/enums";
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
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  RotateCcw,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import {
  getEmailLogsAction,
  retryFailedEmailLogAction,
} from "@/actions/admin/support-marketing/marketing/email/logs";

interface EmailLogsTableProps {
  initialLogs: AdminEmailLogSummary[];
  totalLogs: number;
}

const STATUS_CONFIG: Record<
  EmailDeliveryStatus,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  [EmailDeliveryStatus.PENDING]: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
  },
  [EmailDeliveryStatus.SENT]: {
    label: "Delivered",
    variant: "default",
    icon: CheckCircle2,
  },
  [EmailDeliveryStatus.FAILED]: {
    label: "Failed",
    variant: "destructive",
    icon: AlertCircle,
  },
  [EmailDeliveryStatus.BOUNCED]: {
    label: "Bounced",
    variant: "destructive",
    icon: AlertCircle,
  },
};

export function EmailLogsTable({
  initialLogs,
  totalLogs: initialTotal,
}: EmailLogsTableProps) {
  const [logs, setLogs] = useState<AdminEmailLogSummary[]>(initialLogs);
  const [total, setTotal] = useState<number>(initialTotal);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isRefreshing, startTransition] = useTransition();
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const handleFilter = (status = statusFilter, query = search) => {
    startTransition(async () => {
      const res = await getEmailLogsAction({
        page: 1,
        pageSize: 50,
        status: status !== "ALL" ? (status as EmailDeliveryStatus) : undefined,
        search: query.trim() || undefined,
      });

      if (res.success && res.logs) {
        setLogs(res.logs);
        setTotal(res.total || 0);
      }
    });
  };

  const handleRetry = async (logId: string) => {
    setRetryingId(logId);
    try {
      const res = await retryFailedEmailLogAction(logId);
      if (res.success) {
        toast.success(res.message);
        handleFilter();
      } else {
        toast.error(res.message);
      }
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50/70 border border-gray-200">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <Input
            placeholder="Search email, recipient, subject, order #..."
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
              setStatusFilter(val);
              handleFilter(val, search);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-36 bg-white">
              <SelectValue>
                {statusFilter === "ALL"
                  ? "All Statuses"
                  : STATUS_CONFIG[statusFilter as EmailDeliveryStatus]?.label ||
                    statusFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="z-50 bg-white">
              <SelectItem value="ALL" className="text-xs">
                All Statuses
              </SelectItem>
              {Object.values(EmailDeliveryStatus).map((st) => (
                <SelectItem key={st} value={st} className="text-xs">
                  {STATUS_CONFIG[st]?.label || st}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant="outline"
            disabled={isRefreshing}
            onClick={() => handleFilter()}
            className="h-8 text-xs font-semibold gap-1.5 bg-white shadow-xs cursor-pointer"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-primary" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-gray-50/70">
            <TableRow>
              <TableHead className="text-xs font-bold text-gray-700 pl-4">
                Recipient
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Subject
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Linked Source
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Timestamp
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right pr-4">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-40 text-center text-xs text-gray-500"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Mail className="w-8 h-8 text-gray-300" />
                    <p className="font-bold text-gray-700">
                      No email delivery logs recorded yet
                    </p>
                    <p className="text-[11px] text-gray-400">
                      Dispatched emails and automated notifications will appear
                      here in real-time.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const conf = STATUS_CONFIG[log.status] || STATUS_CONFIG.PENDING;
                const StatusIcon = conf.icon;
                const isRetrying = retryingId === log.id;

                return (
                  <TableRow
                    key={log.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <TableCell className="pl-4 py-3">
                      <div>
                        <p className="font-bold text-xs text-gray-900 leading-tight">
                          {log.recipientEmail}
                        </p>
                        {log.recipientName && (
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {log.recipientName}
                          </p>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <p className="text-xs text-gray-800 font-semibold truncate">
                        {log.subject}
                      </p>
                      {log.errorMessage && (
                        <p className="text-[10px] text-rose-600 truncate mt-0.5">
                          {log.errorMessage}
                        </p>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={conf.variant}
                        className="text-[10px] font-bold gap-1"
                      >
                        <StatusIcon className="w-3 h-3" />
                        <span>{conf.label}</span>
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-gray-600">
                      {log.orderCode ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono"
                        >
                          #{log.orderCode}
                        </Badge>
                      ) : log.campaignTitle ? (
                        <span className="text-[11px] font-semibold text-[#0097a7]">
                          {log.campaignTitle}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">
                          Direct
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-gray-500">
                      {new Date(log.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </TableCell>

                    <TableCell className="text-right pr-4">
                      {log.status === EmailDeliveryStatus.FAILED && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isRetrying}
                          onClick={() => handleRetry(log.id)}
                          className="h-7 text-xs font-semibold gap-1 text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                        >
                          <RotateCcw
                            className={`w-3.5 h-3.5 ${isRetrying ? "animate-spin" : ""}`}
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

      {total > 0 && (
        <div className="flex justify-between items-center text-xs text-gray-500 px-2">
          <span>
            Showing {logs.length} of {total} total delivery records
          </span>
        </div>
      )}
    </div>
  );
}
