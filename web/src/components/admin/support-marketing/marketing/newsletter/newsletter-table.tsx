"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  AdminNewsletterSubscriber,
  AdminNewsletterStats,
} from "@/schemas/admin/support-marketing/marketing/newsletter";
import {
  adminToggleSubscriberStatusAction,
  adminDeleteSubscriberAction,
} from "@/actions/admin/support-marketing/marketing/newsletter";
import { AddSubscriberModal } from "./add-subscriber-modal";
import { BroadcastComposeModal } from "./broadcast-compose-modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NewsletterStatus } from "@/generated/prisma/enums";
import { toast } from "sonner";
import {
  Mail,
  Search,
  X,
  Download,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  UserX,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsletterTableProps {
  subscribers: AdminNewsletterSubscriber[];
  stats: AdminNewsletterStats;
}

export function NewsletterTable({ subscribers, stats }: NewsletterTableProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isPending, startTransition] = useTransition();

  // Extract unique sources for filter dropdown
  const uniqueSources = useMemo(() => {
    const set = new Set<string>();
    for (const sub of subscribers) {
      if (sub.source) set.add(sub.source);
    }
    return Array.from(set);
  }, [subscribers]);

  // Toggle status inline
  const handleToggleStatus = (id: string, currentStatus: NewsletterStatus) => {
    const nextStatus =
      currentStatus === NewsletterStatus.SUBSCRIBED
        ? NewsletterStatus.UNSUBSCRIBED
        : NewsletterStatus.SUBSCRIBED;

    startTransition(async () => {
      const res = await adminToggleSubscriberStatusAction(id, nextStatus);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Delete subscriber
  const handleDelete = (id: string, email: string) => {
    if (confirm(`Remove "${email}" from the subscriber list?`)) {
      startTransition(async () => {
        const res = await adminDeleteSubscriberAction(id);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      });
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (subscribers.length === 0) {
      toast.error("No subscriber records to export.");
      return;
    }

    const headers = ["Email", "Status", "Source", "Subscribed At"];
    const rows = filteredSubscribers.map((s) => [
      s.email,
      s.status,
      s.source || "N/A",
      new Date(s.createdAt).toISOString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `meawland_newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Subscriber list exported to CSV!");
  };

  // Filtered subscribers
  const filteredSubscribers = useMemo(() => {
    return subscribers.filter((s) => {
      if (statusFilter !== "ALL" && s.status !== statusFilter) return false;
      if (sourceFilter !== "ALL" && (s.source || "UNKNOWN") !== sourceFilter) {
        return false;
      }

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!s.email.toLowerCase().includes(q)) return false;
      }

      return true;
    });
  }, [subscribers, search, statusFilter, sourceFilter]);

  const totalPages = Math.ceil(filteredSubscribers.length / pageSize) || 1;
  const paginatedSubscribers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSubscribers.slice(start, start + pageSize);
  }, [filteredSubscribers, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Mail className="w-6 h-6 text-[#56C8D8]" />
            <span>VIP Newsletter &amp; Email Marketing</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Grow your audience, track subscription channels, export recipient
            lists, and dispatch campaign announcements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <BroadcastComposeModal activeCount={stats.activeSubscribers} />
          <AddSubscriberModal />
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Enrolled
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              {stats.totalSubscribers}
            </span>
            <Mail className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Active Subscribers
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
              {stats.activeSubscribers}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Unsubscribed
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-700">
              {stats.unsubscribedCount}
            </span>
            <UserX className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-[#D4EEFC] bg-[#EDF5FA]/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-[#0097a7] uppercase tracking-wider block">
            New This Month
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-[#56C8D8]">
              +{stats.newThisMonthCount}
            </span>
            <Sparkles className="w-4 h-4 text-[#56C8D8]" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subscriber by email..."
              className="pl-9.5 pr-8 h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <Select
              value={statusFilter}
              onValueChange={(val) => val && setStatusFilter(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Statuses
                </SelectItem>
                <SelectItem
                  value={NewsletterStatus.SUBSCRIBED}
                  className="text-xs"
                >
                  Subscribed Only
                </SelectItem>
                <SelectItem
                  value={NewsletterStatus.UNSUBSCRIBED}
                  className="text-xs"
                >
                  Unsubscribed Only
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Source Filter */}
          <div className="sm:col-span-2">
            <Select
              value={sourceFilter}
              onValueChange={(val) => val && setSourceFilter(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Sources
                </SelectItem>
                {uniqueSources.map((src) => (
                  <SelectItem key={src} value={src} className="text-xs">
                    {src}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Export CSV Button */}
          <div className="sm:col-span-2 flex justify-end">
            <Button
              variant="outline"
              onClick={handleExportCSV}
              className="w-full h-10 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Subscribers Table */}
      <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-[#EDF5FA]/80">
            <TableRow>
              <TableHead className="text-xs font-bold text-gray-700">
                Subscriber Email
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Acquisition Source
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Subscribed Date
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedSubscribers.length > 0 ? (
              paginatedSubscribers.map((sub) => {
                const isSub = sub.status === NewsletterStatus.SUBSCRIBED;
                const dateStr = new Date(sub.createdAt).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                );

                return (
                  <TableRow
                    key={sub.id}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Email */}
                    <TableCell className="font-semibold text-xs text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-[#EDF5FA] border border-[#D4EEFC] flex items-center justify-center text-[#56C8D8] shrink-0">
                          <Mail className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-medium text-gray-900">
                          {sub.email}
                        </span>
                      </div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold",
                          isSub
                            ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                            : "border-gray-300 text-gray-500 bg-gray-50",
                        )}
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>

                    {/* Source */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 border-gray-200 text-gray-600 bg-gray-50 uppercase font-mono"
                      >
                        {sub.source || "FOOTER"}
                      </Badge>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-gray-500">
                      {dateStr}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(sub.id, sub.status)}
                          disabled={isPending}
                          className="h-8 rounded-xl border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>{isSub ? "Unsubscribe" : "Re-activate"}</span>
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(sub.id, sub.email)}
                          disabled={isPending}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                          title="Delete Subscriber"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-12 text-gray-500 text-xs"
                >
                  No newsletter subscribers found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {filteredSubscribers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Showing{" "}
              {Math.min(
                (currentPage - 1) * pageSize + 1,
                filteredSubscribers.length,
              )}
              –{Math.min(currentPage * pageSize, filteredSubscribers.length)} of{" "}
              {filteredSubscribers.length} subscribers
            </span>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-xl border-gray-200"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="font-bold text-gray-900">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 rounded-xl border-gray-200"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
