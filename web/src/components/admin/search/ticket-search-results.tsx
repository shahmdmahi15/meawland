"use client";

import React from "react";
import Link from "next/link";
import { AdminTicketSearchResult } from "@/schemas/admin/search";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  SupportTicketPriority,
  SupportTicketStatus,
} from "@/generated/prisma/enums";
import { LifeBuoy, ExternalLink, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketSearchResultsProps {
  tickets: AdminTicketSearchResult[];
}

export function TicketSearchResults({ tickets }: TicketSearchResultsProps) {
  if (tickets.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500">
        No support tickets found matching this search.
      </div>
    );
  }

  return (
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
              Attached Order
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Priority
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700">
              Status
            </TableHead>
            <TableHead className="text-xs font-bold text-gray-700 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((t) => (
            <TableRow key={t.id} className="hover:bg-gray-50/70">
              {/* Ticket Code */}
              <TableCell className="font-mono text-xs font-bold text-gray-900">
                #{t.code}
              </TableCell>

              {/* Customer */}
              <TableCell>
                <p className="text-xs font-bold text-gray-900">{t.userName}</p>
                <p className="text-[10px] text-gray-500 font-mono">
                  {t.userPhone || t.userEmail}
                </p>
              </TableCell>

              {/* Subject & Category */}
              <TableCell className="max-w-[200px]">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {t.subject}
                </p>
                <Badge
                  variant="outline"
                  className="text-[9px] px-1 py-0 border-gray-200 text-gray-500 font-medium"
                >
                  {t.category}
                </Badge>
              </TableCell>

              {/* Attached Order */}
              <TableCell>
                {t.orderCode ? (
                  <span className="font-mono text-xs font-bold text-gray-800 flex items-center gap-1">
                    <Package className="w-3 h-3 text-[#56C8D8]" />#{t.orderCode}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </TableCell>

              {/* Priority */}
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold",
                    t.priority === SupportTicketPriority.URGENT &&
                      "border-rose-300 text-rose-600 bg-rose-50",
                    t.priority === SupportTicketPriority.HIGH &&
                      "border-orange-300 text-orange-600 bg-orange-50",
                    t.priority === SupportTicketPriority.MEDIUM &&
                      "border-gray-300 text-gray-700 bg-gray-50",
                    t.priority === SupportTicketPriority.LOW &&
                      "border-gray-200 text-gray-500 bg-white",
                  )}
                >
                  {t.priority}
                </Badge>
              </TableCell>

              {/* Status */}
              <TableCell>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold",
                    t.status === SupportTicketStatus.OPEN &&
                      "border-amber-300 text-amber-600 bg-amber-50",
                    t.status === SupportTicketStatus.IN_PROGRESS &&
                      "border-blue-300 text-blue-600 bg-blue-50",
                    t.status === SupportTicketStatus.RESOLVED &&
                      "border-emerald-300 text-emerald-600 bg-emerald-50",
                    t.status === SupportTicketStatus.CLOSED &&
                      "border-gray-200 text-gray-600 bg-gray-50",
                  )}
                >
                  {t.status}
                </Badge>
              </TableCell>

              {/* Actions */}
              <TableCell className="text-right">
                <Link
                  href={`/admin/support-marketing/support/tickets?ticketId=${t.id}`}
                  className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1"
                >
                  <span>Resolve</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
