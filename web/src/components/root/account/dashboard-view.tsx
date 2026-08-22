"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CustomerDashboardData } from "@/actions/root/account/dashboard";
import { OrderStatus } from "@/generated/prisma/enums";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Truck,
  CheckCircle2,
  MapPin,
  Headphones,
  Settings,
  Copy,
  Check,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface CustomerDashboardViewProps {
  data: CustomerDashboardData;
}

const ORDER_STEPS = [
  { key: "PLACED", label: "Placed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Dispatched" },
  { key: "DELIVERED", label: "Delivered" },
];

function getActiveStepIndex(status: OrderStatus): number {
  switch (status) {
    case OrderStatus.IN_REVIEW:
      return 0;
    case OrderStatus.PENDING:
      return 1;
    case OrderStatus.DELIVERY_APPROVAL_PENDING:
    case OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING:
      return 2;
    case OrderStatus.HOLD:
    case OrderStatus.UNKNOWN_APPROVAL_PENDING:
      return 3;
    case OrderStatus.DELIVERED:
    case OrderStatus.PARTIAL_DELIVERED:
      return 4;
    default:
      return 0;
  }
}

export function CustomerDashboardView({ data }: CustomerDashboardViewProps) {
  const { user, stats, activeOrder, recentOrders, supportTickets } = data;
  const [copiedCoupon, setCopiedCoupon] = useState(false);

  const handleCopyCoupon = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCoupon(true);
    toast.success(`Coupon "${code}" copied to clipboard!`);
    setTimeout(() => setCopiedCoupon(false), 2000);
  };

  const activeStepIdx = activeOrder
    ? getActiveStepIndex(activeOrder.status)
    : 0;

  return (
    <div className="space-y-6">
      {/* 1. Welcome Greeting Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-[#EDF5FA] via-[#EDF5FA]/80 to-[#dff3f7] border border-[#D4EEFC] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              Welcome back, {user.name || "Pet Parent"}! 🐾
            </h1>
            <Badge
              variant="outline"
              className="bg-white text-[#0097a7] border-[#56C8D8] text-[10px] font-bold"
            >
              VIP Member
            </Badge>
          </div>
          <p className="text-xs text-gray-600">
            Track your furry friend&apos;s deliveries, view receipts, and manage
            your pet care account.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 z-10">
          <Link href="/account/tracking">
            <Button
              size="sm"
              className="h-9 text-xs font-bold gap-1.5 rounded-xl bg-[#0097a7] hover:bg-[#00838f] text-white shadow-xs cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Track Orders</span>
            </Button>
          </Link>
          <Link href="/account/settings">
            <Button
              size="sm"
              variant="outline"
              className="h-9 text-xs font-bold gap-1.5 rounded-xl bg-white border-gray-200 text-gray-700 hover:bg-gray-50 shadow-2xs cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5 text-gray-500" />
              <span>Profile Settings</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Key Statistics Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Total Orders */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-gray-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Orders
            </span>
            <div className="p-1.5 rounded-xl bg-gray-50 text-gray-700">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            {stats.totalOrders}
          </p>
          <span className="text-[10px] text-gray-400 font-semibold block">
            All-time purchases
          </span>
        </div>

        {/* In-Transit Active Orders */}
        <div className="p-4 rounded-2xl bg-[#EDF5FA] border border-[#D4EEFC] shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-[#0097a7]">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              In Progress
            </span>
            <div className="p-1.5 rounded-xl bg-white text-[#0097a7] shadow-2xs">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#0097a7]">
            {stats.inProgressOrders}
          </p>
          <span className="text-[10px] text-[#0097a7] font-bold block">
            Active deliveries
          </span>
        </div>

        {/* Delivered Orders */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Delivered
            </span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600">
            {stats.deliveredOrders}
          </p>
          <span className="text-[10px] text-emerald-700 font-bold block">
            Successfully received
          </span>
        </div>

        {/* Total Spent */}
        <div className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-purple-600">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Total Spent
            </span>
            <div className="p-1.5 rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900">
            ৳{stats.totalSpent.toLocaleString()}
          </p>
          <span className="text-[10px] text-purple-700 font-bold block">
            Pet care investment
          </span>
        </div>
      </div>

      {/* 3. Live Active Order Tracker Card (if active) */}
      {activeOrder && (
        <Card className="rounded-3xl border-[#56C8D8] bg-white p-5 sm:p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-[#EDF5FA] text-[#0097a7]">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">
                    Active Order
                  </span>
                  <Link
                    href={`/account/orders`}
                    className="font-mono font-black text-sm text-gray-900 hover:text-primary hover:underline"
                  >
                    #{activeOrder.code}
                  </Link>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold bg-amber-50 text-amber-800 border-amber-200"
                  >
                    {activeOrder.status}
                  </Badge>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Placed on{" "}
                  {new Date(activeOrder.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}{" "}
                  • {activeOrder.totalQuantity} items • Total:{" "}
                  <strong>৳{activeOrder.finalCost.toLocaleString()}</strong>
                </p>
              </div>
            </div>

            <Link href={`/account/tracking?orderCode=${activeOrder.code}`}>
              <Button
                size="sm"
                className="h-8 text-xs font-bold gap-1.5 rounded-xl bg-[#0097a7] hover:bg-[#00838f] text-white cursor-pointer shadow-xs"
              >
                <span>Live Package Tracker</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {/* Stepper Progress Visual */}
          <div className="py-2">
            <div className="grid grid-cols-5 gap-2">
              {ORDER_STEPS.map((step, idx) => {
                const isPassed = idx <= activeStepIdx;
                const isCurrent = idx === activeStepIdx;

                return (
                  <div
                    key={step.key}
                    className="flex flex-col items-center text-center space-y-1.5"
                  >
                    <div
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                        isCurrent
                          ? "bg-[#0097a7] text-white ring-4 ring-[#56C8D8]/20 shadow-xs"
                          : isPassed
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isPassed ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] font-bold leading-tight ${
                        isCurrent
                          ? "text-[#0097a7]"
                          : isPassed
                            ? "text-gray-800"
                            : "text-gray-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Progress bar background line */}
            <div className="h-1.5 w-full bg-gray-100 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-[#0097a7] rounded-full transition-all duration-500"
                style={{
                  width: `${(activeStepIdx / (ORDER_STEPS.length - 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Courier Consignment Info Pill */}
          {activeOrder.trackingCode && (
            <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-700">
                  Courier Partner:
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold bg-white"
                >
                  {activeOrder.courierName}
                </Badge>
                <span className="text-gray-500 font-mono">
                  Tracking Code: <strong>{activeOrder.trackingCode}</strong>
                </span>
              </div>
              <span className="text-[11px] text-gray-500">
                Delivery to: {activeOrder.district}
              </span>
            </div>
          )}
        </Card>
      )}

      {/* 4. Recent Orders & Account Shortcuts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent Orders (Left 2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#56C8D8]" />
              <span>Recent Orders</span>
            </h2>
            <Link
              href="/account/orders"
              className="text-xs font-bold text-[#0097a7] hover:underline flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 rounded-3xl border border-gray-200 bg-white text-center text-xs text-gray-500 space-y-2">
              <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="font-bold text-gray-700">No orders placed yet</p>
              <p className="text-[11px] text-gray-400">
                Explore our catalog of premium pet food, treats, and toys.
              </p>
              <Link href="/products">
                <Button
                  size="sm"
                  className="mt-2 text-xs font-bold rounded-xl bg-[#0097a7] hover:bg-[#00838f] text-white"
                >
                  Start Shopping 🛍️
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {recentOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200 shadow-2xs hover:border-[#56C8D8] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/account/orders`}
                        className="font-mono font-black text-xs text-gray-900 hover:text-primary hover:underline"
                      >
                        #{ord.code}
                      </Link>
                      <Badge
                        variant="outline"
                        className={`text-[9px] font-bold ${
                          ord.status === OrderStatus.DELIVERED
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : ord.status === OrderStatus.CANCELLED
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-[#EDF5FA] text-[#0097a7] border-[#D4EEFC]"
                        }`}
                      >
                        {ord.status}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 truncate max-w-sm">
                      {ord.itemPreviewNames.join(", ")}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(ord.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      • {ord.paymentMethod} ({ord.paymentStatus})
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <span className="text-sm font-black text-gray-900">
                      ৳{ord.finalCost.toLocaleString()}
                    </span>
                    <Link href={`/account/orders`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs font-bold rounded-lg border-gray-200 hover:bg-gray-50 text-gray-700 cursor-pointer"
                      >
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Address & Voucher & Support Widget */}
        <div className="space-y-4">
          {/* Default Delivery Address Card */}
          <div className="p-4 rounded-3xl bg-white border border-gray-200 shadow-2xs space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-gray-900 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#56C8D8]" /> Delivery Info
              </span>
              <Link
                href="/account/settings"
                className="text-[11px] font-bold text-[#0097a7] hover:underline"
              >
                Edit
              </Link>
            </div>
            <div className="p-3 rounded-2xl bg-gray-50 text-gray-700 space-y-1">
              <p className="font-bold text-gray-900">
                {user.name || "Customer"}
              </p>
              <p className="text-gray-600 text-[11px]">
                {user.address || "No street address saved"}
              </p>
              <p className="text-gray-600 text-[11px]">
                {user.district
                  ? `${user.district}, Bangladesh`
                  : "District not selected"}
              </p>
              <p className="text-gray-500 font-mono text-[11px]">
                {user.phone || "No phone number"}
              </p>
            </div>
          </div>

          {/* Special VIP Voucher Banner */}
          <div className="p-4 rounded-3xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xs space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-100">
                Special Reward
              </span>
              <Sparkles className="w-4 h-4 text-amber-200" />
            </div>
            <div>
              <p className="text-sm font-black">10% OFF Your Next Order</p>
              <p className="text-[11px] text-amber-100 mt-0.5">
                Use promo code at checkout for your furry friend!
              </p>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/15 backdrop-blur-xs mt-2">
              <code className="font-mono font-black text-sm tracking-wider">
                WELCOME10
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopyCoupon("WELCOME10")}
                className="h-7 text-xs font-bold text-white hover:bg-white/20 cursor-pointer gap-1 px-2"
              >
                {copiedCoupon ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Support Inquiries Shortcut */}
          <div className="p-4 rounded-3xl bg-white border border-gray-200 shadow-2xs space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-gray-900 flex items-center gap-1.5">
                <Headphones className="w-3.5 h-3.5 text-[#56C8D8]" /> Support
                Desk
              </span>
              <Link
                href="/account/support"
                className="text-[11px] font-bold text-[#0097a7] hover:underline"
              >
                Open Ticket
              </Link>
            </div>
            <p className="text-[11px] text-gray-500">
              Need assistance with an order or product inquiry? Our pet care
              specialists are ready 24/7.
            </p>
            {stats.openTicketsCount > 0 && (
              <Badge
                variant="outline"
                className="text-[10px] font-bold bg-amber-50 text-amber-800 border-amber-200"
              >
                {stats.openTicketsCount} Active Support Ticket(s)
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
