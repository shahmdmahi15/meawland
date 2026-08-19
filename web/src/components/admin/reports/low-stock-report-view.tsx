"use client";

import React, { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { LowStockReportData } from "@/schemas/admin/reports";
import { getAdminLowStocksReportAction } from "@/actions/admin/reports";
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
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  AlertTriangle,
  Search,
  X,
  Download,
  Package,
  ShieldAlert,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LowStockReportViewProps {
  initialData: LowStockReportData;
}

export function LowStockReportView({ initialData }: LowStockReportViewProps) {
  const [data, setData] = useState<LowStockReportData>(initialData);
  const [threshold, setThreshold] = useState<number>(initialData.threshold);
  const [search, setSearch] = useState("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [isPending, startTransition] = useTransition();

  const handleThresholdChange = (newThreshold: number) => {
    setThreshold(newThreshold);
    startTransition(async () => {
      const res = await getAdminLowStocksReportAction(newThreshold);
      if (res.success && res.data) {
        setData(res.data);
        setCurrentPage(1);
      } else {
        toast.error(res.message || "Failed to load low stocks report.");
      }
    });
  };

  const filteredItems = useMemo(() => {
    return data.items.filter((item) => {
      if (urgencyFilter !== "ALL" && item.urgency !== urgencyFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchSku) return false;
      }
      return true;
    });
  }, [data.items, search, urgencyFilter]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (data.items.length === 0) {
      toast.error("No low stock records to export.");
      return;
    }

    const headers = [
      "Product Code",
      "Product Name",
      "SKU",
      "Type",
      "Category",
      "Brand",
      "Current Stock",
      "Urgency Level",
      "Regular Price",
      "Sale Price",
    ];

    const rows = filteredItems.map((item) => [
      item.code,
      `"${item.name.replace(/"/g, '""')}"`,
      item.sku,
      item.isVariable ? `Variant (${item.variantLabel})` : "Simple Product",
      item.categoryName,
      item.brandName || "N/A",
      item.currentStock,
      item.urgency,
      item.regularPrice,
      item.salePrice || item.regularPrice,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `meawland_low_stocks_report_threshold_${threshold}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Low stocks report exported to CSV!");
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            <span>Low Stock &amp; Inventory Alerts</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time stock level monitoring, replenishment signals, and
            depletion warnings across all warehouse items.
          </p>
        </div>

        {/* Threshold Selector & Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex rounded-2xl bg-white border border-gray-200 p-1 shadow-2xs items-center gap-1">
            <span className="text-[11px] font-bold text-gray-400 pl-2 pr-1 uppercase">
              Threshold:
            </span>
            {([5, 10, 20, 50] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleThresholdChange(t)}
                disabled={isPending}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  threshold === t
                    ? "bg-[#56C8D8] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                &le; {t} units
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            onClick={handleExportCSV}
            className="h-10 rounded-2xl border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Items Under Threshold
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              {data.totalLowStockCount}
            </span>
            <Boxes className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-rose-50/50 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            Zero Stock (Out of Stock)
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-rose-900">
              {data.outOfStockCount}
            </span>
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Critical (1–3 Units)
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-900">
              {data.criticalStockCount}
            </span>
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="rounded-3xl border border-[#D4EEFC] bg-[#EDF5FA]/50 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-[#0097a7] uppercase tracking-wider block">
            Low Warning (4–{threshold})
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-[#56C8D8]">
              {data.warningStockCount}
            </span>
            <AlertTriangle className="w-5 h-5 text-[#56C8D8]" />
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU, or code..."
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

          <div className="sm:col-span-4">
            <Select
              value={urgencyFilter}
              onValueChange={(val) => val && setUrgencyFilter(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="Urgency Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Urgency Levels
                </SelectItem>
                <SelectItem
                  value="OUT_OF_STOCK"
                  className="text-xs text-rose-600 font-bold"
                >
                  Out of Stock (0 units)
                </SelectItem>
                <SelectItem
                  value="CRITICAL"
                  className="text-xs text-amber-600 font-bold"
                >
                  Critical (1–3 units)
                </SelectItem>
                <SelectItem
                  value="LOW"
                  className="text-xs text-yellow-600 font-medium"
                >
                  Low Stock (4+ units)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-[#EDF5FA]/80">
            <TableRow>
              <TableHead className="text-xs font-bold text-gray-700">
                Product
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                SKU / Code
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Category
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-center">
                Remaining Stock
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 w-44">
                Stock Level
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-center">
                Urgency
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isPending ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-gray-500 text-xs"
                >
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#56C8D8] mb-2" />
                  Loading inventory status...
                </TableCell>
              </TableRow>
            ) : paginatedItems.length > 0 ? (
              paginatedItems.map((item, idx) => {
                const isOutOfStock = item.currentStock <= 0;

                return (
                  <TableRow
                    key={`${item.productId}-${item.variantId || idx}`}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Product Name & Image */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                          {item.thumbnail ? (
                            <Image
                              src={item.thumbnail}
                              alt={item.name}
                              fill
                              sizes="40px"
                              className="object-cover"
                              unoptimized={item.thumbnail.startsWith("data:")}
                            />
                          ) : (
                            <Package className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[220px]">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {item.name}
                          </p>
                          {item.variantLabel && (
                            <p className="text-[10px] text-[#0097a7] font-semibold">
                              {item.variantLabel}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* SKU & Code */}
                    <TableCell className="font-mono text-xs text-gray-600">
                      <div>
                        <span className="font-bold text-gray-900">
                          {item.code}
                        </span>
                        <p className="text-[10px] text-gray-400">
                          SKU: {item.sku}
                        </p>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="text-xs text-gray-700 font-medium">
                      {item.categoryName}
                    </TableCell>

                    {/* Remaining Stock */}
                    <TableCell className="text-center font-black text-xs">
                      <span
                        className={cn(
                          isOutOfStock
                            ? "text-rose-600"
                            : item.currentStock <= 3
                              ? "text-amber-600"
                              : "text-gray-900",
                        )}
                      >
                        {item.currentStock} units
                      </span>
                    </TableCell>

                    {/* Stock Level Progress */}
                    <TableCell>
                      <div className="space-y-1">
                        <Progress
                          value={item.currentStock}
                          max={threshold}
                          className="h-2 bg-gray-100"
                          indicatorClassName={
                            isOutOfStock
                              ? "bg-rose-500"
                              : item.currentStock <= 3
                                ? "bg-amber-500"
                                : "bg-yellow-400"
                          }
                        />
                        <div className="flex justify-between text-[9px] text-gray-400 font-mono">
                          <span>{item.currentStock}</span>
                          <span>Max: {threshold}</span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Urgency Badge */}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          item.urgency === "OUT_OF_STOCK"
                            ? "border-rose-300 text-rose-700 bg-rose-50"
                            : item.urgency === "CRITICAL"
                              ? "border-amber-300 text-amber-700 bg-amber-50"
                              : "border-yellow-300 text-yellow-700 bg-yellow-50",
                        )}
                      >
                        {item.urgency.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/management/inventory/modify-stock`}
                        className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Restock</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-gray-500 text-xs"
                >
                  🎉 Great news! No inventory items currently below threshold (
                  {threshold} units).
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Showing{" "}
              {Math.min((currentPage - 1) * pageSize + 1, filteredItems.length)}
              –{Math.min(currentPage * pageSize, filteredItems.length)} of{" "}
              {filteredItems.length} items
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
