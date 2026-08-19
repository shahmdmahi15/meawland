import { Suspense } from "react";
import Link from "next/link";
import { getAllProductsAdminAction } from "@/actions/admin/management/inventory/get-all-products";
import { getNewProductFormDataAction } from "@/actions/admin/management/inventory/get-form-data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AllProductsTable } from "@/components/admin/management/inventory/all-products/all-products-table";
import {
  AlertCircle,
  Package,
  Plus,
  Boxes,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AllProductsPage() {
  const [res, formData] = await Promise.all([
    getAllProductsAdminAction(),
    getNewProductFormDataAction(),
  ]);

  if (!res?.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold">
            Failed to Load Products Inventory
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {res?.message ??
              "An unexpected server error occurred while retrieving products."}
          </p>
        </div>
      </div>
    );
  }

  const products = res.products ?? [];
  const subCategories = formData.subCategories ?? [];
  const brands = formData.brands ?? [];
  const metrics = res.metrics ?? {
    totalProducts: 0,
    simpleCount: 0,
    variableCount: 0,
    totalStockUnits: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categoriesCount: 0,
    brandsCount: 0,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 min-w-0">
        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Package className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight truncate">
              All Products Inventory
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage product listings, monitor stock levels, view variant
              breakdowns, and manage items.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/management/inventory/new-product"
            className={cn(
              buttonVariants({ size: "sm" }),
              "gap-2 whitespace-nowrap",
            )}
          >
            <Plus className="h-4 w-4" /> Add New Product
          </Link>
        </div>
      </div>

      {/* Analytics & Metrics Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 min-w-0">
        {/* Card 1: Total Products */}
        <Card size="sm" className="relative overflow-hidden min-w-0">
          <CardHeader className="min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <CardDescription className="truncate">
                Total Products
              </CardDescription>
              <Package className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl font-bold truncate">
              {metrics.totalProducts}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Simple:{" "}
              <strong className="text-foreground">{metrics.simpleCount}</strong>{" "}
              • Variable:{" "}
              <strong className="text-foreground">
                {metrics.variableCount}
              </strong>
            </p>
          </CardHeader>
        </Card>

        {/* Card 2: Total Stock Units */}
        <Card size="sm" className="relative overflow-hidden min-w-0">
          <CardHeader className="min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <CardDescription className="truncate">
                Total Inventory Units
              </CardDescription>
              <Boxes className="h-4 w-4 shrink-0 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-emerald-600 truncate">
              {metrics.totalStockUnits.toLocaleString()}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Combined units across simple & variant stocks
            </p>
          </CardHeader>
        </Card>

        {/* Card 3: Stock Alerts */}
        <Card size="sm" className="relative overflow-hidden min-w-0">
          <CardHeader className="min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <CardDescription className="truncate">
                Stock Alerts
              </CardDescription>
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-amber-600 truncate">
              {metrics.lowStockCount + metrics.outOfStockCount}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Out of Stock:{" "}
              <strong className="text-destructive">
                {metrics.outOfStockCount}
              </strong>{" "}
              • Low Stock:{" "}
              <strong className="text-amber-600">
                {metrics.lowStockCount}
              </strong>
            </p>
          </CardHeader>
        </Card>

        {/* Card 4: Categories & Brands */}
        <Card size="sm" className="relative overflow-hidden min-w-0">
          <CardHeader className="min-w-0">
            <div className="flex items-center justify-between min-w-0">
              <CardDescription className="truncate">
                Categories & Brands
              </CardDescription>
              <Layers className="h-4 w-4 shrink-0 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold truncate">
              {metrics.categoriesCount} / {metrics.brandsCount}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Active categories / Associated brands
            </p>
          </CardHeader>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="overflow-hidden min-w-0 w-full">
        <CardHeader className="border-b bg-muted/20 min-w-0">
          <CardTitle>Inventory List</CardTitle>
          <CardDescription>
            Search by code, SKU, or name. Filter by category, product type, or
            stock status. Click the expand icon on variable products to inspect
            variant details.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 min-w-0 w-full overflow-hidden">
          <Suspense
            fallback={
              <div className="p-8 text-center text-xs text-muted-foreground">
                Loading products...
              </div>
            }
          >
            <AllProductsTable
              products={products}
              subCategories={subCategories}
              brands={brands}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
