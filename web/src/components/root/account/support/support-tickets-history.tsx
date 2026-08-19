"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { SupportTicketSummary } from "@/schemas/root/account/support";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  SupportTicketStatus,
  SupportTicketPriority,
  SupportChannel,
} from "@/generated/prisma/enums";
import {
  LifeBuoy,
  Clock,
  CheckCircle2,
  Package,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SupportTicketsHistoryProps {
  tickets: SupportTicketSummary[];
}

export function SupportTicketsHistory({ tickets }: SupportTicketsHistoryProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "OPEN" | "RESOLVED">(
    "ALL",
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredTickets = useMemo(() => {
    if (activeTab === "OPEN") {
      return tickets.filter(
        (t) =>
          t.status === SupportTicketStatus.OPEN ||
          t.status === SupportTicketStatus.IN_PROGRESS,
      );
    }
    if (activeTab === "RESOLVED") {
      return tickets.filter(
        (t) =>
          t.status === SupportTicketStatus.RESOLVED ||
          t.status === SupportTicketStatus.CLOSED,
      );
    }
    return tickets;
  }, [tickets, activeTab]);

  const getStatusBadge = (status: SupportTicketStatus) => {
    switch (status) {
      case SupportTicketStatus.OPEN:
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-600 bg-amber-500/10 font-bold gap-1 text-[11px]"
          >
            <Clock className="w-3 h-3" />
            OPEN
          </Badge>
        );
      case SupportTicketStatus.IN_PROGRESS:
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-600 bg-blue-500/10 font-bold gap-1 text-[11px]"
          >
            <Sparkles className="w-3 h-3" />
            IN PROGRESS
          </Badge>
        );
      case SupportTicketStatus.RESOLVED:
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold gap-1 text-[11px]"
          >
            <CheckCircle2 className="w-3 h-3" />
            RESOLVED
          </Badge>
        );
      case SupportTicketStatus.CLOSED:
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-600 bg-gray-100 font-bold gap-1 text-[11px]"
          >
            CLOSED
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: SupportTicketPriority) => {
    switch (priority) {
      case SupportTicketPriority.URGENT:
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 text-rose-600 bg-rose-500/10 font-bold text-[10px]"
          >
            URGENT
          </Badge>
        );
      case SupportTicketPriority.HIGH:
        return (
          <Badge
            variant="outline"
            className="border-orange-500/30 text-orange-600 bg-orange-500/10 font-bold text-[10px]"
          >
            HIGH
          </Badge>
        );
      case SupportTicketPriority.MEDIUM:
        return (
          <Badge
            variant="outline"
            className="border-gray-300 text-gray-600 bg-gray-50 font-medium text-[10px]"
          >
            MEDIUM
          </Badge>
        );
      case SupportTicketPriority.LOW:
        return (
          <Badge
            variant="outline"
            className="border-gray-200 text-gray-400 bg-gray-50 font-normal text-[10px]"
          >
            LOW
          </Badge>
        );
      default:
        return null;
    }
  };

  const getChannelBadge = (channel: SupportChannel) => {
    switch (channel) {
      case SupportChannel.WHATSAPP:
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-700 bg-emerald-50 font-semibold text-[10px]"
          >
            WhatsApp
          </Badge>
        );
      case SupportChannel.MESSENGER:
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-700 bg-blue-50 font-semibold text-[10px]"
          >
            Messenger
          </Badge>
        );
      default:
        return (
          <Badge
            variant="outline"
            className="border-gray-200 text-gray-600 bg-white font-semibold text-[10px]"
          >
            Web Ticket
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Status Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <LifeBuoy className="w-3.5 h-3.5 text-[#56C8D8]" />
          <span>My Support Ticket History ({tickets.length})</span>
        </h3>

        <div className="flex items-center gap-1.5 rounded-2xl bg-gray-100/80 p-1 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === "ALL"
                ? "bg-white text-gray-900 shadow-2xs"
                : "text-gray-500 hover:text-gray-900",
            )}
          >
            All ({tickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("OPEN")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === "OPEN"
                ? "bg-white text-amber-600 shadow-2xs"
                : "text-gray-500 hover:text-gray-900",
            )}
          >
            Active &amp; Open
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("RESOLVED")}
            className={cn(
              "px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer",
              activeTab === "RESOLVED"
                ? "bg-white text-emerald-600 shadow-2xs"
                : "text-gray-500 hover:text-gray-900",
            )}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Tickets List */}
      {filteredTickets.length > 0 ? (
        <div className="space-y-3">
          {filteredTickets.map((ticket) => {
            const isExpanded = expandedId === ticket.id;
            const createdDate = new Date(ticket.createdAt).toLocaleDateString(
              "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            );

            return (
              <div
                key={ticket.id}
                className="rounded-2xl border border-gray-200/80 bg-white p-4 sm:p-5 shadow-2xs transition-all hover:border-[#56C8D8]/50"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                        #{ticket.code}
                      </span>
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                      {getChannelBadge(ticket.channel)}
                    </div>

                    <h4 className="text-sm font-bold text-gray-900 truncate">
                      {ticket.subject}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>
                        Category: <strong>{ticket.category}</strong>
                      </span>
                      <span>Created: {createdDate}</span>
                      {ticket.order && (
                        <Link
                          href={`/account/tracking?orderCode=${ticket.order.code}`}
                          className="text-[#0097a7] hover:underline font-mono font-semibold flex items-center gap-1"
                        >
                          <Package className="w-3 h-3" />
                          <span>Order #{ticket.order.code}</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(isExpanded ? null : ticket.id)}
                    className="h-8 rounded-xl text-xs font-bold text-gray-600 hover:text-gray-900 gap-1.5 self-end sm:self-auto cursor-pointer"
                  >
                    <span>{isExpanded ? "Hide Details" : "View Message"}</span>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>

                {/* Expanded Message Box */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                      Submitted Inquiry:
                    </span>
                    <div className="rounded-xl bg-[#EDF5FA]/60 border border-[#D4EEFC] p-3.5 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {ticket.message}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/50 p-8 text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
          <h4 className="text-xs font-bold text-gray-700">
            No Support Tickets Found
          </h4>
          <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
            You have not submitted any support tickets under this tab. If you
            need help, use the instant chat or create a ticket above.
          </p>
        </div>
      )}
    </div>
  );
}
