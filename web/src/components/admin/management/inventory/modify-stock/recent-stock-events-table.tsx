"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Package,
  Boxes,
  Truck,
  RotateCcw,
  AlertTriangle,
  Flame,
  SearchX,
  SlidersHorizontal,
  Bookmark,
  Calendar,
  RefreshCw,
  Hash,
  ArrowRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StockEventType } from "@/generated/prisma/enums";
import type { StockEventAuditRow } from "@/actions/admin/management/inventory/modify-stock";
import { formatDate } from "@/lib/utils";

interface RecentStockEventsTableProps {
  events: StockEventAuditRow[];
  onRefresh: () => void;
  isLoading?: boolean;
}

export function RecentStockEventsTable({
  events,
  onRefresh,
  isLoading,
}: RecentStockEventsTableProps) {
  const [filterType, setFilterType] = useState<string>("ALL");

  const filteredEvents = events.filter((e) => {
    if (filterType === "ALL") return true;
    return e.type === filterType;
  });

  const getEventTypeBadge = (type: StockEventType) => {
    switch (type) {
      case StockEventType.PURCHASE:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold"
          >
            <Truck className="h-3 w-3" /> Purchase (+ Inward)
          </Badge>
        );
      case StockEventType.RETURN:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-teal-500/40 bg-teal-500/10 text-teal-600 dark:text-teal-400 text-[11px] font-semibold"
          >
            <RotateCcw className="h-3 w-3" /> Customer Return
          </Badge>
        );
      case StockEventType.RESTOCK:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-cyan-500/40 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[11px] font-semibold"
          >
            <Boxes className="h-3 w-3" /> Restock
          </Badge>
        );
      case StockEventType.DAMAGE:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[11px] font-semibold"
          >
            <Flame className="h-3 w-3" /> Damaged (- Outward)
          </Badge>
        );
      case StockEventType.EXPIRED:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-semibold"
          >
            <AlertTriangle className="h-3 w-3" /> Expired (- Outward)
          </Badge>
        );
      case StockEventType.LOSS:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400 text-[11px] font-semibold"
          >
            <SearchX className="h-3 w-3" /> Lost / Theft
          </Badge>
        );
      case StockEventType.ADJUSTMENT:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-semibold"
          >
            <SlidersHorizontal className="h-3 w-3" /> Audit Adjustment
          </Badge>
        );
      case StockEventType.INITIAL:
      default:
        return (
          <Badge
            variant="outline"
            className="gap-1 border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-semibold"
          >
            <Bookmark className="h-3 w-3" /> Initial Entry
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Bookmark className="h-4 w-4 text-primary" /> Stock Audit &amp;
            Activity Log
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete transaction record of inward purchases, returns,
            write-offs, and manual adjustments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={filterType}
            onValueChange={(val) => setFilterType(val || "ALL")}
          >
            <SelectTrigger className="h-8 text-xs w-[160px]">
              <SelectValue placeholder="All Operations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Operations</SelectItem>
              <SelectItem value={StockEventType.PURCHASE}>Purchases</SelectItem>
              <SelectItem value={StockEventType.RETURN}>Returns</SelectItem>
              <SelectItem value={StockEventType.RESTOCK}>Restocks</SelectItem>
              <SelectItem value={StockEventType.DAMAGE}>
                Damaged Goods
              </SelectItem>
              <SelectItem value={StockEventType.EXPIRED}>
                Expired Goods
              </SelectItem>
              <SelectItem value={StockEventType.LOSS}>Lost / Theft</SelectItem>
              <SelectItem value={StockEventType.ADJUSTMENT}>
                Audit Adjustments
              </SelectItem>
              <SelectItem value={StockEventType.INITIAL}>
                Initial Entries
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs font-semibold">
                Date &amp; Time
              </TableHead>
              <TableHead className="text-xs font-semibold">
                Product / Variant
              </TableHead>
              <TableHead className="text-xs font-semibold">
                Event Type
              </TableHead>
              <TableHead className="text-xs font-semibold text-center">
                Quantity Delta
              </TableHead>
              <TableHead className="text-xs font-semibold text-center">
                Stock Transition
              </TableHead>
              <TableHead className="text-xs font-semibold">
                Reason &amp; Notes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-32 text-center text-xs text-muted-foreground"
                >
                  No stock events recorded matching the current criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map((event) => {
                const isPositive = event.newStock >= event.previousStock;

                return (
                  <TableRow key={event.id} className="hover:bg-muted/20">
                    {/* Timestamp */}
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex flex-col">
                        <span
                          suppressHydrationWarning
                          className="font-medium text-foreground"
                        >
                          {formatDate(new Date(event.createdAt))}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          ID: {event.id.slice(0, 8)}
                        </span>
                      </div>
                    </TableCell>

                    {/* Product / Variant Info */}
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border bg-muted/30 flex items-center justify-center">
                          {event.imageBase64 ? (
                            <Image
                              src={event.imageBase64}
                              alt={event.productName}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          ) : (
                            <Package className="h-4 w-4 text-muted-foreground/60" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-xs text-foreground line-clamp-1">
                            {event.productName}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                            <span className="font-mono">
                              SKU: {event.variantSku || event.productSku}
                            </span>
                            {event.variantAttributes &&
                              event.variantAttributes.length > 0 && (
                                <span className="rounded bg-muted px-1 py-0.2 text-[9px]">
                                  {event.variantAttributes
                                    .map((a) => `${a.name}: ${a.value}`)
                                    .join(", ")}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Event Type */}
                    <TableCell>{getEventTypeBadge(event.type)}</TableCell>

                    {/* Quantity */}
                    <TableCell className="text-center font-mono text-xs font-bold">
                      <span
                        className={
                          event.type === StockEventType.PURCHASE ||
                          event.type === StockEventType.RETURN ||
                          event.type === StockEventType.RESTOCK ||
                          event.newStock > event.previousStock
                            ? "text-emerald-600 dark:text-emerald-400"
                            : event.type === StockEventType.DAMAGE ||
                                event.type === StockEventType.EXPIRED ||
                                event.type === StockEventType.LOSS ||
                                event.newStock < event.previousStock
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-blue-600 dark:text-blue-400"
                        }
                      >
                        {event.newStock > event.previousStock
                          ? `+${event.quantity}`
                          : event.newStock < event.previousStock
                            ? `-${event.quantity}`
                            : `±${event.quantity}`}
                      </span>
                    </TableCell>

                    {/* Transition */}
                    <TableCell className="text-center whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 rounded-md border bg-muted/30 px-2 py-1 font-mono text-xs">
                        <span className="text-muted-foreground">
                          {event.previousStock}
                        </span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span className="font-bold text-foreground">
                          {event.newStock}
                        </span>
                      </div>
                    </TableCell>

                    {/* Reason & Notes */}
                    <TableCell className="text-xs">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {event.reason || "Standard Adjustment"}
                        </span>
                        {event.note && (
                          <span className="text-[11px] text-muted-foreground italic line-clamp-1">
                            "{event.note}"
                          </span>
                        )}
                      </div>
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
