import Link from "next/link";
import { getModifyStockPageDataAction } from "@/actions/admin/management/inventory/modify-stock";
import { ModifyStockView } from "@/components/admin/management/inventory/modify-stock/modify-stock-view";
import { buttonVariants } from "@/components/ui/button";
import {
  Boxes,
  Package,
  Plus,
  ArrowLeft,
  AlertCircle,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ModifyStockPage() {
  const res = await getModifyStockPageDataAction();

  if (!res.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold">
            Failed to Load Inventory Stock Management
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {res.message ||
              "An unexpected error occurred while loading inventory data."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Link
              href="/admin/management/inventory/all-products"
              className="hover:text-foreground transition-colors"
            >
              Inventory
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium">Modify Stock</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 sm:text-3xl">
            <SlidersHorizontal className="h-7 w-7 text-primary" /> Modify Stock
            &amp; Inventory Audit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Record purchases, returns, damages, expired write-offs, and audit
            adjustments for products and variants with full transaction logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/management/inventory/all-products"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5 text-xs",
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5" /> All Products
          </Link>
          <Link
            href="/admin/management/inventory/new-product"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-1.5 text-xs font-semibold",
            )}
          >
            <Plus className="h-3.5 w-3.5" /> New Product
          </Link>
        </div>
      </div>

      {/* Main Stock Modification View */}
      <ModifyStockView
        initialMetrics={res.metrics}
        initialEvents={res.recentEvents}
        categories={res.categories}
      />
    </div>
  );
}
