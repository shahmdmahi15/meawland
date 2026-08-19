"use client";

import React, { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TrackedOrderDetails,
  RecentOrderQuickItem,
} from "@/schemas/root/account/tracking";
import { trackOrderAction } from "@/actions/root/account/tracking";
import { TrackingMilestonesCard } from "./tracking-milestones-card";
import { TrackingOrderSummaryCard } from "./tracking-order-summary-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MapPin,
  Search,
  Truck,
  Package,
  ShoppingBag,
  Loader2,
  X,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { OrderStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface OrderTrackingViewProps {
  initialOrder: TrackedOrderDetails | null;
  recentOrders: RecentOrderQuickItem[];
  searchedQuery?: string;
}

export function OrderTrackingView({
  initialOrder,
  recentOrders,
  searchedQuery = "",
}: OrderTrackingViewProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(searchedQuery);
  const [currentOrder, setCurrentOrder] = useState<TrackedOrderDetails | null>(
    initialOrder,
  );
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e?: React.FormEvent, customCode?: string) => {
    if (e) e.preventDefault();
    const queryToTrack = (customCode || searchInput).trim();
    if (!queryToTrack) {
      toast.error("Please enter an order code to track.");
      return;
    }

    startTransition(async () => {
      const res = await trackOrderAction(queryToTrack);
      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setSearchInput(res.order.code);
        router.replace(`/account/tracking?orderCode=${res.order.code}`, {
          scroll: false,
        });
      } else {
        toast.error(res.message || "Order not found.");
      }
    });
  };

  const getRecentOrderStatusColor = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED:
      case OrderStatus.PARTIAL_DELIVERED:
        return "border-emerald-500/30 text-emerald-600 bg-emerald-500/10";
      case OrderStatus.DELIVERY_APPROVAL_PENDING:
      case OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING:
        return "border-purple-500/30 text-purple-600 bg-purple-500/10";
      case OrderStatus.IN_REVIEW:
      case OrderStatus.HOLD:
        return "border-blue-500/30 text-blue-600 bg-blue-500/10";
      default:
        return "border-amber-500/30 text-amber-600 bg-amber-500/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2.5">
            <Truck className="w-6 h-6 text-[#56C8D8]" />
            <span>Live Order Tracking</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Real-time shipping updates, courier status, and package milestone
            events.
          </p>
        </div>

        <Link href="/account/orders">
          <Button
            variant="outline"
            className="h-10 rounded-2xl border-gray-200 hover:bg-gray-50 text-gray-700 font-bold text-xs gap-2"
          >
            <Package className="w-4 h-4 text-[#56C8D8]" />
            <span>View All Orders</span>
          </Button>
        </Link>
      </div>

      {/* Interactive Search Bar & Recent Orders Pills */}
      <div className="rounded-3xl bg-[#EDF5FA]/80 border border-[#D4EEFC] p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
            Track by Order Code
          </h3>
          <form
            onSubmit={(e) => handleSearch(e)}
            className="flex flex-col sm:flex-row items-center gap-2.5"
          >
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Order Code (e.g. ORDER-2026-XXXX)..."
                className="pl-9.5 pr-8 h-11 rounded-2xl bg-white border-gray-200 text-xs font-mono focus-visible:ring-[#56C8D8]"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto h-11 px-6 rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-2 shadow-xs cursor-pointer"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              <span>Track Shipment</span>
            </Button>
          </form>
        </div>

        {/* Quick Order Selector Pills */}
        {recentOrders.length > 0 && (
          <div className="pt-2 border-t border-[#D4EEFC]/60 space-y-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
              Your Recent Orders:
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {recentOrders.map((rec) => {
                const isSelected = currentOrder?.code === rec.code;
                return (
                  <button
                    key={rec.id}
                    type="button"
                    onClick={() => handleSearch(undefined, rec.code)}
                    disabled={isPending}
                    className={cn(
                      "px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer",
                      isSelected
                        ? "bg-[#56C8D8] text-white border-[#56C8D8] shadow-xs"
                        : "bg-white text-gray-700 border-gray-200 hover:border-[#56C8D8] hover:bg-gray-50",
                    )}
                  >
                    <span className="font-mono">#{rec.code}</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] px-1 py-0 h-4 font-bold uppercase",
                        isSelected
                          ? "border-white/40 text-white bg-white/20"
                          : getRecentOrderStatusColor(rec.status),
                      )}
                    >
                      {rec.status}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Main Tracked Content View */}
      {currentOrder ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Milestones Progress (7 cols on lg) */}
          <div className="lg:col-span-7">
            <TrackingMilestonesCard order={currentOrder} />
          </div>

          {/* Right Column: Order Summary & Actions (5 cols on lg) */}
          <div className="lg:col-span-5">
            <TrackingOrderSummaryCard order={currentOrder} />
          </div>
        </div>
      ) : (
        /* Empty State: No order selected or matched */
        <div className="rounded-3xl border border-dashed border-gray-200 bg-[#EDF5FA]/40 p-8 sm:p-12 text-center flex flex-col items-center justify-center space-y-3 min-h-80">
          <div className="relative w-24 h-24 mx-auto">
            <Image
              src="/empty-cat.gif"
              alt="No order selected"
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-gray-900">
              No Active Tracking Selected
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Enter your Order Code in the box above or select one from your
              recent purchases to view real-time shipping status and delivery
              milestones.
            </p>
          </div>

          <Link href="/account/orders">
            <Button className="rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs mt-2 gap-2 shadow-sm">
              <Package className="w-4 h-4" />
              <span>Browse My Orders</span>
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
