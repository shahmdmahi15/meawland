"use client";

import { useState, useTransition, ReactNode, ReactElement } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  Truck,
  FileText,
  TrendingUp,
  Package,
  Eye,
} from "lucide-react";
import {
  OrderStatus,
  OrderType,
  PaymentMethod,
  PaymentStatus,
} from "@/generated/prisma/enums";
import type { AdminOrder } from "@/actions/admin/management/orders/get-orders";
import {
  updateOrderStatusAction,
  updatePaymentStatusAction,
  updateOrderItemStatusAction,
} from "@/actions/admin/management/orders/update-order";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OrderDetailModalProps {
  order: AdminOrder;
  trigger?: ReactNode;
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

export function OrderDetailModal({ order, trigger }: OrderDetailModalProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [currentPaymentStatus, setCurrentPaymentStatus] =
    useState<PaymentStatus>(order.paymentStatus);

  const handleStatusChange = (newStatus: OrderStatus) => {
    setCurrentStatus(newStatus);
    startTransition(async () => {
      const res = await updateOrderStatusAction({
        orderId: order.id,
        status: newStatus,
        syncItemsStatus: true,
      });
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
        setCurrentStatus(order.status);
      }
    });
  };

  const handlePaymentStatusChange = (newPaymentStatus: PaymentStatus) => {
    setCurrentPaymentStatus(newPaymentStatus);
    startTransition(async () => {
      const res = await updatePaymentStatusAction({
        orderId: order.id,
        paymentStatus: newPaymentStatus,
      });
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
        setCurrentPaymentStatus(order.paymentStatus);
      }
    });
  };

  const handleItemStatusChange = (
    orderItemId: string,
    newItemStatus: OrderStatus,
  ) => {
    startTransition(async () => {
      const res = await updateOrderItemStatusAction({
        orderItemId,
        status: newItemStatus,
      });
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  const totalPrice = parseFloat(order.totalPrice) || 0;
  const totalCost = parseFloat(order.totalCost) || 0;
  const discountCost = parseFloat(order.discountCost) || 0;
  const finalCost = parseFloat(order.finalCost) || 0;
  const estimatedProfit = Math.max(0, finalCost - totalCost);
  const profitMarginPct =
    finalCost > 0 ? Math.round((estimatedProfit / finalCost) * 100) : 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as ReactElement)
          ) : (
            <Button variant="ghost" size="icon-sm" title="View details">
              <Eye className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[1100px] w-[min(96vw,1100px)] max-w-full max-h-[90vh] overflow-y-auto p-0 gap-0">
        {/* Modal Header */}
        <div className="p-5 bg-muted/30 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg font-bold">
                    Order #{order.code}
                  </DialogTitle>
                  <Badge
                    variant={
                      order.type === OrderType.WEB ? "secondary" : "default"
                    }
                    className="text-[10px] h-4.5 px-1.5 font-bold"
                  >
                    {order.type === OrderType.WEB ? "WEB ORDER" : "ADMIN / POS"}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                  <Calendar className="w-3 h-3" />
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

            {/* Quick Status Changers in Header */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="w-36">
                <Select
                  value={currentStatus}
                  onValueChange={(val) => {
                    if (val) handleStatusChange(val as OrderStatus);
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-8 text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(OrderStatus).map((st) => (
                      <SelectItem key={st} value={st} className="text-xs">
                        {st.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-28">
                <Select
                  value={currentPaymentStatus}
                  onValueChange={(val) => {
                    if (val) handlePaymentStatusChange(val as PaymentStatus);
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 text-xs font-semibold",
                      currentPaymentStatus === PaymentStatus.PAID
                        ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                        : "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      value={PaymentStatus.PENDING}
                      className="text-xs text-amber-600"
                    >
                      PENDING
                    </SelectItem>
                    <SelectItem
                      value={PaymentStatus.PAID}
                      className="text-xs text-emerald-600"
                    >
                      PAID
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-6">
          {/* Customer & Shipping Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Customer Details Card */}
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <User className="w-3.5 h-3.5 text-primary" /> Customer Info
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="font-semibold text-sm text-foreground">
                  {order.name}
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{order.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <span>{order.phone}</span>
                </div>
                {order.userCode && (
                  <div className="pt-1">
                    <Badge variant="outline" className="text-[10px] h-4.5">
                      Account Code: {order.userCode}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Shipping & Payment Card */}
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Truck className="w-3.5 h-3.5 text-primary" /> Delivery &amp;
                Payment
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-primary" />
                  <span className="text-foreground">
                    {order.address}, <strong>{order.district}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground pt-1">
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Method:{" "}
                    <strong className="text-foreground">
                      {order.paymentMethod === PaymentMethod.COD
                        ? "Cash on Delivery (COD)"
                        : "bKash"}
                    </strong>
                  </span>
                </div>
                {order.note && (
                  <div className="p-2 rounded-md bg-muted/40 text-[11px] text-muted-foreground mt-2">
                    <strong>Note:</strong> {order.note}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ordered Items List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Package className="w-3.5 h-3.5 text-primary" /> Order Items (
                {order.items.length})
              </div>
              <span className="text-xs text-muted-foreground">
                Total Units: <strong>{order.totalQuantity}</strong>
              </span>
            </div>

            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card hover:bg-muted/10 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative h-12 w-12 rounded-lg bg-muted/40 overflow-hidden shrink-0 border border-border/50 flex items-center justify-center">
                      {isValidImageSrc(item.image) ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-foreground truncate">
                        {item.name}
                      </h4>
                      {item.sku && (
                        <p className="text-[11px] text-muted-foreground">
                          SKU: {item.sku}
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
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

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <div className="text-xs font-bold text-foreground">
                        ৳{parseFloat(item.finalCost).toLocaleString()}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Cost: ৳{parseFloat(item.totalCost).toLocaleString()}
                      </div>
                    </div>

                    <div className="w-28">
                      <Select
                        defaultValue={item.status}
                        onValueChange={(val) => {
                          if (val)
                            handleItemStatusChange(item.id, val as OrderStatus);
                        }}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 text-[11px] px-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(OrderStatus).map((st) => (
                            <SelectItem
                              key={st}
                              value={st}
                              className="text-[11px]"
                            >
                              {st.replace(/_/g, " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Math & Owner Profit Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Financial Analysis / Cost Breakdown */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Owner
                Financial Analytics
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Procurement / Owner Cost:
                  </span>
                  <span className="font-semibold text-foreground">
                    ৳{totalCost.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Customer Charged Total:
                  </span>
                  <span className="font-semibold text-foreground">
                    ৳{finalCost.toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Estimated Net Profit:</span>
                  <span>
                    ৳{estimatedProfit.toLocaleString()} ({profitMarginPct}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Bill / Summary */}
            <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <FileText className="w-3.5 h-3.5 text-primary" /> Invoice
                Summary
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Items Subtotal:</span>
                  <span className="text-foreground">
                    ৳{totalPrice.toLocaleString()}
                  </span>
                </div>
                {discountCost > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                    <span>Total Discounts:</span>
                    <span>-৳{discountCost.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Fee:</span>
                  <span className="text-foreground">
                    ৳
                    {Math.max(
                      0,
                      finalCost - (totalPrice - discountCost),
                    ).toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-bold text-foreground pt-1">
                  <span>Grand Total:</span>
                  <span className="text-primary text-base">
                    ৳{finalCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
