import Link from "next/link";
import { AlertCircle, ShoppingCart, ArrowLeft, Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getNewOrderFormDataAction } from "@/actions/admin/management/orders/create-order";
import { CreateOrderForm } from "@/components/admin/management/orders/create-order/create-order-form";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewOrderPage() {
  const res = await getNewOrderFormDataAction();

  if (!res.success || !res.data) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold">
            Failed to Load Order Builder
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {res.message ??
              "An unexpected error occurred while loading catalog data."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Create Manual / POS Order
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Build custom customer orders with real-time stock validation,
              discounts, and automatic financial math.
            </p>
          </div>
        </div>

        <Link
          href="/admin/management/orders/all-orders"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-2 whitespace-nowrap text-xs",
          )}
        >
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>

      {/* Main Order Form Component */}
      <CreateOrderForm formData={res.data} />
    </div>
  );
}
