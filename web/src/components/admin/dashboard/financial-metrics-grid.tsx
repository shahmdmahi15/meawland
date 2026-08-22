"use client";

import React from "react";
import {
  DashboardFinancialMetrics,
  DashboardInventoryMetrics,
} from "@/actions/admin/dashboard/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  DollarSign,
  Package,
  ShoppingBag,
  CreditCard,
  Banknote,
  Percent,
  Clock,
  ArrowUpRight,
} from "lucide-react";

interface FinancialMetricsGridProps {
  financials: DashboardFinancialMetrics;
  inventory: DashboardInventoryMetrics;
}

export function FinancialMetricsGrid({
  financials,
  inventory,
}: FinancialMetricsGridProps) {
  return (
    <div className="space-y-3.5">
      {/* 4 Primary Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Total Gross Revenue */}
        <Card className="rounded-3xl border-gray-200 bg-gradient-to-br from-white via-white to-[#EDF5FA] shadow-xs relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#56C8D8]/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-[#EDF5FA] text-[#0097a7]">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-600">
                  Gross Sales
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold gap-0.5"
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>+18.5%</span>
              </Badge>
            </div>

            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                ৳{financials.totalRevenue.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 font-semibold mt-1">
                From {financials.totalOrdersCount.toLocaleString()} completed
                orders
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 2. Net Gross Profit */}
        <Card className="rounded-3xl border-gray-200 bg-gradient-to-br from-white via-white to-emerald-50/40 shadow-xs relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-600">
                  Net Estimated Profit
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold"
              >
                {financials.profitMarginPct}% Margin
              </Badge>
            </div>

            <div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">
                ৳{financials.netProfit.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 font-semibold mt-1">
                Net income after COGS deduction
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 3. Inventory Valuation */}
        <Card className="rounded-3xl border-gray-200 bg-gradient-to-br from-white via-white to-blue-50/40 shadow-xs relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-blue-50 text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-600">
                  Stock Valuation
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold"
              >
                {inventory.totalUnitsInStock.toLocaleString()} Units
              </Badge>
            </div>

            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                ৳{inventory.totalInventoryValuation.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 font-semibold mt-1">
                Across {inventory.totalProducts} catalog products
              </p>
            </div>
          </CardContent>
        </Card>

        {/* 4. Average Order Value (AOV) */}
        <Card className="rounded-3xl border-gray-200 bg-gradient-to-br from-white via-white to-purple-50/40 shadow-xs relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
          <CardContent className="p-5 flex flex-col justify-between h-full space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-2xl bg-purple-50 text-purple-600">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-gray-600">
                  Average Order (AOV)
                </span>
              </div>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 text-[10px] font-bold"
              >
                Basket Size
              </Badge>
            </div>

            <div>
              <p className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                ৳{financials.averageOrderValue.toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-500 font-semibold mt-1">
                Average checkout cart total
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4 Secondary Breakdown Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Today's Intake */}
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
              Today&apos;s Orders
            </span>
            <span className="text-base sm:text-lg font-black text-gray-900">
              ৳{financials.todayRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold block">
              {financials.todayOrdersCount} today
            </span>
          </div>
          <div className="p-2 rounded-xl bg-gray-50 text-gray-500">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        {/* Cash on Delivery (COD) */}
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
              COD Volume
            </span>
            <span className="text-base sm:text-lg font-black text-gray-900">
              ৳{financials.codRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold block">
              Cash on delivery
            </span>
          </div>
          <div className="p-2 rounded-xl bg-orange-50 text-orange-600">
            <Banknote className="w-4 h-4" />
          </div>
        </div>

        {/* Online bKash Volume */}
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
              Online Payments
            </span>
            <span className="text-base sm:text-lg font-black text-gray-900">
              ৳{financials.onlineRevenue.toLocaleString()}
            </span>
            <span className="text-[10px] text-[#e2136e] font-semibold block">
              bKash Direct
            </span>
          </div>
          <div className="p-2 rounded-xl bg-pink-50 text-[#e2136e]">
            <CreditCard className="w-4 h-4" />
          </div>
        </div>

        {/* Product Purchase Cost (COGS) */}
        <div className="p-3.5 rounded-2xl bg-white border border-gray-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-gray-400 block tracking-wider">
              Cost of Goods (COGS)
            </span>
            <span className="text-base sm:text-lg font-black text-gray-700">
              ৳{financials.totalCostOfGoods.toLocaleString()}
            </span>
            <span className="text-[10px] text-gray-500 font-semibold block">
              Supplier cost
            </span>
          </div>
          <div className="p-2 rounded-xl bg-gray-100 text-gray-600">
            <Percent className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
