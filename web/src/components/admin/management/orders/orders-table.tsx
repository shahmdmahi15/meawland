"use client";

import { useState, useMemo, useTransition, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShoppingCart,
  Package,
  Truck,
  Send,
  Copy,
  Check,
  RefreshCw,
  Loader2,
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
} from "@/actions/admin/management/orders/update-order";
import {
  sendOrderToSteadfastAction,
  syncSteadfastShipmentStatusAction,
} from "@/actions/admin/management/orders/send-to-steadfast";
import { OrderFraudRiskBadge } from "@/components/admin/fraud-checker/order-fraud-risk-badge";
import { OrderDetailModal } from "./order-detail-modal";
import { OrderInvoiceModal } from "./order-invoice-modal";
import { DeleteOrderButton } from "./delete-order-button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface OrdersTableProps {
  orders: AdminOrder[];
  defaultTypeFilter?: OrderType | "ALL";
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

export function OrdersTable({
  orders,
  defaultTypeFilter = "ALL",
}: OrdersTableProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const urlOrderId = searchParams.get("orderId");
  const urlOrderCode = searchParams.get("orderCode");
  const urlSearch = searchParams.get("search");
  const [activeModalOrderId, setActiveModalOrderId] = useState<string | null>(
    null,
  );

  // Steadfast Courier States
  const [sendingOrderId, setSendingOrderId] = useState<string | null>(null);
  const [syncingOrderId, setSyncingOrderId] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);

  const handleSendToSteadfast = async (order: AdminOrder) => {
    try {
      setSendingOrderId(order.id);
      const res = await sendOrderToSteadfastAction({ orderId: order.id });
      if (res.success) {
        toast.success(res.message || "Order sent to Steadfast Courier!");
      } else {
        toast.error(res.message || "Failed to send order to Steadfast.");
      }
    } catch (error) {
      console.error("[OrdersTable.SendToSteadfast] Error:", error);
      toast.error("Failed to send order to Steadfast.");
    } finally {
      setSendingOrderId(null);
    }
  };

  const handleSyncCourierStatus = async (orderId: string) => {
    try {
      setSyncingOrderId(orderId);
      const res = await syncSteadfastShipmentStatusAction(orderId);
      if (res.success) {
        toast.success(res.message || "Courier delivery status updated.");
      } else {
        toast.error(res.message || "Failed to sync status from Steadfast.");
      }
    } catch (error) {
      console.error("[OrdersTable.SyncCourierStatus] Error:", error);
      toast.error("Failed to sync courier status.");
    } finally {
      setSyncingOrderId(null);
    }
  };

  const handleCopyTracking = (trackingCode: string) => {
    navigator.clipboard.writeText(trackingCode);
    setCopiedTrackingId(trackingCode);
    toast.success(`Copied Tracking Code: ${trackingCode}`);
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

  const urlMatchedOrderId = useMemo(() => {
    if (urlOrderId) {
      return orders.find((o) => o.id === urlOrderId)?.id ?? null;
    }
    if (urlOrderCode) {
      return (
        orders.find((o) => o.code.toLowerCase() === urlOrderCode.toLowerCase())
          ?.id ?? null
      );
    }
    return null;
  }, [urlOrderId, urlOrderCode, orders]);

  const effectiveActiveOrderId = activeModalOrderId ?? urlMatchedOrderId;

  const [isPending, startTransition] = useTransition();

  // Controlled status states
  const [orderStatuses, setOrderStatuses] = useState<
    Record<string, OrderStatus>
  >({});
  const [paymentStatuses, setPaymentStatuses] = useState<
    Record<string, PaymentStatus>
  >({});

  // Search and Filter states
  const [search, setSearch] = useState(() => urlSearch || "");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("ALL");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>(defaultTypeFilter);
  const [sortBy, setSortBy] = useState<string>("newest");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Expanded rows for inspecting items inline
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRowExpansion = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setExpandedRows(next);
  };

  // Inline status updates
  const handleQuickStatusChange = (orderId: string, newStatus: OrderStatus) => {
    setOrderStatuses((prev) => ({ ...prev, [orderId]: newStatus }));
    startTransition(async () => {
      const res = await updateOrderStatusAction({
        orderId,
        status: newStatus,
        syncItemsStatus: true,
      });
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleQuickPaymentStatusChange = (
    orderId: string,
    newPaymentStatus: PaymentStatus,
  ) => {
    setPaymentStatuses((prev) => ({ ...prev, [orderId]: newPaymentStatus }));
    startTransition(async () => {
      const res = await updatePaymentStatusAction({
        orderId,
        paymentStatus: newPaymentStatus,
      });
      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    });
  };

  // Filtered and sorted orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Type Filter
      if (typeFilter !== "ALL" && order.type !== typeFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== "ALL" && order.status !== statusFilter) {
        return false;
      }

      // Payment Status Filter
      if (
        paymentStatusFilter !== "ALL" &&
        order.paymentStatus !== paymentStatusFilter
      ) {
        return false;
      }

      // Payment Method Filter
      if (
        paymentMethodFilter !== "ALL" &&
        order.paymentMethod !== paymentMethodFilter
      ) {
        return false;
      }

      // Text Search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCode = order.code.toLowerCase().includes(q);
        const matchesName = order.name.toLowerCase().includes(q);
        const matchesEmail = order.email.toLowerCase().includes(q);
        const matchesPhone = order.phone.toLowerCase().includes(q);
        const matchesDistrict = order.district.toLowerCase().includes(q);
        const matchesAddress = order.address.toLowerCase().includes(q);
        const matchesTrx = order.payment?.trxID?.toLowerCase().includes(q);
        const matchesBkashNumber = order.payment?.customerMsisdn
          ?.toLowerCase()
          .includes(q);
        const matchesItems = order.items.some((i) =>
          i.name.toLowerCase().includes(q),
        );

        if (
          !matchesCode &&
          !matchesName &&
          !matchesEmail &&
          !matchesPhone &&
          !matchesDistrict &&
          !matchesAddress &&
          !matchesTrx &&
          !matchesBkashNumber &&
          !matchesItems
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    orders,
    typeFilter,
    statusFilter,
    paymentStatusFilter,
    paymentMethodFilter,
    search,
  ]);

  // Sorted orders
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (sortBy === "oldest") {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      if (sortBy === "amount_high") {
        return (parseFloat(b.finalCost) || 0) - (parseFloat(a.finalCost) || 0);
      }
      if (sortBy === "amount_low") {
        return (parseFloat(a.finalCost) || 0) - (parseFloat(b.finalCost) || 0);
      }
      if (sortBy === "items_count") {
        return b.totalQuantity - a.totalQuantity;
      }
      return 0;
    });
  }, [filteredOrders, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(sortedOrders.length / pageSize) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, currentPage, pageSize]);

  // Render Status Badge
  const renderStatusBadge = (order: AdminOrder) => {
    const status = orderStatuses[order.id] ?? order.status;
    const cfg = ORDER_STATUS_CONFIG[status];
    return (
      <Select
        value={status}
        onValueChange={(val) => {
          if (val) handleQuickStatusChange(order.id, val as OrderStatus);
        }}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn(
            "h-7 text-xs font-bold px-2.5 border rounded-lg w-36 shadow-2xs cursor-pointer",
            cfg?.color,
          )}
        >
          <SelectValue>
            <span className="font-bold text-xs truncate">
              {cfg?.label || status}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          className="min-w-[190px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
        >
          {Object.values(OrderStatus).map((st) => {
            const scfg = ORDER_STATUS_CONFIG[st];
            return (
              <SelectItem
                key={st}
                value={st}
                className="text-xs py-1.5 px-2 rounded-lg cursor-pointer"
              >
                <span
                  className={cn(
                    "font-bold text-xs",
                    scfg?.color?.split(" ")[0],
                  )}
                >
                  {scfg?.label || st}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  };

  // Render Payment Badge
  const renderPaymentBadge = (order: AdminOrder) => {
    const pStatus = paymentStatuses[order.id] ?? order.paymentStatus;
    const pcfg = PAYMENT_STATUS_CONFIG[pStatus];
    return (
      <Select
        value={pStatus}
        onValueChange={(val) => {
          if (val)
            handleQuickPaymentStatusChange(order.id, val as PaymentStatus);
        }}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn(
            "h-7 text-[11px] font-bold px-2.5 border rounded-lg w-28 shadow-2xs cursor-pointer",
            pcfg?.color,
          )}
        >
          <SelectValue>
            <span className="font-bold text-[11px]">
              {pcfg?.label || pStatus}
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent
          alignItemWithTrigger={false}
          className="min-w-[140px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
        >
          {Object.values(PaymentStatus).map((pst) => {
            const itemCfg = PAYMENT_STATUS_CONFIG[pst];
            return (
              <SelectItem
                key={pst}
                value={pst}
                className="text-xs py-1.5 px-2 rounded-lg cursor-pointer"
              >
                <span
                  className={cn("font-bold", itemCfg?.color?.split(" ")[0])}
                >
                  {itemCfg?.label || pst}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  };

  return (
    <div className="space-y-6 min-w-0 w-full">
      {/* Search & Filter Bar */}
      <div className="rounded-xl border border-border bg-card p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by code, customer name, phone, district..."
              className="pl-9 pr-9 text-xs sm:text-sm h-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Order Type Filter (Only if defaultTypeFilter === 'ALL') */}
            {defaultTypeFilter === "ALL" && (
              <Select
                value={typeFilter}
                onValueChange={(val) => {
                  setTypeFilter(val || "ALL");
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-9 text-xs w-[120px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent
                  alignItemWithTrigger={false}
                  className="min-w-[130px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
                >
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value={OrderType.WEB}>Web</SelectItem>
                  <SelectItem value={OrderType.OTHER}>Other / POS</SelectItem>
                </SelectContent>
              </Select>
            )}

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val || "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[150px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="min-w-[200px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
              >
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.values(OrderStatus).map((st) => (
                  <SelectItem key={st} value={st} className="text-xs">
                    {ORDER_STATUS_CONFIG[st]?.label || st}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Status Filter */}
            <Select
              value={paymentStatusFilter}
              onValueChange={(val) => {
                setPaymentStatusFilter(val || "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="min-w-[140px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
              >
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Method Filter */}
            <Select
              value={paymentMethodFilter}
              onValueChange={(val) => {
                setPaymentMethodFilter(val || "ALL");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[120px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="min-w-[130px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
              >
                <SelectItem value="ALL">All Methods</SelectItem>
                <SelectItem value={PaymentMethod.COD}>COD</SelectItem>
                <SelectItem value={PaymentMethod.BKASH}>bKash</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Options */}
            <Select
              value={sortBy}
              onValueChange={(val) => {
                setSortBy(val || "newest");
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent
                alignItemWithTrigger={false}
                className="min-w-[150px] bg-white border border-gray-200 shadow-xl rounded-xl p-1 z-50"
              >
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="amount_high">Highest Amount</SelectItem>
                <SelectItem value="amount_low">Lowest Amount</SelectItem>
                <SelectItem value="items_count">Most Items</SelectItem>
              </SelectContent>
            </Select>

            {(search ||
              statusFilter !== "ALL" ||
              paymentStatusFilter !== "ALL" ||
              paymentMethodFilter !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("ALL");
                  setPaymentStatusFilter("ALL");
                  setPaymentMethodFilter("ALL");
                  setCurrentPage(1);
                }}
                className="h-9 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" /> Reset
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead className="w-28 font-bold">Order Code</TableHead>
                <TableHead className="font-bold">Customer &amp; Area</TableHead>
                <TableHead className="w-24 text-center font-bold">
                  Type
                </TableHead>
                <TableHead className="w-28 text-right font-bold">
                  Amount
                </TableHead>
                <TableHead className="w-32 text-center font-bold">
                  Order Status
                </TableHead>
                <TableHead className="w-24 text-center font-bold">
                  Payment
                </TableHead>
                <TableHead className="w-36 text-center font-bold">
                  Steadfast Courier
                </TableHead>
                <TableHead className="w-28 text-center font-bold">
                  Date
                </TableHead>
                <TableHead className="w-28 text-right font-bold pr-4">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="h-48 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                      <p className="font-medium text-sm">
                        No orders found matching your filters.
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Try resetting your search query or filters.
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => {
                  const isExpanded = expandedRows.has(order.id);
                  const isHighlighted =
                    order.id === urlOrderId ||
                    order.code.toLowerCase() === urlOrderCode?.toLowerCase() ||
                    effectiveActiveOrderId === order.id;

                  return (
                    <Fragment key={order.id}>
                      <TableRow
                        className={cn(
                          "group transition-colors",
                          isHighlighted
                            ? "bg-primary/10 hover:bg-primary/15 border-l-4 border-l-primary"
                            : isExpanded
                              ? "bg-muted/20"
                              : "hover:bg-muted/30",
                        )}
                      >
                        {/* Expand Row Toggle */}
                        <TableCell className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => toggleRowExpansion(order.id)}
                            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                            title="Expand order items"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </TableCell>

                        {/* Order Code */}
                        <TableCell className="font-semibold text-xs text-primary">
                          <Link
                            href={`/admin/management/orders/${order.code}`}
                            className="hover:underline font-mono"
                          >
                            #{order.code}
                          </Link>
                        </TableCell>

                        {/* Customer Info */}
                        <TableCell>
                          <div className="space-y-0.5">
                            <div className="font-medium text-xs text-foreground truncate max-w-[180px]">
                              {order.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate max-w-[200px]">
                              <span>{order.phone}</span>
                              <span>•</span>
                              <span className="font-medium text-foreground/80">
                                {order.district}
                              </span>
                            </div>
                            <div className="pt-0.5">
                              <OrderFraudRiskBadge
                                phone={order.phone}
                                customerName={order.name}
                                orderCode={order.code}
                                parcelId={
                                  order.shipment?.consignmentId || order.code
                                }
                                variant="inline"
                              />
                            </div>
                          </div>
                        </TableCell>

                        {/* Order Type Badge */}
                        <TableCell className="text-center">
                          <Badge
                            variant={
                              order.type === OrderType.WEB
                                ? "outline"
                                : "secondary"
                            }
                            className="text-[10px] h-5 px-1.5 font-bold uppercase"
                          >
                            {order.type}
                          </Badge>
                        </TableCell>

                        {/* Final Cost Amount */}
                        <TableCell className="text-right">
                          <div className="font-bold text-xs text-foreground">
                            ৳{parseFloat(order.finalCost).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {order.totalQuantity} items
                          </div>
                        </TableCell>

                        {/* Order Status Select */}
                        <TableCell className="text-center">
                          {renderStatusBadge(order)}
                        </TableCell>

                        {/* Payment Status Select & Method */}
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            {renderPaymentBadge(order)}
                            {order.paymentMethod === PaymentMethod.BKASH ? (
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fdf2f8] text-[#9d174d] border border-[#fbcfe8]">
                                  bKash
                                </span>
                                {order.payment?.trxID && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        order.payment!.trxID!,
                                      );
                                      toast.success(
                                        `Copied TrxID: ${order.payment!.trxID!}`,
                                      );
                                    }}
                                    className="text-[10px] font-mono text-muted-foreground hover:text-foreground underline cursor-pointer"
                                    title="Copy TrxID"
                                  >
                                    {order.payment.trxID.slice(0, 7)}...
                                  </button>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] text-muted-foreground">
                                COD
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Steadfast Courier Column */}
                        <TableCell className="text-center">
                          {order.shipment?.consignmentId ? (
                            <div className="flex flex-col items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled
                                className="h-7 px-2 text-[11px] font-semibold bg-emerald-50/90 border-emerald-300 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300 opacity-95 cursor-default flex items-center gap-1 shadow-xs"
                                title={`Steadfast Consignment ID: #${order.shipment.consignmentId} | Status: ${order.shipment.rawStatus || order.shipment.status}`}
                              >
                                <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>#{order.shipment.consignmentId}</span>
                              </Button>
                              {order.shipment.trackingCode && (
                                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                  <span className="font-mono font-medium">
                                    {order.shipment.trackingCode}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleCopyTracking(
                                        order.shipment!.trackingCode!,
                                      )
                                    }
                                    className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                    title="Copy Tracking Code"
                                  >
                                    {copiedTrackingId ===
                                    order.shipment.trackingCode ? (
                                      <Check className="w-3 h-3 text-emerald-600" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    disabled={syncingOrderId === order.id}
                                    onClick={() =>
                                      handleSyncCourierStatus(order.id)
                                    }
                                    className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                                    title="Sync Live Courier Status"
                                  >
                                    <RefreshCw
                                      className={cn(
                                        "w-3 h-3",
                                        syncingOrderId === order.id &&
                                          "animate-spin text-primary",
                                      )}
                                    />
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              disabled={sendingOrderId === order.id}
                              onClick={() => handleSendToSteadfast(order)}
                              className="h-7 px-2.5 text-xs font-semibold bg-[#0f766e] hover:bg-[#115e59] text-white shadow-xs transition-all gap-1.5 cursor-pointer"
                              title="Send consignment to Steadfast Courier"
                            >
                              {sendingOrderId === order.id ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  <span>Sending...</span>
                                </>
                              ) : (
                                <>
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Send</span>
                                </>
                              )}
                            </Button>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="text-center text-[11px] text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <OrderDetailModal
                              order={order}
                              isOpen={effectiveActiveOrderId === order.id}
                              onOpenChange={(isOpen) => {
                                if (isOpen) {
                                  setActiveModalOrderId(order.id);
                                } else {
                                  if (effectiveActiveOrderId === order.id) {
                                    setActiveModalOrderId(null);
                                  }
                                  if (urlOrderId || urlOrderCode) {
                                    router.replace(pathname, { scroll: false });
                                  }
                                }
                              }}
                            />
                            <OrderInvoiceModal order={order} />
                            <DeleteOrderButton
                              orderId={order.id}
                              orderCode={order.code}
                            />
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Items Preview Row */}
                      {isExpanded && (
                        <TableRow className="bg-muted/15 border-b border-border/80">
                          <TableCell colSpan={10} className="p-3 sm:p-4">
                            <div className="space-y-3 rounded-lg border border-border/60 bg-background/80 p-3">
                              <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                <span className="flex items-center gap-1.5 text-foreground">
                                  <Package className="w-3.5 h-3.5 text-primary" />
                                  Ordered Products &amp; Bundles (
                                  {order.items.length})
                                </span>
                                <span>
                                  Delivery Address:{" "}
                                  <strong className="text-foreground">
                                    {order.address}, {order.district}
                                  </strong>
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                {order.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center gap-2.5 rounded-md border border-border/50 p-2 bg-card text-xs"
                                  >
                                    <div className="relative h-10 w-10 shrink-0 rounded bg-muted overflow-hidden border flex items-center justify-center">
                                      {isValidImageSrc(item.image) ? (
                                        <Image
                                          src={item.image}
                                          alt={item.name}
                                          fill
                                          className="object-cover"
                                        />
                                      ) : (
                                        <Package className="w-5 h-5 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-semibold text-foreground truncate">
                                        {item.name}
                                      </p>
                                      <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-0.5">
                                        <span>Qty: {item.quantity}</span>
                                        <span className="font-semibold text-foreground">
                                          ৳
                                          {parseFloat(
                                            item.finalCost,
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {order.note && (
                                <p className="text-[11px] text-muted-foreground bg-muted/30 p-2 rounded">
                                  <strong>Customer Note:</strong> {order.note}
                                </p>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {sortedOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border bg-muted/10 text-xs">
            <div className="text-muted-foreground">
              Showing{" "}
              <strong>
                {(currentPage - 1) * pageSize + 1} -{" "}
                {Math.min(currentPage * pageSize, sortedOrders.length)}
              </strong>{" "}
              of <strong>{sortedOrders.length}</strong> orders
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-muted-foreground">Rows per page:</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(val) => {
                    if (val) {
                      setPageSize(Number(val));
                      setCurrentPage(1);
                    }
                  }}
                >
                  <SelectTrigger className="h-7 text-xs w-[68px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>

              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="icon-xs"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="outline"
                size="icon-xs"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
