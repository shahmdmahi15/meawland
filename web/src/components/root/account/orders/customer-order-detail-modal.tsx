"use client";

import React, { ReactElement } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CustomerOrderSummary } from "@/schemas/root/account/orders";
import { OrderStatusTimeline } from "./order-status-timeline";
import { CustomerOrderInvoiceModal } from "./customer-order-invoice-modal";
import {
  Eye,
  Package,
  MapPin,
  Calendar,
  CreditCard,
  ExternalLink,
  ShoppingBag,
} from "lucide-react";
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

interface CustomerOrderDetailModalProps {
  order: CustomerOrderSummary;
  trigger?: React.ReactNode;
  onReorder?: () => void;
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

export function CustomerOrderDetailModal({
  order,
  trigger,
  onReorder,
}: CustomerOrderDetailModalProps) {
  const [open, setOpen] = React.useState(false);

  const totalPrice = parseFloat(order.totalPrice || "0");
  const discountCost = parseFloat(order.discountCost || "0");
  const finalCost = parseFloat(order.finalCost || "0");
  const shippingFee = Math.max(0, finalCost - (totalPrice - discountCost));

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-600 bg-amber-500/10 font-bold"
          >
            ORDER PLACED
          </Badge>
        );
      case OrderStatus.IN_REVIEW:
      case OrderStatus.HOLD:
        return (
          <Badge
            variant="outline"
            className="border-blue-500/30 text-blue-600 bg-blue-500/10 font-bold"
          >
            PROCESSING
          </Badge>
        );
      case OrderStatus.DELIVERY_APPROVAL_PENDING:
      case OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING:
        return (
          <Badge
            variant="outline"
            className="border-purple-500/30 text-purple-600 bg-purple-500/10 font-bold"
          >
            ON THE WAY
          </Badge>
        );
      case OrderStatus.DELIVERED:
      case OrderStatus.PARTIAL_DELIVERED:
        return (
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10 font-bold"
          >
            DELIVERED
          </Badge>
        );
      case OrderStatus.CANCELLED:
      case OrderStatus.CANCELLED_APPROVAL_PENDING:
        return (
          <Badge
            variant="outline"
            className="border-rose-500/30 text-rose-600 bg-rose-500/10 font-bold"
          >
            CANCELLED
          </Badge>
        );
      case OrderStatus.RETURNED:
      case OrderStatus.RETURNED_PARTIAL:
        return (
          <Badge
            variant="outline"
            className="border-gray-400 text-gray-600 bg-gray-100 font-bold"
          >
            RETURNED
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as ReactElement)
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="h-8.5 rounded-xl border-[#D4EEFC] text-[#0097a7] hover:bg-[#EDF5FA] text-xs font-bold gap-1.5 shadow-2xs"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Details</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[850px] w-[min(96vw,850px)] max-w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-[#EDF5FA]/80 border-b border-[#D4EEFC]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#56C8D8] text-white shadow-sm">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-black text-gray-900">
                    Order #{order.code}
                  </DialogTitle>
                  {getStatusBadge(order.status)}
                </div>
                <DialogDescription className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                  <Calendar className="w-3.5 h-3.5 text-[#56C8D8]" />
                  Placed on{" "}
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <CustomerOrderInvoiceModal order={order} />
              <Link href={`/account/tracking?orderCode=${order.code}`}>
                <Button
                  size="sm"
                  className="h-8 rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white text-xs font-bold gap-1 shadow-2xs"
                >
                  <span>Track Live</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6">
          {/* Visual Order Progress Stepper */}
          <OrderStatusTimeline
            status={order.status}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
          />

          {/* Customer & Shipping Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Delivery Destination */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <MapPin className="w-3.5 h-3.5 text-[#56C8D8]" /> Delivery
                Destination
              </div>
              <div className="text-xs space-y-1">
                <p className="font-bold text-gray-900">{order.name}</p>
                <p className="text-gray-600 leading-relaxed">
                  {order.address}, <strong>{order.district}</strong>
                </p>
                <p className="text-gray-500">Contact: {order.phone}</p>
              </div>
            </div>

            {/* Payment & Security Info */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-[#56C8D8]" /> Payment
                Information
              </div>
              <div className="text-xs space-y-1.5">
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
                {order.note && (
                  <p className="text-[11px] text-gray-500 pt-1">
                    <strong>Note:</strong> {order.note}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Ordered Line Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-700 uppercase tracking-wider">
                <Package className="w-3.5 h-3.5 text-[#56C8D8]" /> Ordered Items
                ({order.totalQuantity} items)
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative h-12 w-12 rounded-xl bg-gray-50 overflow-hidden shrink-0 border border-gray-200 flex items-center justify-center p-1">
                      {isValidImageSrc(item.image) ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="48px"
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
                      <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                        <span>
                          ৳{parseFloat(item.unitPrice).toLocaleString()} ×{" "}
                          {item.quantity}
                        </span>
                        {parseFloat(item.discountCost) > 0 && (
                          <span className="text-emerald-600 font-medium">
                            (-৳
                            {parseFloat(
                              item.discountCost,
                            ).toLocaleString()}{" "}
                            off)
                          </span>
                        )}
                      </div>
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

          {/* Pricing Calculation Breakdown */}
          <div className="rounded-2xl bg-[#EDF5FA]/50 border border-[#D4EEFC] p-4 sm:p-5 space-y-2">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Items Subtotal:</span>
              <span className="font-semibold text-gray-900">
                ৳{totalPrice.toLocaleString()}
              </span>
            </div>

            {discountCost > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-bold">
                <span>Discounts Applied:</span>
                <span>-৳{discountCost.toLocaleString()}</span>
              </div>
            )}

            <div className="flex justify-between text-xs text-gray-600">
              <span>Delivery Fee:</span>
              <span className="font-semibold text-gray-900">
                ৳{shippingFee.toLocaleString()}
              </span>
            </div>

            <Separator className="bg-[#D4EEFC]" />

            <div className="flex justify-between text-sm font-black text-gray-900 pt-1">
              <span>Grand Total:</span>
              <span className="text-base font-black text-[#56C8D8]">
                ৳{finalCost.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            className="rounded-xl text-xs"
          >
            Close
          </Button>

          {onReorder && (
            <Button
              size="sm"
              onClick={() => {
                onReorder();
                setOpen(false);
              }}
              className="rounded-xl bg-[#56C8D8] hover:bg-[#45B0BF] text-white font-bold text-xs gap-1.5 shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Buy Items Again</span>
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
