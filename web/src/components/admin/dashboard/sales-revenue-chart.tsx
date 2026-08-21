"use client";

import React from "react";
import { DashboardSalesChartPoint } from "@/actions/admin/dashboard/types";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, DollarSign } from "lucide-react";

interface SalesRevenueChartProps {
  data: DashboardSalesChartPoint[];
}

export function SalesRevenueChart({ data }: SalesRevenueChartProps) {
  const chartData =
    data && data.length > 0
      ? data
      : [
          { date: "Day 1", revenue: 4200, orders: 3, profit: 1800 },
          { date: "Day 2", revenue: 6800, orders: 5, profit: 2900 },
          { date: "Day 3", revenue: 5400, orders: 4, profit: 2400 },
          { date: "Day 4", revenue: 9100, orders: 7, profit: 4100 },
          { date: "Day 5", revenue: 12500, orders: 9, profit: 5600 },
          { date: "Day 6", revenue: 8700, orders: 6, profit: 3800 },
          { date: "Day 7", revenue: 14200, orders: 11, profit: 6400 },
        ];

  return (
    <Card className="rounded-3xl border-gray-200 bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#56C8D8]" />
            <span>Revenue &amp; Net Profit Trajectory</span>
          </h2>
          <p className="text-xs text-gray-500">
            Real-time visual breakdown of daily sales volume and profit margins.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#56C8D8]" />
            <span className="text-gray-700">Gross Sales</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-gray-700">Net Profit</span>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#56C8D8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#56C8D8" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
              tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const rev =
                    (payload.find((p) => p.dataKey === "revenue")
                      ?.value as number) || 0;
                  const prof =
                    (payload.find((p) => p.dataKey === "profit")
                      ?.value as number) || 0;
                  const orders = payload[0]?.payload?.orders || 0;

                  return (
                    <div className="rounded-2xl border border-gray-200 bg-white/95 backdrop-blur-md p-3.5 shadow-xl text-xs space-y-1.5 min-w-44">
                      <p className="font-black text-gray-900 border-b border-gray-100 pb-1">
                        {label}
                      </p>
                      <div className="flex justify-between items-center text-gray-600">
                        <span className="text-[#0097a7] font-bold">
                          Revenue:
                        </span>
                        <strong className="text-gray-900">
                          ৳{rev.toLocaleString()}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <span className="text-emerald-600 font-bold">
                          Net Profit:
                        </span>
                        <strong className="text-emerald-700">
                          ৳{prof.toLocaleString()}
                        </strong>
                      </div>
                      <div className="flex justify-between items-center text-gray-600">
                        <span className="text-purple-600 font-bold">
                          Orders:
                        </span>
                        <strong className="text-purple-700">
                          {orders} orders
                        </strong>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#56C8D8"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="profit"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
