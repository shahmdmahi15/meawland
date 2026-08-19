"use client";

import React, { useState, useMemo, useTransition } from "react";
import {
  DistrictWiseReportData,
  ReportTimeframe,
} from "@/schemas/admin/reports";
import { getAdminDistrictWiseOrderReportAction } from "@/actions/admin/reports";
import { BANGLADESH_DIVISIONS } from "@/lib/bangladesh-districts";
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
  MapPin,
  Search,
  X,
  Download,
  Coins,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Trophy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DistrictWiseReportViewProps {
  initialData: DistrictWiseReportData;
}

export function DistrictWiseReportView({
  initialData,
}: DistrictWiseReportViewProps) {
  const [data, setData] = useState<DistrictWiseReportData>(initialData);
  const [timeframe, setTimeframe] = useState<ReportTimeframe>(
    initialData.timeframe,
  );
  const [division, setDivision] = useState<string>(
    initialData.selectedDivision || "ALL",
  );
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(16);
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (newTf: ReportTimeframe, newDiv: string) => {
    setTimeframe(newTf);
    setDivision(newDiv);
    startTransition(async () => {
      const res = await getAdminDistrictWiseOrderReportAction(newTf, newDiv);
      if (res.success && res.data) {
        setData(res.data);
        setCurrentPage(1);
      } else {
        toast.error(res.message || "Failed to load district report data.");
      }
    });
  };

  const filteredDistricts = useMemo(() => {
    return data.districts.filter((dist) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!dist.district.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data.districts, search]);

  const totalPages = Math.ceil(filteredDistricts.length / pageSize) || 1;
  const paginatedDistricts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredDistricts.slice(start, start + pageSize);
  }, [filteredDistricts, currentPage, pageSize]);

  const handleExportCSV = () => {
    if (data.districts.length === 0) {
      toast.error("No district records to export.");
      return;
    }

    const headers = [
      "District",
      "Division",
      "Total Orders",
      "Total Revenue (BDT)",
      "Delivered Orders",
      "Cancelled Orders",
      "Average Order Value (BDT)",
    ];

    const rows = filteredDistricts.map((d) => [
      d.district,
      d.division,
      d.totalOrders,
      d.totalRevenue.toFixed(2),
      d.deliveredOrders,
      d.cancelledOrders,
      d.avgOrderValue.toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `meawland_district_wise_orders_${timeframe}_${division}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("District-wise orders report exported to CSV!");
  };

  const topDistrict = data.districts[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <MapPin className="w-6 h-6 text-[#0097a7]" />
            <span>District-Wise Order Performance</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Granular sales distribution, customer demand, and fulfillment
            success across Bangladesh&apos;s 64 districts.
          </p>
        </div>

        {/* Timeframe Selector & Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex rounded-2xl bg-white border border-gray-200 p-1 shadow-2xs">
            {(["7d", "30d", "90d", "all"] as const).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => handleFilterChange(tf, division)}
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
        <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Filtered Orders
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              {data.totalOrders.toLocaleString()}
            </span>
            <ShoppingBag className="w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            District Revenue
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
            Rank #1 District
          </span>
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-black text-gray-900 truncate">
              {topDistrict ? topDistrict.district : "N/A"}
            </span>
            <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Active Districts
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              {data.districts.length} Districts
            </span>
            <MapPin className="w-5 h-5 text-gray-400" />
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
              placeholder="Search by district name (e.g. Gazipur, Sylhet, Bogura)..."
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
              value={division}
              onValueChange={(val) => val && handleFilterChange(timeframe, val)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/70 border-gray-200 text-xs">
                <SelectValue placeholder="Division" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="text-xs font-bold">
                  All 8 Divisions (64 Districts)
                </SelectItem>
                {BANGLADESH_DIVISIONS.map((div) => (
                  <SelectItem key={div} value={div} className="text-xs">
                    {div} Division
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Districts Table */}
      <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-[#EDF5FA]/80">
            <TableRow>
              <TableHead className="text-xs font-bold text-gray-700 w-12 text-center">
                Rank
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                District
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Division
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Orders Volume
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Total Revenue
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Avg Order Value
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-center">
                Delivery Success Rate
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
                  Loading district metrics...
                </TableCell>
              </TableRow>
            ) : paginatedDistricts.length > 0 ? (
              paginatedDistricts.map((dist, idx) => {
                const rank = (currentPage - 1) * pageSize + idx + 1;
                const deliveryRate =
                  dist.totalOrders > 0
                    ? ((dist.deliveredOrders / dist.totalOrders) * 100).toFixed(
                        0,
                      )
                    : "0";

                return (
                  <TableRow
                    key={dist.district}
                    className="hover:bg-gray-50/70 transition-colors"
                  >
                    {/* Rank */}
                    <TableCell className="text-center font-mono font-bold text-xs text-gray-400">
                      #{rank}
                    </TableCell>

                    {/* District */}
                    <TableCell className="font-bold text-xs text-gray-900">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-[#56C8D8]" />
                        <span>{dist.district}</span>
                      </div>
                    </TableCell>

                    {/* Division */}
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-[10px] border-gray-200 text-gray-600 bg-gray-50 font-medium"
                      >
                        {dist.division}
                      </Badge>
                    </TableCell>

                    {/* Orders */}
                    <TableCell className="text-right font-bold text-xs text-gray-900">
                      {dist.totalOrders.toLocaleString()} orders
                    </TableCell>

                    {/* Revenue */}
                    <TableCell className="text-right font-black text-xs text-emerald-700">
                      ৳{dist.totalRevenue.toLocaleString()}
                    </TableCell>

                    {/* Avg Order */}
                    <TableCell className="text-right text-xs font-semibold text-gray-800">
                      ৳{dist.avgOrderValue.toFixed(0)}
                    </TableCell>

                    {/* Delivery Rate */}
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-bold",
                          parseInt(deliveryRate) >= 70
                            ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                            : "border-gray-300 text-gray-600 bg-gray-50",
                        )}
                      >
                        {deliveryRate}% ({dist.deliveredOrders}/
                        {dist.totalOrders})
                      </Badge>
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
                  No order activity recorded for the selected district filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Bar */}
        {filteredDistricts.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Showing{" "}
              {Math.min(
                (currentPage - 1) * pageSize + 1,
                filteredDistricts.length,
              )}
              –{Math.min(currentPage * pageSize, filteredDistricts.length)} of{" "}
              {filteredDistricts.length} districts
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
