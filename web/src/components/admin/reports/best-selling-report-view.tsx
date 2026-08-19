"use client";

import React, { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  BestSellingReportData,
  ReportTimeframe,
} from "@/schemas/admin/reports";
import { getAdminBestSellingProductsReportAction } from "@/actions/admin/reports";
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
import { toast } from "sonner";
import {
  Flame,
  Search,
  X,
  Download,
  Package,
  TrendingUp,
  Coins,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BestSellingReportViewProps {
  initialData: BestSellingReportData;
}

export function BestSellingReportView({
  initialData,
}: BestSellingReportViewProps) {
  const [data, setData] = useState<BestSellingReportData>(initialData);
  const [timeframe, setTimeframe] = useState<ReportTimeframe>(
    initialData.timeframe,
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [isPending, startTransition] = useTransition();

  const handleTimeframeChange = (tf: ReportTimeframe) => {
    setTimeframe(tf);
    startTransition(async () => {
      const res = await getAdminBestSellingProductsReportAction(tf);
      if (res.success && res.data) {
        setData(res.data);
        setCurrentPage(1);
      } else {
        toast.error(res.message || "Failed to load report data.");
      }
    });
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of data.topSellingItems) {
      if (item.categoryName) set.add(item.categoryName);
    }
    return Array.from(set);
  }, [data]);

  const filteredItems = useMemo(() => {
    return data.topSellingItems.filter((item) => {
      if (categoryFilter !== "ALL" && item.categoryName !== categoryFilter) {
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
  }, [data.topSellingItems, search, categoryFilter]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (data.topSellingItems.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    const headers = [
      "Rank",
      "Product Code",
      "Product Name",
      "SKU",
      "Category",
      "Brand",
      "Units Sold",
      "Total Revenue (BDT)",
      "Current Stock",
    ];

    const rows = filteredItems.map((item, idx) => [
      idx + 1,
      item.code,
      `"${item.name.replace(/"/g, '""')}"`,
      item.sku,
      item.categoryName,
      item.brandName || "N/A",
      item.unitsSold,
      item.totalRevenue.toFixed(2),
      item.currentStock,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `meawland_best_selling_report_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Best selling products report exported to CSV!");
  };

  const topProduct = data.topSellingItems[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Flame className="w-6 h-6 text-rose-500" />
            <span>Best Selling Products Report</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time sales velocity, top performing product lines, inventory
            levels, and revenue breakdown.
          </p>
        </div>

        {/* Timeframe Selector & Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex rounded-2xl bg-white border border-gray-200 p-1 shadow-2xs">
            {(["7d", "30d", "90d", "all"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => handleTimeframeChange(tf)}
                disabled={isPending}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  timeframe === tf
                    ? "bg-[#56C8D8] text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                {tf === "7d"
                  ? "7 Days"
                  : tf === "30d"
                    ? "30 Days"
                    : tf === "90d"
                      ? "90 Days"
                      : "All Time"}
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
        <div className="rounded-3xl border border-rose-100 bg-rose-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">
            Units Dispatched
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-rose-900">
              {data.totalProductsSold.toLocaleString()}
            </span>
            <TrendingUp className="w-5 h-5 text-rose-500" />
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Sales Revenue
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-900">
              ৳{data.totalRevenue.toLocaleString()}
            </span>
            <Coins className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="rounded-3xl border border-[#D4EEFC] bg-[#EDF5FA]/50 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-[#0097a7] uppercase tracking-wider block">
            Rank #1 Best Seller
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-gray-900 truncate max-w-[140px]">
              {topProduct ? topProduct.name : "N/A"}
            </span>
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Active Catalog Items
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              {data.topSellingItems.length}
            </span>
            <Package className="w-5 h-5 text-gray-400" />
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
              value={categoryFilter}
              onValueChange={(val) => val && setCategoryFilter(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Categories ({categories.length})
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat} className="text-xs">
                    {cat}
                  </SelectItem>
                ))}
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
              <TableHead className="text-xs font-bold text-gray-700 w-12 text-center">
                Rank
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Product
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Category &amp; Brand
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Units Sold
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Total Revenue
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-center">
                Current Stock
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
                  Updating sales analytics...
                </TableCell>
              </TableRow>
            ) : paginatedItems.length > 0 ? (
              paginatedItems.map((item, idx) => {
                const rank = (currentPage - 1) * pageSize + idx + 1;
                const isOutOfStock = item.currentStock <= 0;
                const isLowStock =
                  item.currentStock > 0 && item.currentStock <= 5;

                return (
                  <TableRow
                    key={item.productId}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Rank */}
                    <TableCell className="text-center font-mono font-bold text-xs">
                      {rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-[11px] font-black shadow-2xs">
                          🥇
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-800 text-[11px] font-black shadow-2xs">
                          🥈
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 text-[11px] font-black shadow-2xs">
                          🥉
                        </span>
                      ) : (
                        <span className="text-gray-400">#{rank}</span>
                      )}
                    </TableCell>

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
                        <div className="min-w-0 max-w-[240px]">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {item.name}
                          </p>
                          <p className="text-[10px] font-mono text-gray-500">
                            {item.code} • SKU: {item.sku}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Category & Brand */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-gray-800">
                          {item.categoryName}
                        </p>
                        <p className="text-[10px] text-gray-500">
                          {item.brandName || "Generic / No Brand"}
                        </p>
                      </div>
                    </TableCell>

                    {/* Units Sold */}
                    <TableCell className="text-right font-black text-xs text-rose-600">
                      {item.unitsSold.toLocaleString()} units
                    </TableCell>

                    {/* Revenue */}
                    <TableCell className="text-right font-black text-xs text-emerald-700">
                      ৳{item.totalRevenue.toLocaleString()}
                    </TableCell>

                    {/* Stock Status */}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold",
                          isOutOfStock
                            ? "border-rose-300 text-rose-700 bg-rose-50"
                            : isLowStock
                              ? "border-amber-300 text-amber-700 bg-amber-50"
                              : "border-emerald-300 text-emerald-700 bg-emerald-50",
                        )}
                      >
                        {isOutOfStock
                          ? "Out of Stock"
                          : `${item.currentStock} in stock`}
                      </Badge>
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Link
                        href={`//admin/management/inventory/all-products`}
                        className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Manage</span>
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
                  No best selling products recorded for the selected timeframe.
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
              {filteredItems.length} products
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
