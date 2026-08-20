"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { TrackedOrderDetails } from "@/schemas/root/account/tracking";
import { CustomerOrderInvoiceModal } from "@/components/root/account/orders/customer-order-invoice-modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/cart-context";
import { toast } from "sonner";
import {
  Package,
  MapPin,
  Phone,
  CreditCard,
  ShoppingBag,
  Headphones,
  FileText,
  Loader2,
  Truck,
} from "lucide-react";
import { PaymentMethod, PaymentStatus } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface TrackingOrderSummaryCardProps {
  order: TrackedOrderDetails;
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

export function TrackingOrderSummaryCard({
  order,
}: TrackingOrderSummaryCardProps) {
  const { addToCart, openDrawer } = useCart();
  const [isReordering, setIsReordering] = useState(false);

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
      toast.error("Could not add items to cart.");
    } finally {
      setIsReordering(false);
    }
  };

  const totalPrice = parseFloat(order.totalPrice || "0");
  const discountCost = parseFloat(order.discountCost || "0");
  const finalCost = parseFloat(order.finalCost || "0");
  const shippingFee = Math.max(0, finalCost - (totalPrice - discountCost));

  return (
    <div className="rounded-3xl border border-gray-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-6">
      {/* Delivery Destination Card */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-[#56C8D8]" />
          <span>Delivery Details</span>
        </h3>

        <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-4 text-xs space-y-2">
          <p className="font-bold text-sm text-gray-900">{order.name}</p>
          <p className="text-gray-600 leading-relaxed">
            {order.address}, <strong>{order.district}</strong>
          </p>
          <p className="text-gray-500 flex items-center gap-1.5 pt-0.5">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{order.phone}</span>
          </p>
        </div>
      </div>

      {/* Payment & Method Summary */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <CreditCard className="w-3.5 h-3.5 text-[#56C8D8]" />
          <span>Payment Information</span>
        </h3>

        <div className="rounded-2xl bg-gray-50/80 border border-gray-100 p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <strong className="text-gray-900">
              {order.paymentMethod === PaymentMethod.COD
                ? "Cash on Delivery"
                : "bKash Online"}
            </strong>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Payment Status:</span>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold",
                order.paymentStatus === PaymentStatus.PAID
                  ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                  : "border-amber-500/30 text-amber-600 bg-amber-500/10",
              )}
            >
              {order.paymentStatus}
            </Badge>
          </div>
          {order.paymentMethod === PaymentMethod.BKASH && order.payment?.trxID && (
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100 font-mono text-[#9d174d]">
              <span>bKash TrxID:</span>
              <strong className="font-bold">{order.payment.trxID}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Courier Logistics Details */}
      {order.shipment && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Courier Logistics Details</span>
          </h3>

          <div className="rounded-2xl bg-emerald-50/70 border border-emerald-200/80 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Courier Partner:</span>
              <strong className="text-gray-900">Steadfast Courier</strong>
            </div>
            {order.shipment.trackingCode && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tracking Code:</span>
                <span className="font-mono font-bold text-emerald-800">
                  {order.shipment.trackingCode}
                </span>
              </div>
            )}
            {order.shipment.consignmentId && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Consignment ID:</span>
                <span className="font-mono text-gray-900">
                  #{order.shipment.consignmentId}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Courier Status:</span>
              <Badge
                variant="outline"
                className="text-[10px] uppercase font-bold bg-white text-emerald-700 border-emerald-300"
              >
                {order.shipment.rawStatus || order.shipment.status}
              </Badge>
            </div>
          </div>
        </div>
      )}

      {/* Package Contents */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
          <Package className="w-3.5 h-3.5 text-[#56C8D8]" />
          <span>Package Contents ({order.totalQuantity} items)</span>
        </h3>

        <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100 max-h-60 overflow-y-auto pr-0.5">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="p-3 flex items-center justify-between gap-3 bg-white"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="relative h-11 w-11 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center p-1">
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
                  <h4 className="text-xs font-bold text-gray-900 truncate">
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Qty: {item.quantity} × ৳
                    {parseFloat(item.unitPrice).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-black text-gray-900">
                  ৳{parseFloat(item.finalCost).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing Summary Breakdown */}
      <div className="rounded-2xl bg-[#EDF5FA]/50 border border-[#D4EEFC] p-4 space-y-2 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal:</span>
          <span className="font-semibold text-gray-900">
            ৳{totalPrice.toLocaleString()}
          </span>
        </div>

        {discountCost > 0 && (
          <div className="flex justify-between text-emerald-600 font-bold">
            <span>Savings / Discounts:</span>
            <span>-৳{discountCost.toLocaleString()}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Delivery Charge:</span>
          <span className="font-semibold text-gray-900">
            ৳{shippingFee.toLocaleString()}
          </span>
        </div>

        <Separator className="bg-[#D4EEFC]" />

        <div className="flex justify-between text-sm font-black text-gray-900 pt-1">
          <span>Total:</span>
          <span className="text-base font-black text-[#56C8D8]">
            ৳{finalCost.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center gap-2">
          <CustomerOrderInvoiceModal
            order={order}
            trigger={
              <Button
                variant="outline"
                className="flex-1 h-9 rounded-xl border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-gray-500" />
                <span>View Invoice</span>
              </Button>
            }
          />

          <Button
            onClick={handleReorder}
            disabled={isReordering}
            className="flex-1 h-9 rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-1.5 shadow-2xs"
          >
            {isReordering ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShoppingBag className="w-3.5 h-3.5" />
            )}
            <span>Buy Again</span>
          </Button>
        </div>

        <Link
          href={`/account/support?orderCode=${order.code}`}
          className="block"
        >
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-8.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 text-xs font-semibold gap-1.5"
          >
            <Headphones className="w-3.5 h-3.5 text-[#56C8D8]" />
            <span>Need Help with this Order?</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
