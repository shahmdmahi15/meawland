"use client";

import React, { useState, useTransition } from "react";
import {
  AdminOverviewDashboardData,
  DashboardTimeRange,
} from "@/actions/admin/dashboard/types";
import { getAdminOverviewDashboardDataAction } from "@/actions/admin/dashboard/data";
import { IntegrationsStatusBar } from "./integrations-status-bar";
import { FinancialMetricsGrid } from "./financial-metrics-grid";
import { SalesRevenueChart } from "./sales-revenue-chart";
import { OrdersStatusOverview } from "./orders-status-overview";
import { InventoryHealthCard } from "./inventory-health-card";
import { CustomerAnalyticsCard } from "./customer-analytics-card";
import { SystemHealthCard } from "./system-health-card";
import { QuickActionsToolbar } from "./quick-actions-toolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface AdminOverviewDashboardProps {
  initialData: AdminOverviewDashboardData;
}

export function AdminOverviewDashboard({
  initialData,
}: AdminOverviewDashboardProps) {
  const [data, setData] = useState<AdminOverviewDashboardData>(initialData);
  const [timeRange, setTimeRange] = useState<DashboardTimeRange>(
    initialData.timeRange || "month",
  );
  const [isPending, startTransition] = useTransition();

  const handleTimeRangeChange = (range: DashboardTimeRange) => {
    setTimeRange(range);
    startTransition(async () => {
      const res = await getAdminOverviewDashboardDataAction(range);
      if (res.success && res.data) {
        setData(res.data);
      } else {
        toast.error("Failed to refresh dashboard range.");
      }
    });
  };

  const handleRefresh = () => {
    startTransition(async () => {
      const res = await getAdminOverviewDashboardDataAction(timeRange);
      if (res.success && res.data) {
        setData(res.data);
        toast.success(
          "Executive dashboard updated with latest live telemetry!",
        );
      } else {
        toast.error("Failed to refresh dashboard.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EDF5FA] text-[#0097a7] border border-[#D4EEFC]">
            <LayoutDashboard className="h-7 w-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900">
                Executive Command Center
              </h1>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live Feed</span>
              </Badge>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              At-a-glance telemetry across finances, inventory, courier
              balances, SMS, emails, and server infrastructure.
            </p>
          </div>
        </div>

        {/* Time Range Selector & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl">
            {(
              [
                { label: "Today", value: "today" },
                { label: "7 Days", value: "week" },
                { label: "30 Days", value: "month" },
                { label: "All Time", value: "all" },
              ] as const
            ).map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={timeRange === opt.value ? "default" : "ghost"}
                disabled={isPending}
                onClick={() => handleTimeRangeChange(opt.value)}
                className={`h-8 text-xs font-bold rounded-xl cursor-pointer ${
                  timeRange === opt.value
                    ? "bg-white text-gray-900 shadow-xs hover:bg-white"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {opt.label}
              </Button>
            ))}
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleRefresh}
            className="h-10 text-xs font-bold gap-1.5 rounded-2xl bg-white border-gray-200 hover:bg-gray-50 text-gray-700 shadow-xs cursor-pointer px-3.5"
            title="Refresh All Dashboard Metrics"
          >
            <RefreshCw
              className={`w-4 h-4 ${isPending ? "animate-spin text-primary" : ""}`}
            />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <QuickActionsToolbar />

      {/* Live Integrations Bar */}
      <IntegrationsStatusBar
        integrations={data.integrations}
        system={data.system}
      />

      {/* Financial & Revenue Metrics Grid */}
      <FinancialMetricsGrid
        financials={data.financials}
        inventory={data.inventory}
      />

      {/* Sales Trajectory Area Chart */}
      <SalesRevenueChart data={data.salesChart} />

      {/* Orders Pipeline & Inventory Health Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <OrdersStatusOverview orders={data.orders} />
        <InventoryHealthCard inventory={data.inventory} />
      </div>

      {/* Customer Analytics & System Infrastructure Telemetry Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CustomerAnalyticsCard customers={data.customers} />
        <SystemHealthCard system={data.system} />
      </div>
    </div>
  );
}
