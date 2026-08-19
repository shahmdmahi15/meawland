import { Suspense } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ShoppingCart,
  Plus,
  DollarSign,
  TrendingUp,
  Clock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { getOrdersAdminAction } from "@/actions/admin/management/orders/get-orders";
import { OrdersTable } from "@/components/admin/management/orders/orders-table";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AllOrdersPage() {
  const res = await getOrdersAdminAction({ type: "ALL" });

  if (!res.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold">Failed to Load Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {res.message ?? "An unexpected server error occurred."}
          </p>
        </div>
      </div>
    );
  }

  const orders = res.orders ?? [];
  const metrics = res.metrics ?? {
    totalOrders: orders.length,
    webOrdersCount: 0,
    otherOrdersCount: 0,
    pendingCount: 0,
    inReviewCount: 0,
    deliveredCount: 0,
    cancelledCount: 0,
    totalRevenue: 0,
    totalOwnerCost: 0,
    estimatedProfit: 0,
    paidOrdersCount: 0,
    pendingPaymentCount: 0,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              All Orders Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Comprehensive overview of both Web Storefront and POS / Offline
              orders.
            </p>
          </div>
        </div>

        <Link
          href="/admin/management/orders/new-order"
          className={cn(
            buttonVariants({ size: "sm" }),
            "gap-2 whitespace-nowrap font-semibold shadow-xs",
          )}
        >
          <Plus className="h-4 w-4" /> Create Manual Order
        </Link>
      </div>

      {/* KPI Metrics Cards */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 min-w-0">
        {/* Card 1: Total Orders */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Orders
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {metrics.totalOrders}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Web:{" "}
                <strong className="text-foreground">
                  {metrics.webOrdersCount}
                </strong>{" "}
                • Admin:{" "}
                <strong className="text-foreground">
                  {metrics.otherOrdersCount}
                </strong>
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Total Revenue */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Total Revenue
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                ৳{metrics.totalRevenue.toLocaleString()}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Paid:{" "}
                <strong className="text-foreground">
                  {metrics.paidOrdersCount}
                </strong>{" "}
                • Pending:{" "}
                <strong className="text-amber-600">
                  {metrics.pendingPaymentCount}
                </strong>
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <DollarSign className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Estimated Net Profit */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Est. Net Profit
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                ৳{metrics.estimatedProfit.toLocaleString()}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Total Cost: ৳{metrics.totalOwnerCost.toLocaleString()}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Status Breakdown */}
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Pending &amp; In-Review
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {metrics.pendingCount + metrics.inReviewCount}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Delivered:{" "}
                <strong className="text-emerald-600">
                  {metrics.deliveredCount}
                </strong>{" "}
                • Cancelled:{" "}
                <strong className="text-destructive">
                  {metrics.cancelledCount}
                </strong>
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unified Orders Data Table */}
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-muted-foreground">
            Loading orders...
          </div>
        }
      >
        <OrdersTable orders={orders} defaultTypeFilter="ALL" />
      </Suspense>
    </div>
  );
}
