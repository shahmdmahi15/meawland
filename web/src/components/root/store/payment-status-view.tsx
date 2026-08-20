"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { retryBkashPaymentAction } from "@/actions/bkash/retry-payment";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  XCircle,
  Smartphone,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface PaymentStatusViewProps {
  status: string;
  orderId?: string;
  orderCode?: string;
  paymentID?: string;
  reason?: string;
}

export function PaymentStatusView({
  status,
  orderId,
  orderCode,
  reason,
}: PaymentStatusViewProps) {
  const [isPending, startTransition] = useTransition();
  const isCancelled = status === "cancelled";

  const handleRetryPayment = () => {
    const target = orderId || orderCode;
    if (!target) {
      toast.error("Order details missing. Please check your account orders.");
      return;
    }

    startTransition(async () => {
      const res = await retryBkashPaymentAction(target);
      if (res.success && res.bkashURL) {
        toast.info("Redirecting to bKash Secure Gateway...");
        window.location.href = res.bkashURL;
      } else {
        toast.error(
          res.message || "Failed to initiate payment. Please try again.",
        );
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-gray-200 shadow-sm text-center space-y-6">
        {/* Status Icon */}
        <div
          className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
            isCancelled
              ? "bg-amber-50 border-2 border-amber-200 text-amber-600"
              : "bg-rose-50 border-2 border-rose-200 text-rose-600"
          }`}
        >
          {isCancelled ? (
            <AlertTriangle className="w-10 h-10" />
          ) : (
            <XCircle className="w-10 h-10" />
          )}
        </div>

        {/* Title and Message */}
        <div className="space-y-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              isCancelled
                ? "bg-amber-100/80 text-amber-800"
                : "bg-rose-100/80 text-rose-800"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>
              {isCancelled ? "Payment Cancelled" : "Payment Incomplete"}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
            {isCancelled
              ? "bKash Payment Was Cancelled"
              : "bKash Payment Could Not Be Completed"}
          </h1>

          <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
            {isCancelled
              ? "You cancelled the payment transaction on the bKash page. Your order is saved as pending and you can complete payment anytime."
              : reason ||
                "Your bKash payment could not be processed. This might be due to insufficient wallet balance, incorrect PIN, or session timeout."}
          </p>
        </div>

        {/* Order Details Card */}
        {orderCode && (
          <div className="max-w-md mx-auto p-4 rounded-2xl bg-gray-50 border border-gray-200 text-xs text-gray-700 flex justify-between items-center">
            <span className="font-bold text-gray-500">Order Code:</span>
            <span className="font-black text-gray-900 tracking-wider text-sm">
              {orderCode}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          {(orderId || orderCode) && (
            <Button
              type="button"
              disabled={isPending}
              onClick={handleRetryPayment}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-[#e2136e] hover:bg-[#c2105e] text-white font-black text-xs sm:text-sm shadow-md gap-2 cursor-pointer transition-all hover:scale-[1.02]"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Smartphone className="w-4 h-4" />
              )}
              <span>{isPending ? "Connecting..." : "Pay Now with bKash"}</span>
            </Button>
          )}

          <Link href="/account/orders" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full h-12 px-6 rounded-2xl border-gray-300 hover:bg-gray-50 text-gray-800 font-bold text-xs sm:text-sm gap-2 cursor-pointer"
            >
              <span>View My Orders</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="pt-2">
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 text-xs text-[#56C8D8] hover:underline font-bold"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
