"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  CustomerOrderSummary,
  CustomerOrderStats,
} from "@/schemas/root/account/orders";
import { CustomerOrderCard } from "./customer-order-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Clock,
  CheckCircle2,
  Search,
  ShoppingBag,
  TrendingUp,
  X,
} from "lucide-react";
import { OrderStatus } from "@/generated/prisma/enums";

interface CustomerOrdersViewProps {
  initialOrders: CustomerOrderSummary[];
  stats: CustomerOrderStats;
}

type TabType = "ALL" | "ACTIVE" | "DELIVERED" | "CANCELLED";

export function CustomerOrdersView({
  initialOrders,
  stats,
}: CustomerOrdersViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Client-side filtering & sorting for instantaneous responsiveness
  const filteredOrders = useMemo(() => {
    let result = [...initialOrders];

    // Status Tab filter
    const activeStatuses: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.IN_REVIEW,
      OrderStatus.DELIVERY_APPROVAL_PENDING,
      OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING,
      OrderStatus.HOLD,
    ];
    const deliveredStatuses: OrderStatus[] = [
      OrderStatus.DELIVERED,
      OrderStatus.PARTIAL_DELIVERED,
    ];
    const cancelledStatuses: OrderStatus[] = [
      OrderStatus.CANCELLED,
      OrderStatus.CANCELLED_APPROVAL_PENDING,
      OrderStatus.RETURNED,
      OrderStatus.RETURNED_PARTIAL,
    ];

    if (activeTab === "ACTIVE") {
      result = result.filter((o) => activeStatuses.includes(o.status));
    } else if (activeTab === "DELIVERED") {
      result = result.filter((o) => deliveredStatuses.includes(o.status));
    } else if (activeTab === "CANCELLED") {
      result = result.filter((o) => cancelledStatuses.includes(o.status));
    }

    // Search query filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.code.toLowerCase().includes(q) ||
          o.district.toLowerCase().includes(q) ||
          o.items.some((item) => item.name.toLowerCase().includes(q)),
      );
    }

    // Sorting
    if (sortBy === "newest") {
      result.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    } else if (sortBy === "oldest") {
      result.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    } else if (sortBy === "price_high") {
      result.sort(
        (a, b) =>
          parseFloat(b.finalCost || "0") - parseFloat(a.finalCost || "0"),
      );
    } else if (sortBy === "price_low") {
      result.sort(
        (a, b) =>
          parseFloat(a.finalCost || "0") - parseFloat(b.finalCost || "0"),
      );
    }

    return result;
  }, [initialOrders, activeTab, search, sortBy]);

  const tabs: Array<{ key: TabType; label: string; count: number }> = [
    { key: "ALL", label: "All Orders", count: stats.totalOrders },
    { key: "ACTIVE", label: "Active & In Transit", count: stats.activeOrders },
    { key: "DELIVERED", label: "Delivered", count: stats.deliveredOrders },
    { key: "CANCELLED", label: "Cancelled", count: stats.cancelledOrders },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#56C8D8]" />
            <span>My Orders &amp; Purchases</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track real-time shipment status, review past purchases, download
            official invoices, and reorder essentials.
          </p>
        </div>

        <Link href="/products">
          <Button className="h-10 rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs shadow-sm gap-2">
            <ShoppingBag className="w-4 h-4" />
            <span>Shop More Pet Food &amp; Toys</span>
          </Button>
        </Link>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="rounded-2xl bg-[#EDF5FA] border border-[#D4EEFC] p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-gray-600">
            Total Orders
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-gray-900">
              {String(stats.totalOrders).padStart(2, "0")}
            </span>
            <Package className="w-4 h-4 text-[#0097a7]" />
          </div>
        </div>

        <div className="rounded-2xl bg-blue-50/70 border border-blue-100 p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-blue-700">
            In Transit
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-blue-900">
              {String(stats.activeOrders).padStart(2, "0")}
            </span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
        </div>

        <div className="rounded-2xl bg-emerald-50/70 border border-emerald-100 p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-emerald-700">
            Delivered
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-black text-emerald-900">
              {String(stats.deliveredOrders).padStart(2, "0")}
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50/70 border border-amber-100 p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-amber-700">
            Lifetime Spent
          </span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-xl sm:text-2xl font-black text-amber-900">
              ৳{Math.round(stats.totalSpent).toLocaleString()}
            </span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Tabs & Search / Filter Controls */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#56C8D8] text-white shadow-xs"
                    : "bg-[#EDF5FA]/80 hover:bg-[#EDF5FA] text-gray-600 hover:text-gray-900"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-white text-gray-500 border border-gray-200"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order code, product name, or district..."
              className="pl-9.5 pr-8 h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs focus-visible:ring-[#56C8D8]"
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

          <div className="w-full sm:w-48 shrink-0">
            <Select
              value={sortBy}
              onValueChange={(val) => {
                if (val) setSortBy(val);
              }}
            >
              <SelectTrigger className="h-10 rounded-xl bg-gray-50/80 border-gray-200 text-xs font-semibold">
                <SelectValue placeholder="Sort Orders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest" className="text-xs">
                  Newest Placed First
                </SelectItem>
                <SelectItem value="oldest" className="text-xs">
                  Oldest Placed First
                </SelectItem>
                <SelectItem value="price_high" className="text-xs">
                  Amount: High to Low
                </SelectItem>
                <SelectItem value="price_low" className="text-xs">
                  Amount: Low to High
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Orders List / Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-200 bg-[#EDF5FA]/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-72">
          <div className="relative w-20 h-20 mx-auto">
            <Image
              src="/empty-cat.gif"
              alt="No orders found"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-gray-900">
              No orders found
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {search
                ? `No orders matched your search query "${search}". Try resetting the search.`
                : activeTab !== "ALL"
                  ? `You don't have any ${activeTab.toLowerCase()} orders right now.`
                  : "You haven't placed any orders yet. Discover healthy cat food, delicious treats, and exciting toys today!"}
            </p>
          </div>
          {search ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearch("")}
              className="rounded-xl mt-2 text-xs"
            >
              Clear Search Query
            </Button>
          ) : (
            <Link href="/products">
              <Button className="rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs mt-2 gap-2 shadow-sm">
                <ShoppingBag className="w-4 h-4" />
                <span>Explore Pet Essentials</span>
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Showing <strong>{filteredOrders.length}</strong> order(s)
            </span>
          </div>

          <div className="space-y-3.5">
            {filteredOrders.map((order) => (
              <CustomerOrderCard key={order.id} order={order} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
