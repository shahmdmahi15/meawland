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
  Package,
  Truck,
  TrendingUp,
  FileText,
  Eye,
  Smartphone,
  RotateCcw,
  Copy,
  Check,
  Send,
  Loader2,
  RefreshCw,
  ExternalLink,
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
import { processAdminBkashRefundAction } from "@/actions/bkash/admin-refund";
import {
  sendOrderToSteadfastAction,
  syncSteadfastShipmentStatusAction,
  createSteadfastReturnRequestFromAdminAction,
} from "@/actions/admin/management/orders/send-to-steadfast";
import { OrderFraudRiskBadge } from "@/components/admin/fraud-checker/order-fraud-risk-badge";
import { OrderInvoiceModal } from "./order-invoice-modal";
import { CourierStickerModal } from "./stickers/courier-sticker-modal";
import { isOrderSentToCourier } from "@/schemas/courier-sticker";
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
  [PaymentStatus.CANCELLED]: {
    label: "Cancelled",
    color: "text-red-700 bg-red-50 border-red-200",
  },
  [PaymentStatus.FAILED]: {
    label: "Failed",
    color: "text-rose-700 bg-rose-50 border-rose-200",
  },
  [PaymentStatus.REFUNDED]: {
    label: "Refunded",
    color: "text-purple-700 bg-purple-50 border-purple-200",
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

  // Refund state
  const [isRefundOpen, setIsRefundOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState(order.finalCost);
  const [refundReason, setRefundReason] = useState("Customer requested refund");
  const [isRefunding, setIsRefunding] = useState(false);
  const [copiedTrx, setCopiedTrx] = useState(false);

  // Steadfast Courier States
  const [isSendingToSteadfast, setIsSendingToSteadfast] = useState(false);
  const [isSyncingCourier, setIsSyncingCourier] = useState(false);
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");
  const [isCreatingReturn, setIsCreatingReturn] = useState(false);

  const handleCopyTracking = (tracking: string) => {
    navigator.clipboard.writeText(tracking);
    setCopiedTracking(true);
    toast.success("Steadfast Tracking Code copied!");
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleSendToSteadfast = async () => {
    setIsSendingToSteadfast(true);
    try {
      const res = await sendOrderToSteadfastAction({ orderId: order.id });
      if (res.success) {
        toast.success(res.message || "Order sent to Steadfast Courier!");
      } else {
        toast.error(res.message || "Failed to dispatch to Steadfast.");
      }
    } catch {
      toast.error("Failed to send order to Steadfast.");
    } finally {
      setIsSendingToSteadfast(false);
    }
  };

  const handleSyncCourierStatus = async () => {
    setIsSyncingCourier(true);
    try {
      const res = await syncSteadfastShipmentStatusAction(order.id);
      if (res.success) {
        toast.success(res.message || "Steadfast delivery status updated.");
      } else {
        toast.error(res.message || "Failed to sync status from Steadfast.");
      }
    } catch {
      toast.error("Failed to sync courier status.");
    } finally {
      setIsSyncingCourier(false);
    }
  };

  const handleCreateReturn = async () => {
    setIsCreatingReturn(true);
    try {
      const res = await createSteadfastReturnRequestFromAdminAction(
        order.id,
        returnReason.trim() || undefined,
      );
      if (res.success) {
        toast.success(res.message || "Return request created on Steadfast.");
        setIsReturnModalOpen(false);
      } else {
        toast.error(res.message || "Failed to create return request.");
      }
    } catch {
      toast.error("Failed to create return request.");
    } finally {
      setIsCreatingReturn(false);
    }
  };

  const handleCopyTrx = (trx: string) => {
    navigator.clipboard.writeText(trx);
    setCopiedTrx(true);
    toast.success("Transaction ID copied to clipboard!");
    setTimeout(() => setCopiedTrx(false), 2000);
  };

  const handleExecuteRefund = async () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      toast.error("Please enter a valid refund amount.");
      return;
    }
    if (!refundReason.trim()) {
      toast.error("Please provide a reason for the refund.");
      return;
    }

    setIsRefunding(true);
    try {
      const res = await processAdminBkashRefundAction({
        orderId: order.id,
        refundAmount: parseFloat(refundAmount).toFixed(2),
        reason: refundReason.trim(),
        sku: order.code,
      });

      if (res.success) {
        toast.success(res.message || "bKash refund processed successfully!");
        setCurrentPaymentStatus(PaymentStatus.REFUNDED);
        setIsRefundOpen(false);
      } else {
        toast.error(res.message || "Failed to process bKash refund.");
      }
    } catch {
      toast.error("An unexpected error occurred while processing the refund.");
    } finally {
      setIsRefunding(false);
    }
  };

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

              <OrderInvoiceModal
                order={order}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-xl px-2.5 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer"
                    title="Download / Print Custom Invoice"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>Invoice</span>
                  </Button>
                }
              />

              {isOrderSentToCourier(order) && (
                <CourierStickerModal
                  orders={[order]}
                  trigger={
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 rounded-xl px-2.5 text-xs font-semibold gap-1.5 shadow-2xs cursor-pointer border-[#0f766e]/30 text-[#0f766e] hover:bg-[#0f766e]/10"
                      title="Print Thermal Courier Sticker (2x3 in)"
                    >
                      <Truck className="w-3.5 h-3.5 text-[#0f766e]" />
                      <span>Courier Sticker</span>
                    </Button>
                  }
                />
              )}
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

                <div className="pt-2">
                  <OrderFraudRiskBadge
                    phone={order.phone}
                    customerName={order.name}
                    orderCode={order.code}
                    parcelId={order.shipment?.consignmentId || order.code}
                    variant="card"
                  />
                </div>
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
                        : "bKash Online"}
                    </strong>
                  </span>
                </div>

                {/* bKash Payment Details */}
                {order.paymentMethod === PaymentMethod.BKASH &&
                  order.payment && (
                    <div className="p-3 mt-2 rounded-xl bg-[#fdf2f8] border border-[#fbcfe8] space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between text-[#9d174d] font-bold">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3" /> bKash Gateway
                          Details
                        </span>
                        {order.payment.status && (
                          <span className="px-1.5 py-0.5 rounded bg-white border border-[#fbcfe8] text-[10px]">
                            {order.payment.status}
                          </span>
                        )}
                      </div>

                      {order.payment.trxID && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">TrxID:</span>
                          <button
                            type="button"
                            onClick={() => handleCopyTrx(order.payment!.trxID!)}
                            className="inline-flex items-center gap-1 font-mono font-bold text-gray-900 hover:text-[#9d174d] cursor-pointer"
                          >
                            <span>{order.payment.trxID}</span>
                            {copiedTrx ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      )}

                      {order.payment.customerMsisdn && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            bKash Mobile:
                          </span>
                          <span className="font-semibold text-gray-900">
                            {order.payment.customerMsisdn}
                          </span>
                        </div>
                      )}

                      {order.payment.paymentExecuteTime && (
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Paid Time:</span>
                          <span>{order.payment.paymentExecuteTime}</span>
                        </div>
                      )}

                      {order.payment.refundTrxId && (
                        <div className="pt-1 border-t border-[#fbcfe8] text-purple-700 font-bold space-y-0.5">
                          <div className="flex justify-between">
                            <span>Refund TrxID:</span>
                            <span className="font-mono">
                              {order.payment.refundTrxId}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Refunded Amount:</span>
                            <span>৳{order.payment.refundAmount}</span>
                          </div>
                          {order.payment.refundReason && (
                            <div className="text-[10px] text-muted-foreground font-normal">
                              Reason: {order.payment.refundReason}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Refund Button for Admin */}
                      {order.payment.trxID &&
                        currentPaymentStatus === PaymentStatus.PAID &&
                        !order.payment.refundTrxId && (
                          <div className="pt-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setIsRefundOpen(true)}
                              className="w-full h-7 text-[11px] rounded-lg bg-[#9d174d] hover:bg-[#831843] text-white font-bold gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Issue bKash Refund</span>
                            </Button>
                          </div>
                        )}
                    </div>
                  )}

                {order.note && (
                  <div className="p-2 rounded-md bg-muted/40 text-[11px] text-muted-foreground mt-2">
                    <strong>Note:</strong> {order.note}
                  </div>
                )}
              </div>

              {/* Steadfast Courier Card */}
              <div className="p-4 rounded-xl border border-border/80 bg-card space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <Truck className="w-4 h-4 text-[#0f766e]" />
                    <span>Steadfast Courier Delivery</span>
                  </div>
                  {order.shipment?.status && (
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase font-bold bg-[#f0fdf4] text-[#15803d] border-[#bbf7d0]"
                    >
                      {order.shipment.rawStatus || order.shipment.status}
                    </Badge>
                  )}
                </div>

                {order.shipment?.consignmentId ? (
                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-lg bg-muted/30 border border-border/60 space-y-1.5 text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Consignment ID:
                        </span>
                        <span className="font-mono font-bold text-foreground">
                          #{order.shipment.consignmentId}
                        </span>
                      </div>

                      {order.shipment.trackingCode && (
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">
                            Tracking Code:
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyTracking(order.shipment!.trackingCode!)
                            }
                            className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline cursor-pointer"
                          >
                            <span>{order.shipment.trackingCode}</span>
                            {copiedTracking ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          COD Amount:
                        </span>
                        <span className="font-bold text-foreground">
                          ৳
                          {parseFloat(
                            order.shipment.codAmount,
                          ).toLocaleString()}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          Delivery Type:
                        </span>
                        <span className="font-medium text-foreground">
                          {order.shipment.deliveryType === 1
                            ? "Point / Hub Pick Up"
                            : "Home Delivery"}
                        </span>
                      </div>

                      {order.shipment.lastCheckedAt && (
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                          <span>Last Synced:</span>
                          <span>
                            {new Date(
                              order.shipment.lastCheckedAt,
                            ).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <CourierStickerModal
                        orders={[order]}
                        trigger={
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs bg-[#56C8D8]/10 text-[#0e7490] hover:bg-[#56C8D8]/20 border-[#56C8D8]/30"
                          >
                            <Truck className="w-3.5 h-3.5" />
                            <span>Print Sticker</span>
                          </Button>
                        }
                      />

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={isSyncingCourier}
                        onClick={handleSyncCourierStatus}
                        className="flex-1 h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                      >
                        <RefreshCw
                          className={cn(
                            "w-3.5 h-3.5",
                            isSyncingCourier && "animate-spin text-primary",
                          )}
                        />
                        <span>Sync Live Status</span>
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsReturnModalOpen(true)}
                        className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Return</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      This order has not been dispatched to Steadfast Courier
                      yet. Click below to generate consignment &amp; tracking
                      code.
                    </p>
                    <Button
                      type="button"
                      size="sm"
                      disabled={isSendingToSteadfast}
                      onClick={handleSendToSteadfast}
                      className="w-full h-8 text-xs font-semibold bg-[#0f766e] hover:bg-[#115e59] text-white gap-1.5 shadow-xs cursor-pointer"
                    >
                      {isSendingToSteadfast ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Dispatching to Steadfast...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send to Steadfast Courier</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Refund Dialog */}
          {isRefundOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200">
                <div className="flex items-center gap-2 text-rose-600">
                  <RotateCcw className="w-5 h-5" />
                  <h3 className="font-black text-base text-gray-900">
                    Process bKash Refund
                  </h3>
                </div>

                <p className="text-xs text-gray-600">
                  This will call the official bKash Refund API and refund the
                  customer directly to their bKash wallet.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Refund Amount (৳)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(e.target.value)}
                      max={parseFloat(order.finalCost)}
                      className="w-full h-9 px-3 rounded-lg border border-gray-300 font-bold text-gray-900"
                    />
                    <span className="text-[10px] text-gray-500">
                      Total Order Paid: ৳
                      {parseFloat(order.finalCost).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">
                      Refund Reason
                    </label>
                    <input
                      type="text"
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g. Item out of stock, customer requested"
                      className="w-full h-9 px-3 rounded-lg border border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsRefundOpen(false)}
                    disabled={isRefunding}
                    className="rounded-lg text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleExecuteRefund}
                    disabled={isRefunding}
                    className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs gap-1.5 shadow-sm"
                  >
                    {isRefunding ? "Processing..." : "Confirm Refund"}
                  </Button>
                </div>
              </div>
            </div>
          )}

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
