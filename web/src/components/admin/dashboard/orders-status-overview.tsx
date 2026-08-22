"use client";

import { DashboardOrdersBreakdown } from "@/actions/admin/dashboard/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  Package,
  Truck,
  Check,
  XCircle,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface OrdersStatusOverviewProps {
  orders: DashboardOrdersBreakdown;
}

export function OrdersStatusOverview({ orders }: OrdersStatusOverviewProps) {
  const statusItems = [
    {
      label: "In Review",
      count: orders.inReview,
      icon: Clock,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
    {
      label: "Confirmed",
      count: orders.confirmed,
      icon: Check,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      label: "Processing",
      count: orders.processing,
      icon: Package,
      color: "text-purple-600 bg-purple-50 border-purple-200",
    },
    {
      label: "In Courier",
      count: orders.shipped,
      icon: Truck,
      color: "text-orange-600 bg-orange-50 border-orange-200",
    },
    {
      label: "Delivered",
      count: orders.delivered,
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Cancelled",
      count: orders.cancelled,
      icon: XCircle,
      color: "text-rose-600 bg-rose-50 border-rose-200",
    },
  ];

  return (
    <Card className="rounded-3xl border-gray-200 bg-white p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#56C8D8]" />
            <span>Order Pipeline &amp; Fulfillment</span>
          </h2>
          <p className="text-xs text-gray-500">
            Current status across {orders.total.toLocaleString()} store orders.
          </p>
        </div>

        <Link
          href="/admin/management/orders/all-orders"
          className="text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-1"
        >
          <span>All Orders</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Status Pipeline Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {statusItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className={`p-3 rounded-2xl border ${item.color} flex flex-col justify-between space-y-1.5 transition-all`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700">
                  {item.label}
                </span>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <span className="text-lg font-black text-gray-900">
                {item.count}
              </span>
            </div>
          );
        })}
      </div>

      {/* Recent Orders List */}
      <div className="space-y-2 pt-2 border-t border-gray-100">
        <span className="text-xs font-bold text-gray-700 block">
          Recent Orders
        </span>
        <div className="space-y-2">
          {orders.recentOrders.length === 0 ? (
            <p className="text-xs text-gray-400 py-3 text-center">
              No recent orders found.
            </p>
          ) : (
            orders.recentOrders.map((ro) => (
              <div
                key={ro.id}
                className="p-2.5 rounded-2xl bg-gray-50/70 border border-gray-200/70 hover:border-[#56C8D8] transition-all flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 shrink-0">
                    <ShoppingBag className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/management/orders/all-orders/${ro.code}`}
                        className="font-mono font-bold text-gray-900 hover:text-primary hover:underline"
                      >
                        #{ro.code}
                      </Link>
                      <Badge
                        variant="outline"
                        className="text-[9px] font-bold bg-white"
                      >
                        {ro.orderStatus}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {ro.customerName} • {ro.customerPhone}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-gray-900 block">
                    ৳{ro.finalCost.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {ro.paymentMethod} ({ro.paymentStatus})
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}
