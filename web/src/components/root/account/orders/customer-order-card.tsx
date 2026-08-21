"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CustomerOrderSummary } from "@/schemas/root/account/orders";
import { CustomerOrderDetailModal } from "./customer-order-detail-modal";
import { CustomerOrderInvoiceModal } from "./customer-order-invoice-modal";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";
import {
  Package,
  Calendar,
  MapPin,
  ShoppingBag,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  Clock,
  Truck,
  AlertCircle,
  Loader2,
} from "lucide-react";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import { retryBkashPaymentAction } from "@/actions/bkash/retry-payment";
import { Smartphone, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomerOrderCardProps {
  order: CustomerOrderSummary;
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

export function CustomerOrderCard({ order }: CustomerOrderCardProps) {
  const { addToCart, openDrawer } = useCart();
  const [isReordering, setIsReordering] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [copiedTrx, setCopiedTrx] = useState(false);

  const handlePayWithBkash = async () => {
    setIsPaying(true);
    try {
      const res = await retryBkashPaymentAction(order.id);
      if (res.success && res.bkashURL) {
        toast.info("Redirecting to bKash Secure Gateway...");
        window.location.href = res.bkashURL;
      } else {
        toast.error(res.message || "Failed to initiate bKash payment.");
      }
    } catch {
      toast.error("Failed to connect to bKash gateway.");
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopyTrx = (trx: string) => {
    navigator.clipboard.writeText(trx);
    setCopiedTrx(true);
    toast.success("Transaction ID copied!");
    setTimeout(() => setCopiedTrx(false), 2000);
  };

  const handleReorder = async () => {
    try {
      setIsReordering(true);
      let addedCount = 0;

      for (const item of order.items) {
        if (item.productId || item.variantId || item.comboProductId) {
          const success = await addToCart(
            {
              productId: item.productId || undefined,
              variantId: item.variantId || undefined,
              comboProductId: item.comboProductId || undefined,
              quantity: item.quantity || 1,
            },
            false,
          );
          if (success) addedCount++;
        }
      }

      if (addedCount > 0) {
        toast.success(`Added ${addedCount} item(s) to your cart! 🛒`);
        openDrawer();
      } else {
        toast.error("Items from this order are currently unavailable.");
      }
    } catch (err) {
      console.error("Failed to reorder:", err);
      toast.error("Could not add items to cart. Please try again.");
    } finally {
      setIsReordering(false);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-600 bg-amber-500/10 font-bold gap-1 text-[11px]"
          >
            <Clock className="w-3 h-3" />
            ORDER PLACED
          </Badge>
        );
      case OrderStatus.IN_REVIEW:
      case OrderStatus.HOLD:
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-600 bg-blue-500/10 font-bold gap-1 text-[11px]"
          >
            <Package className="w-3 h-3" />
            PROCESSING
          </Badge>
        );
      case OrderStatus.DELIVERY_APPROVAL_PENDING:
      case OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING:
        return (
          <Badge
            variant="outline"
            className="border-purple-500/30 text-purple-600 bg-purple-500/10 font-bold gap-1 text-[11px]"
          >
            <Truck className="w-3 h-3" />
            ON THE WAY
          </Badge>
        );
      case OrderStatus.DELIVERED:
      case OrderStatus.PARTIAL_DELIVERED:
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold gap-1 text-[11px]"
          >
            <CheckCircle2 className="w-3 h-3" />
            DELIVERED
          </Badge>
        );
      case OrderStatus.CANCELLED:
      case OrderStatus.CANCELLED_APPROVAL_PENDING:
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 text-rose-600 bg-rose-500/10 font-bold gap-1 text-[11px]"
          >
            <AlertCircle className="w-3 h-3" />
            CANCELLED
          </Badge>
        );
      case OrderStatus.RETURNED:
      case OrderStatus.RETURNED_PARTIAL:
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-600 bg-gray-100 font-bold gap-1 text-[11px]"
          >
            <RotateCcw className="w-3 h-3" />
            RETURNED
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const finalCost = parseFloat(order.finalCost || "0");

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white hover:border-[#56C8D8]/50 hover:shadow-sm transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Top Header */}
      <div className="p-4 sm:p-5 bg-gray-50/70 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF5FA] text-[#0097a7] font-bold">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-gray-900">
                #{order.code}
              </span>
              {getStatusBadge(order.status)}
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-3 h-3 text-[#56C8D8]" />
              <span>
                {new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span>•</span>
              <span>{order.totalQuantity} items</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {order.paymentMethod === PaymentMethod.BKASH && (
            <Badge
              variant="outline"
              className="text-[10px] font-bold border-[#fbcfe8] text-[#9d174d] bg-[#fdf2f8] gap-1"
            >
              <Smartphone className="w-2.5 h-2.5" />
              <span>bKash</span>
            </Badge>
          )}

          {order.payment?.trxID && (
            <button
              type="button"
              onClick={() => handleCopyTrx(order.payment!.trxID!)}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold cursor-pointer transition-colors"
              title="Click to copy TrxID"
            >
              <span>Trx: {order.payment.trxID}</span>
              {copiedTrx ? (
                <Check className="w-2.5 h-2.5 text-emerald-600" />
              ) : (
                <Copy className="w-2.5 h-2.5 text-gray-400" />
              )}
            </button>
          )}

          {order.shipment?.trackingCode && (
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold"
              title={`Steadfast Tracking: ${order.shipment.trackingCode}`}
            >
              <Truck className="w-2.5 h-2.5 text-emerald-600" />
              <span>Track: {order.shipment.trackingCode}</span>
            </span>
          )}

          <Badge
            variant="outline"
            className={cn(
              "text-[10px] font-bold uppercase",
              order.paymentStatus === PaymentStatus.PAID
                ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                : "border-amber-500/30 text-amber-600 bg-amber-500/10",
            )}
          >
            {order.paymentStatus}
          </Badge>
        </div>
      </div>

      {/* Line Items Preview */}
      <div className="p-4 sm:p-5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {order.items.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-2 rounded-xl bg-[#EDF5FA]/40 border border-[#D4EEFC]/60 text-xs"
            >
              <div className="relative h-11 w-11 shrink-0 rounded-lg bg-white overflow-hidden border border-gray-200 flex items-center justify-center p-1">
                {isValidImageSrc(item.image) ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="44px"
                    className="object-contain"
                    unoptimized={item.image.startsWith("data:")}
                  />
                ) : (
                  <Package className="w-5 h-5 text-gray-400" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate">{item.name}</p>
                <div className="text-[11px] text-gray-500 flex items-center justify-between mt-0.5">
                  <span>Qty: {item.quantity}</span>
                  <span className="font-bold text-gray-800">
                    ৳{parseFloat(item.finalCost).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {order.items.length > 4 && (
          <p className="text-xs text-gray-500 italic pl-1">
            + {order.items.length - 4} more item(s) in this order
          </p>
        )}
      </div>

      {/* Footer Info & Action Buttons */}
      <div className="p-4 sm:p-5 pt-3 border-t border-gray-100 bg-gray-50/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <MapPin className="w-3.5 h-3.5 text-[#56C8D8] shrink-0" />
          <span className="truncate max-w-[220px]">
            Delivery to <strong>{order.district}</strong>
          </span>
          <span className="text-gray-300">•</span>
          <span className="font-black text-sm text-gray-900">
            ৳{finalCost.toLocaleString()}
          </span>
        </div>

        {/* Action Button Row */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {order.paymentMethod === PaymentMethod.BKASH &&
            order.paymentStatus !== PaymentStatus.PAID &&
            order.status !== OrderStatus.CANCELLED && (
              <Button
                size="sm"
                onClick={handlePayWithBkash}
                disabled={isPaying}
                className="h-8.5 rounded-xl bg-[#e2136e] hover:bg-[#c2105e] text-white text-xs font-black gap-1.5 shadow-sm cursor-pointer"
              >
                {isPaying ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Smartphone className="w-3.5 h-3.5" />
                )}
                <span>Pay with bKash</span>
              </Button>
            )}

          <CustomerOrderInvoiceModal order={order} />

          <Link href={`/account/tracking?orderCode=${order.code}`}>
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 rounded-xl border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold gap-1"
            >
              <span>Track</span>
              <ExternalLink className="w-3 h-3 text-gray-400" />
            </Button>
          </Link>

          <Button
            variant="outline"
            size="sm"
            onClick={handleReorder}
            disabled={isReordering}
            className="h-8.5 rounded-xl border-[#D4EEFC] text-[#0097a7] hover:bg-[#EDF5FA] text-xs font-bold gap-1.5"
          >
            {isReordering ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShoppingBag className="w-3.5 h-3.5" />
            )}
            <span>Buy Again</span>
          </Button>

          <CustomerOrderDetailModal order={order} onReorder={handleReorder} />
        </div>
      </div>
    </div>
  );
}
