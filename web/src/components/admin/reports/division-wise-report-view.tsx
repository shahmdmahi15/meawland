"use client";

import React, { useState, useTransition } from "react";
import {
  DivisionWiseReportData,
  ReportTimeframe,
} from "@/schemas/admin/reports";
import { getAdminDivisionWiseOrderReportAction } from "@/actions/admin/reports";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  MapPin,
  Download,
  Coins,
  ShoppingBag,
  ChevronDown,
  ChevronRight,
  Loader2,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DivisionWiseReportViewProps {
  initialData: DivisionWiseReportData;
}

export function DivisionWiseReportView({
  initialData,
}: DivisionWiseReportViewProps) {
  const [data, setData] = useState<DivisionWiseReportData>(initialData);
  const [timeframe, setTimeframe] = useState<ReportTimeframe>(
    initialData.timeframe,
  );
  const [expandedDivisions, setExpandedDivisions] = useState<Set<string>>(
    new Set(["Dhaka"]),
  );
  const [isPending, startTransition] = useTransition();

  const toggleDivision = (division: string) => {
    setExpandedDivisions((prev) => {
      const next = new Set(prev);
      if (next.has(division)) {
        next.delete(division);
      } else {
        next.add(division);
      }
      return next;
    });
  };

  const handleTimeframeChange = (tf: ReportTimeframe) => {
    setTimeframe(tf);
    startTransition(async () => {
      const res = await getAdminDivisionWiseOrderReportAction(tf);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error(res.message || "Failed to load division report data.");
      }
    });
  };

  const handleExportCSV = () => {
    if (data.divisions.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    const headers = [
      "Division",
      "District",
      "Total Orders",
      "Total Revenue (BDT)",
      "Delivered Orders",
      "Cancelled Orders",
      "Average Order Value (BDT)",
    ];

    const rows: (string | number)[][] = [];

    for (const div of data.divisions) {
      rows.push([
        `[DIVISION] ${div.division}`,
        "All Districts",
        div.totalOrders,
        div.totalRevenue.toFixed(2),
        div.deliveredOrders,
        div.cancelledOrders,
        div.avgOrderValue.toFixed(2),
      ]);

      for (const dist of div.districts) {
        rows.push([
          div.division,
          dist.district,
          dist.totalOrders,
          dist.totalRevenue.toFixed(2),
          dist.deliveredOrders,
          dist.cancelledOrders,
          dist.avgOrderValue.toFixed(2),
        ]);
      }
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `meawland_division_wise_orders_${timeframe}_${new Date().toISOString().slice(0, 10)}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Division-wise orders report exported to CSV!");
  };

  const topDivision = data.divisions[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#56C8D8]" />
            <span>Division-Wise Regional Order Reports</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Aggregated performance across all 8 Bangladesh administrative
            divisions with drilldown district analytics.
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
        <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Nationwide Orders
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
            Nationwide Revenue
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
            Top Revenue Division
          </span>
          <div className="flex items-center justify-between">
            <span className="text-sm sm:text-base font-black text-gray-900 truncate">
              {topDivision ? `${topDivision.division} Division` : "N/A"}
            </span>
            <MapPin className="w-5 h-5 text-[#56C8D8] shrink-0" />
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200/80 bg-white p-4 space-y-1 shadow-2xs">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
            Admin Divisions Covered
          </span>
          <div className="flex items-center justify-between">
            <span className="text-xl sm:text-2xl font-black text-gray-900">
              8 Divisions (64 Districts)
            </span>
            <Building2 className="w-5 h-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Divisions Table */}
      <div className="rounded-3xl border border-gray-200/80 bg-white overflow-hidden shadow-2xs">
        <Table>
          <TableHeader className="bg-[#EDF5FA]/80">
            <TableRow>
              <TableHead className="text-xs font-bold text-gray-700 w-10"></TableHead>
              <TableHead className="text-xs font-bold text-gray-700">
                Division / Territory
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Orders Volume
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Revenue (BDT)
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-right">
                Avg Order Value
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 text-center">
                Fulfillment Rate
              </TableHead>
              <TableHead className="text-xs font-bold text-gray-700 w-36">
                Revenue Share
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
                  Aggregating regional metrics...
                </TableCell>
              </TableRow>
            ) : (
              data.divisions.map((div) => {
                const isExpanded = expandedDivisions.has(div.division);
                const deliveryRate =
                  div.totalOrders > 0
                    ? ((div.deliveredOrders / div.totalOrders) * 100).toFixed(0)
                    : "0";

                return (
                  <React.Fragment key={div.division}>
                    {/* Division Master Row */}
                    <TableRow
                      onClick={() => toggleDivision(div.division)}
                      className="hover:bg-[#EDF5FA]/50 cursor-pointer transition-colors font-semibold"
                    >
                      <TableCell className="text-center">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500 mx-auto" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 mx-auto" />
                        )}
                      </TableCell>

                      <TableCell className="font-bold text-xs text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">📍</span>
                          <span>{div.division} Division</span>
                          <Badge
                            variant="outline"
                            className="text-[10px] border-gray-200 text-gray-500"
                          >
                            {div.districts.length} Districts
                          </Badge>
                        </div>
                      </TableCell>

                      <TableCell className="text-right font-bold text-xs text-gray-900">
                        {div.totalOrders.toLocaleString()} orders
                      </TableCell>

                      <TableCell className="text-right font-black text-xs text-emerald-700">
                        ৳{div.totalRevenue.toLocaleString()}
                      </TableCell>

                      <TableCell className="text-right text-xs font-semibold text-gray-800">
                        ৳{div.avgOrderValue.toFixed(0)}
                      </TableCell>

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
                          {deliveryRate}% Delivered
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <Progress
                            value={div.percentageOfTotalRevenue}
                            max={100}
                            className="h-2 bg-gray-100"
                            indicatorClassName="bg-[#56C8D8]"
                          />
                          <div className="text-[10px] text-right font-mono text-gray-500">
                            {div.percentageOfTotalRevenue.toFixed(1)}%
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Expandable District Sub-Rows */}
                    {isExpanded &&
                      div.districts.map((dist) => {
                        const distDeliveryRate =
                          dist.totalOrders > 0
                            ? (
                                (dist.deliveredOrders / dist.totalOrders) *
                                100
                              ).toFixed(0)
                            : "0";

                        return (
                          <TableRow
                            key={`${div.division}-${dist.district}`}
                            className="bg-gray-50/50 hover:bg-gray-100/60 transition-colors text-xs"
                          >
                            <TableCell></TableCell>
                            <TableCell className="pl-8 text-gray-700 font-medium">
                              <span className="text-gray-400 mr-2">↳</span>
                              <span>{dist.district}</span>
                            </TableCell>

                            <TableCell className="text-right text-gray-600 font-medium">
                              {dist.totalOrders}
                            </TableCell>

                            <TableCell className="text-right font-bold text-gray-900">
                              ৳{dist.totalRevenue.toLocaleString()}
                            </TableCell>

                            <TableCell className="text-right text-gray-500">
                              ৳{dist.avgOrderValue.toFixed(0)}
                            </TableCell>

                            <TableCell className="text-center text-gray-500 text-[11px]">
                              {distDeliveryRate}% ({dist.deliveredOrders}/
                              {dist.totalOrders})
                            </TableCell>

                            <TableCell className="text-right text-gray-400 text-[10px]">
                              {div.totalRevenue > 0
                                ? (
                                    (dist.totalRevenue / div.totalRevenue) *
                                    100
                                  ).toFixed(1)
                                : "0"}
                              % of div.
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
