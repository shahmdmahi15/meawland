import { Suspense } from "react";
import { Metadata } from "next";
import { getAllStoreComboProductsAction } from "@/actions/store/combo-products/get-all";
import { ComboProductsView } from "@/components/root/store/combo-products-view";
import type { ComboSortOption } from "@/schemas/store/combo-products";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Combo Deals & Bundles | Meawland - The Ultimate Pet Store",
  description:
    "Discover exclusive money-saving pet bundles and combo deals at Meawland. Shop curated pet food, grooming care, anti-fungal treatments, and toys at discounted bundle prices with fast delivery across Bangladesh.",
  alternates: {
    canonical: "/combo-products",
  },
  openGraph: {
    title: "Combo Deals & Bundles | Meawland - The Ultimate Pet Store",
    description:
      "Discover exclusive money-saving pet bundles and combo deals at Meawland. Shop curated pet food, grooming care, anti-fungal treatments, and toys at discounted bundle prices with fast delivery across Bangladesh.",
    url: "/combo-products",
  },
};

import { MeawlandLoading } from "@/components/ui/meawland-loading";
import { BreadcrumbsJsonLd } from "@/components/seo/structured-data";

interface ComboProductsPageProps {
  searchParams: Promise<{
    q?: string;
    search?: string;
    sort?: string;
  }>;
}

export default async function ComboProductsPage({
  searchParams,
}: ComboProductsPageProps) {
  const params = await searchParams;
  const initialSearch = params?.q || params?.search || "";
  const initialSort = (params?.sort as ComboSortOption) || "NEWEST";

  const { combos, meta } = await getAllStoreComboProductsAction();

  return (
    <main className="min-h-screen bg-white">
      <BreadcrumbsJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Combo Deals & Bundles", url: "/combo-products" },
        ]}
      />
      <Suspense
        fallback={
          <MeawlandLoading
            variant="page"
            text="Loading combo deals..."
            subtext="Fetching the best value money-saving bundles"
          />
        }
      >
        <ComboProductsView
          initialCombos={combos}
          filterMeta={meta}
          initialSearchQuery={initialSearch}
          initialSort={initialSort}
        />
      </Suspense>
    </main>
  );
}
