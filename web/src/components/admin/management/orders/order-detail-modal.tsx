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
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
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

const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string }
> = {
  [OrderStatus.IN_REVIEW]: {
    label: "In Review",
    color: "text-blue-700 bg-blue-50 border-blue-200",
  },
  [OrderStatus.PENDING]: {
    label: "Pending",
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  [OrderStatus.DELIVERY_APPROVAL_PENDING]: {
    label: "Delivery Approval Pending",
    color: "text-indigo-700 bg-indigo-50 border-indigo-200",
  },
  [OrderStatus.PARTIAL_DELIVERY_APPROVAL_PENDING]: {
    label: "Partial Delivery Approval",
    color: "text-cyan-700 bg-cyan-50 border-cyan-200",
  },
  [OrderStatus.CANCELLED_APPROVAL_PENDING]: {
    label: "Cancelled Approval",
    color: "text-rose-700 bg-rose-50 border-rose-200",
  },
  [OrderStatus.UNKNOWN_APPROVAL_PENDING]: {
    label: "Unknown Approval",
    color: "text-gray-700 bg-gray-50 border-gray-200",
  },
  [OrderStatus.RETURNED_PARTIAL]: {
    label: "Partial Returned",
    color: "text-orange-700 bg-orange-50 border-orange-200",
  },
  [OrderStatus.DELIVERED]: {
    label: "Delivered",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
  [OrderStatus.PARTIAL_DELIVERED]: {
    label: "Partial Delivered",
    color: "text-teal-700 bg-teal-50 border-teal-200",
  },
  [OrderStatus.CANCELLED]: {
    label: "Cancelled",
    color: "text-red-700 bg-red-50 border-red-200",
  },
  [OrderStatus.HOLD]: {
    label: "On Hold",
    color: "text-yellow-700 bg-yellow-50 border-yellow-200",
  },
  [OrderStatus.UNKNOWN]: {
    label: "Unknown",
    color: "text-gray-700 bg-gray-50 border-gray-200",
  },
  [OrderStatus.RETURNED]: {
    label: "Returned",
    color: "text-rose-700 bg-rose-50 border-rose-200",
  },
};

const PAYMENT_STATUS_CONFIG: Record<
  PaymentStatus,
  { label: string; color: string }
> = {
  [PaymentStatus.PENDING]: {
    label: "Pending",
    color: "text-amber-700 bg-amber-50 border-amber-200",
  },
  [PaymentStatus.PAID]: {
    label: "Paid",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
  },
};

export function OrderDetailModal({
  order,
  trigger,
  isOpen,
  onOpenChange,
}: OrderDetailModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof isOpen === "boolean";
  const open = isControlled ? isOpen : internalOpen;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!isControlled) {
      setInternalOpen(nextOpen);
    }
    onOpenChange?.(nextOpen);
  };

  const [isPending, startTransition] = useTransition();

  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order.status);
  const [currentPaymentStatus, setCurrentPaymentStatus] =
    useState<PaymentStatus>(order.paymentStatus);

  const [itemStatuses, setItemStatuses] = useState<Record<string, OrderStatus>>(
    () => {
      const init: Record<string, OrderStatus> = {};
      for (const itm of order.items) {
        init[itm.id] = itm.status;
      }
      return init;
    },
  );

  const handleStatusChange = (newStatus: OrderStatus) => {
    setCurrentStatus(newStatus);
    setItemStatuses((prev) => {
      const updated = { ...prev };
      for (const itm of order.items) {
        updated[itm.id] = newStatus;
      }
      return updated;
    });

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
    setItemStatuses((prev) => ({ ...prev, [orderItemId]: newItemStatus }));
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:pr-8">
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
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="min-w-[160px]">
                <Select
                  value={currentStatus}
                  onValueChange={(val) => {
                    if (val) handleStatusChange(val as OrderStatus);
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger className="h-8 w-full text-xs font-bold rounded-xl bg-white border-gray-200 px-3 shadow-2xs cursor-pointer">
                    <SelectValue>
                      <span
                        className={cn(
                          "font-bold text-xs",
                          ORDER_STATUS_CONFIG[currentStatus]?.color?.split(
                            " ",
                          )[0],
                        )}
                      >
                        {ORDER_STATUS_CONFIG[currentStatus]?.label ||
                          currentStatus}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className="min-w-[190px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
                  >
                    {Object.values(OrderStatus).map((st) => {
                      const cfg = ORDER_STATUS_CONFIG[st];
                      return (
                        <SelectItem
                          key={st}
                          value={st}
                          className="text-xs py-1.5 px-2 rounded-lg cursor-pointer"
                        >
                          <span
                            className={cn(
                              "font-bold",
                              cfg?.color?.split(" ")[0],
                            )}
                          >
                            {cfg?.label || st}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[110px]">
                <Select
                  value={currentPaymentStatus}
                  onValueChange={(val) => {
                    if (val) handlePaymentStatusChange(val as PaymentStatus);
                  }}
                  disabled={isPending}
                >
                  <SelectTrigger
                    className={cn(
                      "h-8 w-full text-xs font-bold rounded-xl px-3 shadow-2xs border cursor-pointer",
                      PAYMENT_STATUS_CONFIG[currentPaymentStatus]?.color,
                    )}
                  >
                    <SelectValue>
                      <span className="font-bold text-xs">
                        {PAYMENT_STATUS_CONFIG[currentPaymentStatus]?.label ||
                          currentPaymentStatus}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent
                    alignItemWithTrigger={false}
                    className="min-w-[140px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
                  >
                    {Object.values(PaymentStatus).map((pst) => {
                      const pcfg = PAYMENT_STATUS_CONFIG[pst];
                      return (
                        <SelectItem
                          key={pst}
                          value={pst}
                          className="text-xs py-1.5 px-2 rounded-lg cursor-pointer"
                        >
                          <span
                            className={cn(
                              "font-bold",
                              pcfg?.color?.split(" ")[0],
                            )}
                          >
                            {pcfg?.label || pst}
                          </span>
                        </SelectItem>
                      );
                    })}
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

                    <div className="min-w-[150px]">
                      <Select
                        value={itemStatuses[item.id] ?? item.status}
                        onValueChange={(val) => {
                          if (val)
                            handleItemStatusChange(item.id, val as OrderStatus);
                        }}
                        disabled={isPending}
                      >
                        <SelectTrigger className="h-7 w-full text-[11px] font-bold rounded-lg bg-white border-gray-200 px-2.5 shadow-2xs cursor-pointer">
                          <SelectValue>
                            <span
                              className={cn(
                                "font-bold text-[11px]",
                                ORDER_STATUS_CONFIG[
                                  itemStatuses[item.id] ?? item.status
                                ]?.color?.split(" ")[0],
                              )}
                            >
                              {ORDER_STATUS_CONFIG[
                                itemStatuses[item.id] ?? item.status
                              ]?.label ||
                                itemStatuses[item.id] ||
                                item.status}
                            </span>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent
                          alignItemWithTrigger={false}
                          className="min-w-[180px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
                        >
                          {Object.values(OrderStatus).map((st) => {
                            const cfg = ORDER_STATUS_CONFIG[st];
                            return (
                              <SelectItem
                                key={st}
                                value={st}
                                className="text-xs py-1.5 px-2 rounded-lg cursor-pointer"
                              >
                                <span
                                  className={cn(
                                    "font-bold",
                                    cfg?.color?.split(" ")[0],
                                  )}
                                >
                                  {cfg?.label || st}
                                </span>
                              </SelectItem>
                            );
                          })}
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
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Discount:</span>
                    <span>-৳{discountCost.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping Cost:</span>
                  <span>Free</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-sm text-foreground">
                  <span>Final Invoice Total:</span>
                  <span className="text-primary">
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
