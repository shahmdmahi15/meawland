"use client";

import React, { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  AdminSupportTicket,
  AdminTicketStats,
} from "@/schemas/admin/support-marketing/support/tickets";
import {
  adminUpdateTicketStatusAction,
  adminUpdateTicketPriorityAction,
  adminDeleteSupportTicketAction,
} from "@/actions/admin/support-marketing/support/tickets";
import { TicketDetailModal } from "./ticket-detail-modal";
import { CreateTicketModal } from "./create-ticket-modal";
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
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportChannel,
} from "@/generated/prisma/enums";
import { SUPPORT_CATEGORIES } from "@/schemas/root/account/support";
import { toast } from "sonner";
import {
  cn,
  formatSupportChannel,
  formatSupportPriority,
  formatSupportStatus,
} from "@/lib/utils";
import {
  LifeBuoy,
  Search,
  X,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Package,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface TicketsTableProps {
  tickets: AdminSupportTicket[];
  stats: AdminTicketStats;
  customers: { id: string; name: string; email: string; code: string }[];
}

export function TicketsTable({ tickets, stats, customers }: TicketsTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlTicketId = searchParams.get("ticketId");
  const urlTicketCode = searchParams.get("ticketCode");
  const urlSearch = searchParams.get("search");

  const [activeModalTicketId, setActiveModalTicketId] = useState<string | null>(
    null,
  );

  const urlMatchedTicketId = useMemo(() => {
    if (urlTicketId) {
      return tickets.find((t) => t.id === urlTicketId)?.id ?? null;
    }
    if (urlTicketCode) {
      return (
        tickets.find(
          (t) => t.code.toLowerCase() === urlTicketCode.toLowerCase(),
        )?.id ?? null
      );
    }
    return null;
  }, [urlTicketId, urlTicketCode, tickets]);

  const effectiveActiveTicketId = activeModalTicketId ?? urlMatchedTicketId;

  const [ticketStatuses, setTicketStatuses] = useState<
    Record<string, SupportTicketStatus>
  >({});
  const [ticketPriorities, setTicketPriorities] = useState<
    Record<string, SupportTicketPriority>
  >({});

  const [search, setSearch] = useState(() => urlSearch || "");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [channelFilter, setChannelFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isPending, startTransition] = useTransition();

  // Quick inline status change
  const handleQuickStatusChange = (
    ticketId: string,
    newStatus: SupportTicketStatus,
  ) => {
    setTicketStatuses((prev) => ({ ...prev, [ticketId]: newStatus }));
    startTransition(async () => {
      const res = await adminUpdateTicketStatusAction(ticketId, newStatus);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Quick inline priority change
  const handleQuickPriorityChange = (
    ticketId: string,
    newPriority: SupportTicketPriority,
  ) => {
    setTicketPriorities((prev) => ({ ...prev, [ticketId]: newPriority }));
    startTransition(async () => {
      const res = await adminUpdateTicketPriorityAction(ticketId, newPriority);
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Delete ticket
  const handleDeleteTicket = (ticketId: string, ticketCode: string) => {
    if (confirm(`Are you sure you want to delete ticket #${ticketCode}?`)) {
      startTransition(async () => {
        const res = await adminDeleteSupportTicketAction(ticketId);
        if (res.success) {
          toast.success(res.message);
        } else {
          toast.error(res.message);
        }
      });
    }
  };

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter)
        return false;
      if (channelFilter !== "ALL" && t.channel !== channelFilter) return false;
      if (categoryFilter !== "ALL" && t.category !== categoryFilter)
        return false;

      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesCode = t.code.toLowerCase().includes(q);
        const matchesSubject = t.subject.toLowerCase().includes(q);
        const matchesUserName = t.user.name.toLowerCase().includes(q);
        const matchesUserEmail = t.user.email.toLowerCase().includes(q);
        const matchesUserPhone =
          t.user.phone?.toLowerCase().includes(q) || false;
        const matchesOrder = t.order?.code.toLowerCase().includes(q) || false;

        if (
          !matchesCode &&
          !matchesSubject &&
          !matchesUserName &&
          !matchesUserEmail &&
          !matchesUserPhone &&
          !matchesOrder
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    tickets,
    search,
    statusFilter,
    priorityFilter,
    channelFilter,
    categoryFilter,
  ]);

  const totalPages = Math.ceil(filteredTickets.length / pageSize) || 1;
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTickets.slice(start, start + pageSize);
  }, [filteredTickets, currentPage, pageSize]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-6 h-6 text-[#56C8D8]" />
            <span>Customer Support Tickets</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage, resolve, and follow up with customer inquiries across all
            communication channels.
          </p>
        </div>

        <CreateTicketModal customers={customers} />
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Total Tickets
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              {stats.totalTickets}
            </span>
            <LifeBuoy className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Open Tickets
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-800">
              {stats.openTickets}
            </span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
            In Progress
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-blue-800">
              {stats.inProgressTickets}
            </span>
            <Sparkles className="w-4 h-4 text-blue-600" />
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Resolved
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-800">
              {stats.resolvedTickets}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            Urgent Priority
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-rose-800">
              {stats.urgentTickets}
            </span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ticket code, customer, order #..."
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
          <div className="sm:col-span-2">
            <Select
              value={statusFilter}
              onValueChange={(val) => val && setStatusFilter(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="Status">
                  {statusFilter === "ALL"
                    ? "All Statuses"
                    : formatSupportStatus(statusFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Statuses
                </SelectItem>
                <SelectItem
                  value={SupportTicketStatus.OPEN}
                  className="text-xs"
                >
                  Open
                </SelectItem>
                <SelectItem
                  value={SupportTicketStatus.IN_PROGRESS}
                  className="text-xs"
                >
                  In Progress
                </SelectItem>
                <SelectItem
                  value={SupportTicketStatus.RESOLVED}
                  className="text-xs"
                >
                  Resolved
                </SelectItem>
                <SelectItem
                  value={SupportTicketStatus.CLOSED}
                  className="text-xs"
                >
                  Closed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Filter */}
          <div className="sm:col-span-2">
            <Select
              value={priorityFilter}
              onValueChange={(val) => val && setPriorityFilter(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="Priority">
                  {priorityFilter === "ALL"
                    ? "All Priorities"
                    : formatSupportPriority(priorityFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Priorities
                </SelectItem>
                <SelectItem
                  value={SupportTicketPriority.LOW}
                  className="text-xs"
                >
                  Low
                </SelectItem>
                <SelectItem
                  value={SupportTicketPriority.MEDIUM}
                  className="text-xs"
                >
                  Medium
                </SelectItem>
                <SelectItem
                  value={SupportTicketPriority.HIGH}
                  className="text-xs"
                >
                  High
                </SelectItem>
                <SelectItem
                  value={SupportTicketPriority.URGENT}
                  className="text-xs"
                >
                  Urgent
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Channel Filter */}
          <div className="sm:col-span-2">
            <Select
              value={channelFilter}
              onValueChange={(val) => val && setChannelFilter(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="Channel">
                  {channelFilter === "ALL"
                    ? "All Channels"
                    : formatSupportChannel(channelFilter)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Channels
                </SelectItem>
                <SelectItem
                  value={SupportChannel.WEB_TICKET}
                  className="text-xs"
                >
                  Web Ticket
                </SelectItem>
                <SelectItem value={SupportChannel.WHATSAPP} className="text-xs">
                  WhatsApp
                </SelectItem>
                <SelectItem
                  value={SupportChannel.MESSENGER}
                  className="text-xs"
                >
                  Messenger
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="sm:col-span-2">
            <Select
              value={categoryFilter}
              onValueChange={(val) => val && setCategoryFilter(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="Category">
                  {categoryFilter === "ALL" ? "All Categories" : categoryFilter}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Categories
                </SelectItem>
                {SUPPORT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Support Tickets Table */}
      <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-[#EDF5FA]/80">
            <TableRow>
              <TableHead className="text-xs font-bold text-gray-700">
                Ticket #
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Customer
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Subject &amp; Category
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Order Attached
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Channel
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Priority
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Status
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Date
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTickets.length > 0 ? (
              paginatedTickets.map((ticket) => {
                const dateStr = new Date(ticket.createdAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" },
                );

                const isHighlighted =
                  ticket.id === urlTicketId ||
                  ticket.code.toLowerCase() === urlTicketCode?.toLowerCase() ||
                  effectiveActiveTicketId === ticket.id;

                const currentPriority =
                  ticketPriorities[ticket.id] ?? ticket.priority;
                const currentStatus =
                  ticketStatuses[ticket.id] ?? ticket.status;

                return (
                  <TableRow
                    key={ticket.id}
                    className={cn(
                      "transition-colors",
                      isHighlighted
                        ? "bg-[#EDF5FA] hover:bg-[#E3EFF7] border-l-4 border-l-[#56C8D8]"
                        : "hover:bg-gray-50/70",
                    )}
                  >
                    {/* Ticket Code */}
                    <TableCell className="font-mono text-xs font-bold text-gray-900">
                      #{ticket.code}
                    </TableCell>

                    {/* Customer Info */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-8 w-8 rounded-full overflow-hidden bg-[#EDF5FA] border border-[#D4EEFC] flex items-center justify-center shrink-0">
                          {ticket.user.avatar ? (
                            <Image
                              src={ticket.user.avatar}
                              alt={ticket.user.name}
                              fill
                              sizes="32px"
                              className="object-cover"
                              unoptimized={ticket.user.avatar.startsWith(
                                "data:",
                              )}
                            />
                          ) : (
                            <span className="text-[10px] font-bold text-[#56C8D8]">
                              {ticket.user.name ? ticket.user.name[0] : "U"}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 truncate max-w-[140px]">
                            {ticket.user.name}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            {ticket.user.phone || ticket.user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Subject & Category */}
                    <TableCell className="max-w-[200px]">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {ticket.subject}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 mt-0.5 border-gray-200 text-gray-600 bg-gray-50"
                      >
                        {ticket.category}
                      </Badge>
                    </TableCell>

                    {/* Attached Order */}
                    <TableCell>
                      {ticket.order ? (
                        <Link
                          href={`/admin/management/orders/all-orders?orderId=${ticket.order.id}`}
                          target="_blank"
                          className="font-mono text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-1"
                        >
                          <Package className="w-3 h-3" />
                          <span>#{ticket.order.code}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>

                    {/* Channel */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold",
                          ticket.channel === SupportChannel.WHATSAPP
                            ? "border-emerald-500/30 text-emerald-600 bg-emerald-50"
                            : ticket.channel === SupportChannel.MESSENGER
                              ? "border-blue-500/30 text-blue-600 bg-blue-50"
                              : "border-gray-200 text-gray-600 bg-white",
                        )}
                      >
                        {ticket.channel}
                      </Badge>
                    </TableCell>

                    {/* Priority Dropdown */}
                    <TableCell>
                      <Select
                        value={currentPriority}
                        onValueChange={(val) => {
                          if (val)
                            handleQuickPriorityChange(
                              ticket.id,
                              val as SupportTicketPriority,
                            );
                        }}
                        disabled={isPending}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-7 text-[11px] font-bold px-2 border w-24 rounded-lg cursor-pointer",
                            currentPriority === SupportTicketPriority.URGENT &&
                              "bg-rose-500/10 text-rose-600 border-rose-500/30",
                            currentPriority === SupportTicketPriority.HIGH &&
                              "bg-orange-500/10 text-orange-600 border-orange-500/30",
                            currentPriority === SupportTicketPriority.MEDIUM &&
                              "bg-gray-100 text-gray-700 border-gray-300",
                            currentPriority === SupportTicketPriority.LOW &&
                              "bg-gray-50 text-gray-500 border-gray-200",
                          )}
                        >
                          <SelectValue>
                            {formatSupportPriority(currentPriority)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="min-w-[130px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
                        >
                          <SelectItem
                            value={SupportTicketPriority.LOW}
                            className="text-xs"
                          >
                            Low
                          </SelectItem>
                          <SelectItem
                            value={SupportTicketPriority.MEDIUM}
                            className="text-xs"
                          >
                            Medium
                          </SelectItem>
                          <SelectItem
                            value={SupportTicketPriority.HIGH}
                            className="text-xs text-orange-600 font-bold"
                          >
                            High
                          </SelectItem>
                          <SelectItem
                            value={SupportTicketPriority.URGENT}
                            className="text-xs text-rose-600 font-bold"
                          >
                            Urgent
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Status Dropdown */}
                    <TableCell>
                      <Select
                        value={currentStatus}
                        onValueChange={(val) => {
                          if (val)
                            handleQuickStatusChange(
                              ticket.id,
                              val as SupportTicketStatus,
                            );
                        }}
                        disabled={isPending}
                      >
                        <SelectTrigger
                          className={cn(
                            "h-7 text-[11px] font-bold px-2 border w-28 rounded-lg cursor-pointer",
                            currentStatus === SupportTicketStatus.OPEN &&
                              "bg-amber-500/10 text-amber-600 border-amber-500/30",
                            currentStatus === SupportTicketStatus.IN_PROGRESS &&
                              "bg-blue-500/10 text-blue-600 border-blue-500/30",
                            currentStatus === SupportTicketStatus.RESOLVED &&
                              "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
                            currentStatus === SupportTicketStatus.CLOSED &&
                              "bg-gray-100 text-gray-600 border-gray-300",
                          )}
                        >
                          <SelectValue>
                            {formatSupportStatus(currentStatus)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="min-w-[140px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
                        >
                          <SelectItem
                            value={SupportTicketStatus.OPEN}
                            className="text-xs text-amber-600 font-bold"
                          >
                            Open
                          </SelectItem>
                          <SelectItem
                            value={SupportTicketStatus.IN_PROGRESS}
                            className="text-xs text-blue-600 font-bold"
                          >
                            In Progress
                          </SelectItem>
                          <SelectItem
                            value={SupportTicketStatus.RESOLVED}
                            className="text-xs text-emerald-600 font-bold"
                          >
                            Resolved
                          </SelectItem>
                          <SelectItem
                            value={SupportTicketStatus.CLOSED}
                            className="text-xs text-gray-600 font-bold"
                          >
                            Closed
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    {/* Date */}
                    <TableCell className="text-xs text-gray-500">
                      {dateStr}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <TicketDetailModal
                          ticket={ticket}
                          isOpen={effectiveActiveTicketId === ticket.id}
                          onOpenChange={(isOpen) => {
                            if (isOpen) {
                              setActiveModalTicketId(ticket.id);
                            } else {
                              setActiveModalTicketId(null);
                              if (urlTicketId || urlTicketCode) {
                                router.replace(pathname, { scroll: false });
                              }
                            }
                          }}
                        />

                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            handleDeleteTicket(ticket.id, ticket.code)
                          }
                          disabled={isPending}
                          className="h-8 w-8 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                          title="Delete Ticket"
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
                  colSpan={9}
                  className="text-center py-12 text-gray-500 text-xs"
                >
                  No support tickets found matching your filter criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {filteredTickets.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Showing{" "}
              {Math.min(
                (currentPage - 1) * pageSize + 1,
                filteredTickets.length,
              )}
              –{Math.min(currentPage * pageSize, filteredTickets.length)} of{" "}
              {filteredTickets.length} tickets
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
