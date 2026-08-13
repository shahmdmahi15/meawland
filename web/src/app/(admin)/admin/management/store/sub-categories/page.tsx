import {
  getAllSubCategoriesAdminAction,
  type SubCategoryWithCount,
} from "@/actions/admin/management/store/sub-categories/get-all";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubCategoriesTable } from "@/components/admin/management/store/sub-categories/sub-categories-table";
import { SubCategoriesActions } from "@/components/admin/management/store/sub-categories/sub-categories-actions";
import { AlertCircle, Layers } from "lucide-react";
import { Category } from "@/generated/prisma/enums";

// Map category enum to display names
const CATEGORY_DISPLAY_NAMES: Record<Category, string> = {
  PET_ACCESSORIES: "Pet Accessories",
  PET_CARE: "Pet Care",
  PET_FOOD: "Pet Food",
  PET_MEDICINE: "Pet Medicine",
  PET_DRESS: "Pet Dress",
  PET_TOY: "Pet Toy",
  PET_LITTER: "Pet Litter",
};

export default async function SubCategoriesPage() {
  const res = await getAllSubCategoriesAdminAction();

  if (!res?.success) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-8 w-8" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold">
            Failed to Load Sub-Categories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {res?.message ?? "An error occurred while loading sub-categories."}
          </p>
        </div>
      </div>
    );
  }

  const subCategories = res.subCategories ?? [];

  // Group sub-categories by category for stats
  const groupedByCategory = subCategories.reduce(
    (acc, subCategory) => {
      if (!acc[subCategory.category]) {
        acc[subCategory.category] = [];
      }
      acc[subCategory.category]!.push(subCategory);
      return acc;
    },
    {} as Record<Category, SubCategoryWithCount[]>,
  );

  const categories = (Object.keys(Category) as Category[]).filter(
    (category) => groupedByCategory[category],
  );

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Sub-Categories
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage sub-categories organized by their parent categories.
            </p>
          </div>
        </div>
        <SubCategoriesActions />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardHeader>
            <CardDescription>Total Sub-Categories</CardDescription>
            <CardTitle className="text-2xl">{subCategories.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <CardDescription>Active Categories</CardDescription>
            <CardTitle className="text-2xl">{categories.length}</CardTitle>
          </CardHeader>
        </Card>
        {categories.slice(0, 2).map((category) => (
          <Card key={category} size="sm">
            <CardHeader>
              <CardDescription>
                {CATEGORY_DISPLAY_NAMES[category]}
              </CardDescription>
              <CardTitle className="text-2xl">
                {groupedByCategory[category]?.length ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Sub-Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sub-Categories by Category</CardTitle>
          <CardDescription>
            Browse and manage sub-categories. Use the expand/collapse buttons to
            toggle category visibility.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <SubCategoriesTable subCategories={subCategories} />
        </CardContent>
      </Card>
    </div>
  );
}
