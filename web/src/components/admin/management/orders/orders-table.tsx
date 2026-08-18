"use client";

import { useState, useMemo, useTransition, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
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

export function OrdersTable({
  orders,
  defaultTypeFilter = "ALL",
}: OrdersTableProps) {
  const [isPending, startTransition] = useTransition();

  // Search and Filter states
  const [search, setSearch] = useState("");
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
    return (
      <Select
        defaultValue={order.status}
        onValueChange={(val) =>
          handleQuickStatusChange(order.id, val as OrderStatus)
        }
        disabled={isPending}
      >
        <SelectTrigger
          className={cn(
            "h-7 text-xs font-semibold px-2 border w-32",
            order.status === OrderStatus.DELIVERED &&
              "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
            order.status === OrderStatus.PENDING &&
              "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
            order.status === OrderStatus.IN_REVIEW &&
              "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
            order.status === OrderStatus.CANCELLED &&
              "bg-destructive/10 text-destructive border-destructive/30",
            order.status === OrderStatus.HOLD &&
              "bg-purple-500/10 text-purple-600 border-purple-500/30",
          )}
        >
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
    );
  };

  // Render Payment Badge
  const renderPaymentBadge = (order: AdminOrder) => {
    return (
      <Select
        defaultValue={order.paymentStatus}
        onValueChange={(val) => {
          if (val)
            handleQuickPaymentStatusChange(order.id, val as PaymentStatus);
        }}
        disabled={isPending}
      >
        <SelectTrigger
          className={cn(
            "h-7 text-[11px] font-bold px-2 border w-24",
            order.paymentStatus === PaymentStatus.PAID
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            value={PaymentStatus.PAID}
            className="text-xs text-emerald-600 font-medium"
          >
            PAID
          </SelectItem>
          <SelectItem
            value={PaymentStatus.PENDING}
            className="text-xs text-amber-600 font-medium"
          >
            PENDING
          </SelectItem>
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
                <SelectContent>
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
              <SelectTrigger className="h-9 text-xs w-[140px]">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {Object.values(OrderStatus).map((st) => (
                  <SelectItem key={st} value={st} className="text-xs">
                    {st.replace(/_/g, " ")}
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
              <SelectContent>
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
              <SelectContent>
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
              <SelectTrigger className="h-9 text-xs w-[130px]">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
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
                    colSpan={9}
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

                  return (
                    <Fragment key={order.id}>
                      <TableRow
                        className={cn(
                          "group hover:bg-muted/30 transition-colors",
                          isExpanded && "bg-muted/20",
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

                        {/* Payment Status Select */}
                        <TableCell className="text-center">
                          {renderPaymentBadge(order)}
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
                            <OrderDetailModal order={order} />
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
                          <TableCell colSpan={9} className="p-3 sm:p-4">
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
