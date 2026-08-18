"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { type OrderConfirmationDetails } from "@/actions/store/checkout";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Copy,
  Check,
  Package,
  Truck,
  Phone,
  MapPin,
  Calendar,
  Banknote,
  Smartphone,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentMethod } from "@/generated/prisma/enums";

interface OrderSuccessViewProps {
  order: OrderConfirmationDetails;
}

const isValidImageSrc = (src?: string | null): boolean => {
  if (!src) return false;
  return (
    src.startsWith("data:") ||
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("/")
  );
};

export function OrderSuccessView({ order }: OrderSuccessViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(order.code);
    setCopied(true);
    toast.success("Order code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isDhaka = order.district.toLowerCase().includes("dhaka");
  const estimatedDays = isDhaka ? "24–48 Hours" : "2–4 Business Days";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14 space-y-8">
      {/* Celebration Header */}
      <div className="text-center space-y-3 bg-gradient-to-b from-[#EDF8FD] to-white p-6 sm:p-10 rounded-3xl border border-[#D4EEFC] shadow-xs">
        <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto bg-gradient-to-tr from-emerald-400 to-[#56C8D8] rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white animate-bounce-short">
          <CheckCircle2 className="w-9 h-9 sm:w-12 sm:h-12" />
        </div>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Order Successfully Placed!</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Thank you, {order.name}! 🐾
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
            We have received your order and sent a confirmation email to{" "}
            <strong>{order.email}</strong>.
          </p>
        </div>

        {/* Order Code Badge */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <div className="px-4 py-2 rounded-2xl bg-white border border-[#D4EEFC] shadow-2xs flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500">Order Code:</span>
            <span className="text-sm sm:text-base font-black text-[#56C8D8] tracking-wider">
              {order.code}
            </span>
            <button
              type="button"
              onClick={handleCopyCode}
              className="p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Order Info & Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left: Delivery & Payment Details (5 Cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4EEFC] shadow-xs space-y-4">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Truck className="w-4 h-4 text-[#56C8D8]" />
              <span>Delivery Details</span>
            </h2>

            <div className="space-y-3 text-xs text-gray-700">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-gray-900">{order.name}</p>
                  <p className="text-gray-600">{order.address}</p>
                  <p className="font-semibold text-gray-800">
                    {order.district}, Bangladesh
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span>{order.phone}</span>
              </div>

              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span>
                  Est. Delivery: <strong>{estimatedDays}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-[#D4EEFC] shadow-xs space-y-3">
            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
              {order.paymentMethod === PaymentMethod.COD ? (
                <Banknote className="w-4 h-4 text-emerald-600" />
              ) : (
                <Smartphone className="w-4 h-4 text-[#e2136e]" />
              )}
              <span>Payment Information</span>
            </h2>

            <div className="text-xs space-y-1">
              <p className="font-bold text-gray-900">
                {order.paymentMethod === PaymentMethod.COD
                  ? "Cash on Delivery"
                  : "bKash Payment"}
              </p>
              <p className="text-gray-500">
                {order.paymentMethod === PaymentMethod.COD
                  ? "Please keep cash ready when the delivery rider arrives."
                  : "Our team will confirm your bKash payment shortly."}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Item Breakdown & Totals (7 Cols) */}
        <div className="md:col-span-7 bg-white rounded-3xl p-5 sm:p-6 border border-[#D4EEFC] shadow-xs space-y-5">
          <h2 className="text-sm font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Package className="w-4 h-4 text-[#56C8D8]" />
            <span>Ordered Items ({order.totalQuantity} items)</span>
          </h2>

          <div className="space-y-3 divide-y divide-gray-100">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="pt-3 first:pt-0 flex items-center gap-3"
              >
                <div className="relative w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 shrink-0 p-1 overflow-hidden flex items-center justify-center">
                  {isValidImageSrc(item.image) ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-contain p-1"
                      unoptimized={item.image.startsWith("data:")}
                    />
                  ) : (
                    <Package className="w-6 h-6 text-gray-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {item.name}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Qty: {item.quantity} × ৳
                    {parseFloat(item.unitPrice || "0").toLocaleString()}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-black text-gray-900">
                    ৳{parseFloat(item.finalCost || "0").toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div className="pt-4 border-t border-gray-100 space-y-2 text-xs font-medium text-gray-600">
            <div className="flex justify-between">
              <span>Original Subtotal</span>
              <span className="font-bold text-gray-900">
                ৳{parseFloat(order.totalPrice || "0").toLocaleString()}
              </span>
            </div>

            {parseFloat(order.discountCost || "0") > 0 && (
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Total Discount</span>
                <span>-৳{parseFloat(order.discountCost).toLocaleString()}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[#D4EEFC] flex justify-between items-baseline text-sm font-black text-gray-900">
              <span>Total Paid / Payable</span>
              <span className="text-xl font-black text-[#56C8D8]">
                ৳{parseFloat(order.finalCost || "0").toLocaleString()}
              </span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
            <Link href="/products" className="w-full">
              <Button className="w-full h-12 rounded-2xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-black text-xs sm:text-sm shadow-md gap-2 cursor-pointer transition-all hover:scale-[1.01]">
                <ShoppingBag className="w-4 h-4" />
                <span>Continue Shopping</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
