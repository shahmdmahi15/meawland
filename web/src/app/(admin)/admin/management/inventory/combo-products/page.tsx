import {
  AlertCircle,
  Boxes,
  PackagePlus,
  Sparkles,
  TrendingDown,
  CheckCircle2,
  Percent,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateComboProductModal } from "@/components/admin/management/inventory/combo-products/create-combo-product-modal";
import {
  getAllComboProductsAdminAction,
  getComboProductFormDataAction,
} from "@/actions/admin/management/inventory/combo-products";
import { ComboProductsTable } from "@/components/admin/management/inventory/combo-products/combo-products-table";

export const dynamic = "force-dynamic";

export default async function ComboProductsPage() {
  const [formData, combosResponse] = await Promise.all([
    getComboProductFormDataAction(),
    getAllComboProductsAdminAction(),
  ]);

  if (!formData.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-lg font-semibold">
            Failed to Load Combo Product Data
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formData.message ??
              "An unexpected error prevented combo bundles from loading."}
          </p>
        </div>
      </div>
    );
  }

  const products = formData.products ?? [];
  const combos = combosResponse.success ? (combosResponse.combos ?? []) : [];
  const metrics = combosResponse.metrics ?? {
    totalCombos: combos.length,
    inStockCombos: 0,
    depletedCombos: 0,
    avgDiscountPercent: 0,
    totalCatalogValue: 0,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6 min-w-0 w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Combo Product Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Build high-converting bundles from multiple simple products and
              variants with automatic stock capacity &amp; discount tracking.
            </p>
          </div>
        </div>

        <CreateComboProductModal products={products} />
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid gap-3.5 grid-cols-2 lg:grid-cols-4 min-w-0">
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Combo Offers
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {metrics.totalCombos}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Ready in Stock
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {metrics.inStockCombos}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                Avg Bundle Discount
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {metrics.avgDiscountPercent}% OFF
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
              <Percent className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Available Sources
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-foreground mt-0.5">
                {products.length}
              </h3>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
              <PackagePlus className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Combo Products Table / Grid View */}
      <ComboProductsTable combos={combos} products={products} />
    </div>
  );
}
