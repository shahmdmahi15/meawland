import { getNewProductFormDataAction } from "@/actions/admin/management/inventory/get-form-data";
import { CreateProductForm } from "@/components/admin/management/inventory/create-product-form";
import { AlertCircle } from "lucide-react";

export const revalidate = 0;

export default async function NewProductPage() {
  const res = await getNewProductFormDataAction();

  if (!res.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Failed to Load Form Data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {res.message ??
              "An error occurred while loading form initial data."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <CreateProductForm
        subCategories={res.subCategories}
        brands={res.brands}
      />
    </div>
  );
}
