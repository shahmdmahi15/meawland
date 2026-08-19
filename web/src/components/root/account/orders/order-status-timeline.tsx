"use client";

import React from "react";
import { OrderStatus } from "@/generated/prisma/enums";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  AlertCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusTimelineProps {
  status: OrderStatus;
  createdAt: Date | string;
  updatedAt?: Date | string;
}

export function OrderStatusTimeline({
  status,
  createdAt,
}: OrderStatusTimelineProps) {
  // If cancelled or returned, display contextual notification
  if (
    status === OrderStatus.CANCELLED ||
    status === OrderStatus.CANCELLED_APPROVAL_PENDING
  ) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200/80 p-4 text-rose-700">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-900">
            Order Cancelled
          </h4>
          <p className="text-xs text-rose-700/90 mt-0.5">
            This order has been cancelled. If you were charged, your refund is
            being processed according to store policy.
          </p>
        </div>
      </div>
    );
  }

  if (
    status === OrderStatus.RETURNED ||
    status === OrderStatus.RETURNED_PARTIAL
  ) {
    return (
      <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200/80 p-4 text-amber-700">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
          <RotateCcw className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
            Order Returned
          </h4>
          <p className="text-xs text-amber-700/90 mt-0.5">
            The items from this order were safely returned to our fulfillment
            hub.
          </p>
        </div>
      </div>
    );
  }

  // 4 Standard Progress Steps
  const formattedPlacedDate = new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const steps = [
    {
      key: "step-order-placed",
      label: "Order Placed",
      description: `Placed on ${formattedPlacedDate}`,
      icon: Clock,
    },
    {
      key: "step-processing",
      label: "Processing",
      description: "Packing your pet essentials",
      icon: Package,
    },
    {
      key: "step-on-the-way",
      label: "On the Way",
      description: "With courier partner",
      icon: Truck,
    },
    {
      key: "step-delivered",
      label: "Delivered",
      description: "Arrived at your doorstep",
      icon: CheckCircle2,
    },
  ];

  const getStepIndex = (st: OrderStatus): number => {
    switch (st) {
      case OrderStatus.PENDING:
        return 0;
      case OrderStatus.IN_REVIEW:
      case OrderStatus.HOLD:
        return 1;
      case OrderStatus.DELIVERY_APPROVAL_PENDING:
      case OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING:
        return 2;
      case OrderStatus.DELIVERED:
      case OrderStatus.PARTIAL_DELIVERED:
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);

  return (
    <div className="rounded-2xl bg-[#EDF5FA]/60 border border-[#D4EEFC] p-4 sm:p-5">
      <div className="relative flex items-center justify-between">
        {/* Connecting progress line */}
        <div className="absolute left-6 right-6 top-4.5 -translate-y-1/2 h-1 bg-gray-200 -z-0">
          <div
            className="h-full bg-[#56C8D8] transition-all duration-500 rounded-full"
            style={{
              width: `${(currentIndex / (steps.length - 1)) * 100}%`,
            }}
          />
        </div>

        {steps.map((step, idx) => {
          const isDone = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;

          return (
            <div
              key={step.key}
              className="relative z-10 flex flex-col items-center text-center group"
            >
              <div
                className={cn(
                  "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm",
                  isDone
                    ? "bg-[#56C8D8] border-[#56C8D8] text-white ring-4 ring-[#56C8D8]/20"
                    : "bg-white border-gray-300 text-gray-400",
                  isCurrent && "animate-pulse",
                )}
              >
                <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>

              <div className="mt-2 hidden sm:flex flex-col items-center">
                <span
                  className={cn(
                    "text-xs font-bold leading-tight",
                    isDone ? "text-gray-900" : "text-gray-400",
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-gray-500 max-w-[90px] mt-0.5 leading-tight">
                  {step.description}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile visible step summary */}
      <div className="sm:hidden mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
        <span className="text-gray-500">Current Status:</span>
        <span className="font-bold text-[#56C8D8]">
          {steps[currentIndex]?.label} — {steps[currentIndex]?.description}
        </span>
      </div>
    </div>
  );
}
