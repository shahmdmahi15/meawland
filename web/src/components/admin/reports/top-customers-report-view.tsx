"use client";

import React, { useState, useMemo, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  TopCustomersReportData,
  ReportTimeframe,
} from "@/schemas/admin/reports";
import { getAdminTopCustomersReportAction } from "@/actions/admin/reports";
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
  Search,
  X,
  Download,
  Coins,
  ShoppingBag,
  User,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Crown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopCustomersReportViewProps {
  initialData: TopCustomersReportData;
}

export function TopCustomersReportView({
  initialData,
}: TopCustomersReportViewProps) {
  const [data, setData] = useState<TopCustomersReportData>(initialData);
  const [timeframe, setTimeframe] = useState<ReportTimeframe>(
    initialData.timeframe,
  );
  const [tierFilter, setTierFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(15);
  const [isPending, startTransition] = useTransition();

  const handleTimeframeChange = (tf: ReportTimeframe) => {
    setTimeframe(tf);
    startTransition(async () => {
      const res = await getAdminTopCustomersReportAction(tf);
      if (res.success && res.data) {
        setData(res.data);
        setCurrentPage(1);
      } else {
        toast.error(res.message || "Failed to load top customers data.");
      }
    });
  };

  const filteredCustomers = useMemo(() => {
    return data.customers.filter((c) => {
      if (tierFilter !== "ALL" && c.loyaltyTier !== tierFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchName = c.name.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q) || false;
        const matchCode = c.code.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchCode)
          return false;
      }
      return true;
    });
  }, [data.customers, search, tierFilter]);

  const totalPages = Math.ceil(filteredCustomers.length / pageSize) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (data.customers.length === 0) {
      toast.error("No customer records to export.");
      return;
    }

    const headers = [
      "Rank",
      "Customer Code",
      "Name",
      "Email",
      "Phone",
      "District",
      "Division",
      "Total Orders",
      "Delivered Orders",
      "Total Spent (BDT)",
      "Average Order Value (BDT)",
      "Loyalty Tier",
      "Last Order Date",
    ];

    const rows = filteredCustomers.map((c, idx) => [
      idx + 1,
      c.code,
      `"${c.name.replace(/"/g, '""')}"`,
      c.email,
      c.phone || "N/A",
      c.district || "N/A",
      c.division || "N/A",
      c.totalOrders,
      c.deliveredOrders,
      c.totalSpent.toFixed(2),
      c.avgOrderValue.toFixed(2),
      c.loyaltyTier,
      c.lastOrderDate ? new Date(c.lastOrderDate).toISOString() : "N/A",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `meawland_top_customers_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Top customers report exported to CSV!");
  };

  const topVip = data.customers[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Crown className="w-6 h-6 text-amber-500" />
            <span>Top VIP Customer Analytics</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Customer lifetime value leaderboard, high-frequency buyers, average
            order size, and loyalty rankings.
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
        <div className="rounded-3xl border border-amber-100 bg-amber-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
            Top VIP Revenue
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-amber-900">
              ৳{data.totalTopRevenue.toLocaleString()}
            </span>
            <Coins className="w-5 h-5 text-amber-600" />
          </div>
        </div>

        <div className="rounded-3xl border border-[#D4EEFC] bg-[#EDF5FA]/50 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-[#0097a7] uppercase tracking-wider block">
            Rank #1 VIP Spender
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black text-gray-900 truncate max-w-[140px]">
              {topVip ? topVip.name : "N/A"}
            </span>
            <Crown className="w-5 h-5 text-amber-500 shrink-0" />
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Top Customers Ranked
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-emerald-900">
              {data.totalTopCustomers}
            </span>
            <Sparkles className="w-5 h-5 text-emerald-600" />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Average VIP Value
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              ৳
              {data.totalTopCustomers > 0
                ? (data.totalTopRevenue / data.totalTopCustomers).toFixed(0)
                : 0}
            </span>
            <ShoppingBag className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, email, phone, or #MEAWCUS code..."
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
              value={tierFilter}
              onValueChange={(val) => val && setTierFilter(val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="Loyalty Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs">
                  All Loyalty Tiers
                </SelectItem>
                <SelectItem
                  value="VIP PLATINUM"
                  className="text-xs text-purple-700 font-bold"
                >
                  VIP Platinum (৳25k+ or 15+ orders)
                </SelectItem>
                <SelectItem
                  value="GOLD"
                  className="text-xs text-amber-700 font-bold"
                >
                  Gold (৳10k+ or 8+ orders)
                </SelectItem>
                <SelectItem
                  value="SILVER"
                  className="text-xs text-slate-700 font-medium"
                >
                  Silver (৳4k+ or 3+ orders)
                </SelectItem>
                <SelectItem value="BRONZE" className="text-xs text-orange-800">
                  Bronze (&lt; ৳4k)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-[#EDF5FA]/80">
            <TableRow>
              <TableHead className="text-xs font-bold text-gray-700 w-12 text-center">
                Rank
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Customer
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Location
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-center">
                Tier
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Orders Volume
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Lifetime Spend
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Avg Order
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
                  colSpan={8}
                  className="text-center py-12 text-gray-500 text-xs"
                >
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#56C8D8] mb-2" />
                  Loading customer analytics...
                </TableCell>
              </TableRow>
            ) : paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((c, idx) => {
                const rank = (currentPage - 1) * pageSize + idx + 1;

                return (
                  <TableRow
                    key={c.id}
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

                    {/* Customer */}
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 rounded-full overflow-hidden bg-gray-100 border border-gray-200 shrink-0 flex items-center justify-center">
                          {c.avatar ? (
                            <Image
                              src={c.avatar}
                              alt={c.name}
                              fill
                              sizes="36px"
                              className="object-cover"
                              unoptimized={c.avatar.startsWith("data:")}
                            />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-[180px]">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {c.name}
                          </p>
                          <p className="text-[10px] text-gray-500 truncate">
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    {/* Location */}
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="text-xs font-semibold text-gray-800">
                          {c.district || "Unassigned"}
                        </p>
                        {c.division && (
                          <p className="text-[10px] text-gray-500">
                            {c.division} Div.
                          </p>
                        )}
                      </div>
                    </TableCell>

                    {/* Loyalty Tier */}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-black tracking-wider uppercase px-2 py-0.5",
                          c.loyaltyTier === "VIP PLATINUM"
                            ? "border-purple-300 text-purple-700 bg-purple-50"
                            : c.loyaltyTier === "GOLD"
                              ? "border-amber-300 text-amber-700 bg-amber-50"
                              : c.loyaltyTier === "SILVER"
                                ? "border-slate-300 text-slate-700 bg-slate-50"
                                : "border-orange-200 text-orange-800 bg-orange-50/40",
                        )}
                      >
                        {c.loyaltyTier}
                      </Badge>
                    </TableCell>

                    {/* Total Orders */}
                    <TableCell className="text-right font-bold text-xs text-gray-900">
                      {c.totalOrders} orders
                    </TableCell>

                    {/* Total Spent */}
                    <TableCell className="text-right font-black text-xs text-emerald-700">
                      ৳{c.totalSpent.toLocaleString()}
                    </TableCell>

                    {/* Avg Order */}
                    <TableCell className="text-right text-xs font-semibold text-gray-700">
                      ৳{c.avgOrderValue.toFixed(0)}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      <Link
                        href={`/admin/support-marketing/support/customers`}
                        className="text-xs font-bold text-[#0097a7] hover:underline inline-flex items-center gap-1"
                      >
                        <span>Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-gray-500 text-xs"
                >
                  No top customers found matching your criteria.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {filteredCustomers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Showing{" "}
              {Math.min(
                (currentPage - 1) * pageSize + 1,
                filteredCustomers.length,
              )}
              –{Math.min(currentPage * pageSize, filteredCustomers.length)} of{" "}
              {filteredCustomers.length} customers
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
