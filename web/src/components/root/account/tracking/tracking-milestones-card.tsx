"use client";

import React from "react";
import { TrackedOrderDetails } from "@/schemas/root/account/tracking";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  MapPin,
  Calendar,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { OrderStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface TrackingMilestonesCardProps {
  order: TrackedOrderDetails;
}

export function TrackingMilestonesCard({ order }: TrackingMilestonesCardProps) {
  const getHeaderStatusBadge = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-600 bg-amber-500/10 font-bold gap-1 text-xs"
          >
            <Clock className="w-3.5 h-3.5" />
            ORDER CONFIRMED
          </Badge>
        );
      case OrderStatus.IN_REVIEW:
      case OrderStatus.HOLD:
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-600 bg-blue-500/10 font-bold gap-1 text-xs"
          >
            <Package className="w-3.5 h-3.5" />
            PACKING &amp; QUALITY CHECK
          </Badge>
        );
      case OrderStatus.DELIVERY_APPROVAL_PENDING:
      case OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING:
        return (
          <Badge
            variant="outline"
            className="border-purple-500/30 text-purple-600 bg-purple-500/10 font-bold gap-1 text-xs animate-pulse"
          >
            <Truck className="w-3.5 h-3.5" />
            IN TRANSIT TO DESTINATION
          </Badge>
        );
      case OrderStatus.DELIVERED:
      case OrderStatus.PARTIAL_DELIVERED:
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold gap-1 text-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            DELIVERED SUCCESSFULLY
          </Badge>
        );
      case OrderStatus.CANCELLED:
      case OrderStatus.CANCELLED_APPROVAL_PENDING:
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 text-rose-600 bg-rose-500/10 font-bold gap-1 text-xs"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            ORDER CANCELLED
          </Badge>
        );
      case OrderStatus.RETURNED:
      case OrderStatus.RETURNED_PARTIAL:
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-600 bg-gray-100 font-bold gap-1 text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            RETURNED TO HUB
          </Badge>
        );
      default:
        return <Badge variant="secondary">{order.status}</Badge>;
    }
  };

  const isDelivered =
    order.status === OrderStatus.DELIVERED ||
    order.status === OrderStatus.PARTIAL_DELIVERED;
  const isCancelled =
    order.status === OrderStatus.CANCELLED ||
    order.status === OrderStatus.CANCELLED_APPROVAL_PENDING ||
    order.status === OrderStatus.RETURNED ||
    order.status === OrderStatus.RETURNED_PARTIAL;

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-5 sm:p-7 shadow-xs space-y-6">
      {/* Top Banner Card */}
      <div className="rounded-2xl bg-[#EDF5FA] border border-[#D4EEFC] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-base font-black text-gray-900">
              #{order.code}
            </span>
            {getHeaderStatusBadge()}
          </div>
          <p className="text-xs text-gray-600 flex items-center gap-1.5 pt-0.5">
            <Truck className="w-3.5 h-3.5 text-[#56C8D8]" />
            <span>Courier Partner: {order.courierPartner}</span>
          </p>
        </div>

        {!isCancelled && (
          <div className="rounded-xl bg-white p-3 border border-[#D4EEFC] sm:text-right shrink-0">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
              {isDelivered ? "Delivery Completed" : "Estimated Arrival"}
            </span>
            <span className="text-sm font-black text-[#0097a7] flex items-center gap-1.5 mt-0.5 sm:justify-end">
              <Calendar className="w-3.5 h-3.5 text-[#56C8D8]" />
              {order.estimatedDeliveryDate}
            </span>
          </div>
        )}
      </div>

      {/* Vertical Milestone Progress Timeline */}
      <div className="space-y-4 pt-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#56C8D8]" />
          <span>Tracking History &amp; Milestone Events</span>
        </h3>

        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:sm:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
          {order.milestones.map((ms, idx) => {
            const isCompleted = ms.status === "completed";
            const isInProgress = ms.status === "in_progress";
            const isCancelledStep = ms.status === "cancelled";

            return (
              <div key={`ms-${ms.key}-${idx}`} className="relative group">
                {/* Milestone Node Dot */}
                <div
                  className={cn(
                    "absolute -left-6 sm:-left-8 top-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isCompleted &&
                      "bg-[#56C8D8] border-[#56C8D8] text-white ring-4 ring-[#56C8D8]/20 shadow-xs",
                    isInProgress &&
                      "bg-white border-[#56C8D8] text-[#56C8D8] ring-4 ring-[#56C8D8]/20 animate-pulse",
                    isCancelledStep && "bg-rose-500 border-rose-500 text-white",
                    ms.status === "pending" &&
                      "bg-white border-gray-300 text-gray-300",
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCancelledStep ? (
                    <AlertCircle className="w-3.5 h-3.5" />
                  ) : (
                    <div
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isInProgress ? "bg-[#56C8D8]" : "bg-gray-300",
                      )}
                    />
                  )}
                </div>

                {/* Milestone Content */}
                <div
                  className={cn(
                    "rounded-2xl p-4 transition-all border",
                    isInProgress
                      ? "bg-[#EDF5FA]/60 border-[#D4EEFC]"
                      : isCompleted
                        ? "bg-gray-50/70 border-gray-100"
                        : isCancelledStep
                          ? "bg-rose-50/60 border-rose-100"
                          : "bg-white border-transparent opacity-60",
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4
                      className={cn(
                        "text-xs font-bold",
                        isInProgress || isCompleted
                          ? "text-gray-900"
                          : isCancelledStep
                            ? "text-rose-900"
                            : "text-gray-400",
                      )}
                    >
                      {ms.title}
                    </h4>

                    {ms.timestamp && (
                      <span className="text-[11px] font-medium text-gray-500">
                        {ms.timestamp}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {ms.description}
                  </p>

                  {ms.location && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mt-2">
                      <MapPin className="w-3 h-3 text-[#56C8D8]" />
                      <span>{ms.location}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
