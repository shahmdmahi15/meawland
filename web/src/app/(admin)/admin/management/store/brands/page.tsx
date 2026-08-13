import { getAllBrandsAdminAction } from "@/actions/admin/management/store/brands/get-all";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BrandsTable } from "@/components/admin/management/store/brands/brands-table";
import { BrandsActions } from "@/components/admin/management/store/brands/brands-actions";
import { AlertCircle, Tag } from "lucide-react";

export default async function BrandsPage() {
  const res = await getAllBrandsAdminAction();

  if (!res?.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to Load Brands</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {res?.message ?? "An error occurred while loading brands."}
          </p>
        </div>
      </div>
    );
  }

  const brands = res.brands ?? [];

  // Calculate stats
  const totalBrands = brands.length;
  const brandsWithProducts = brands.filter((b) => b.productCount > 0).length;
  const totalProductsInBrands = brands.reduce(
    (sum, b) => sum + b.productCount,
    0,
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Brands</h1>
            <p className="text-sm text-muted-foreground">
              Manage product brands for your store.
            </p>
          </div>
        </div>
        <BrandsActions />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total Brands</CardDescription>
            <CardTitle className="text-2xl">{totalBrands}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Brands with Products</CardDescription>
            <CardTitle className="text-2xl">{brandsWithProducts}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total Associated Products</CardDescription>
            <CardTitle className="text-2xl">{totalProductsInBrands}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Brands Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Brands</CardTitle>
          <CardDescription>
            Browse and manage brands for your store products.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <BrandsTable brands={brands} />
        </CardContent>
      </Card>
    </div>
  );
}
