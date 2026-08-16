import { Suspense } from "react";
import { Metadata } from "next";
import { getAllStoreProductsAction } from "@/actions/store/products/get-all-store-products";
import { AllProductsView } from "@/components/root/store/all-products-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Products | Meawland - The Ultimate Pet Store",
  description:
    "Explore Meawland's complete catalog of premium pet food, soothing grooming care, handcrafted clothes, accessories, and fun toys with fast nationwide delivery in Bangladesh.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "All Products | Meawland - The Ultimate Pet Store",
    description:
      "Explore Meawland's complete catalog of premium pet food, soothing grooming care, handcrafted clothes, accessories, and fun toys with fast nationwide delivery in Bangladesh.",
    url: "/products",
  },
};

interface ProductsPageProps {
  searchParams: Promise<{
    q?: string;
    search?: string;
    category?: string;
  }>;
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const params = await searchParams;
  const initialSearch = params?.q || params?.search || "";
  const initialCategory = params?.category || "ALL";

  const { products, meta } = await getAllStoreProductsAction();

  return (
    <main className="min-h-screen bg-white">
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#56C8D8] border-t-transparent animate-spin" />
          </div>
        }
      >
        <AllProductsView
          initialProducts={products}
          filterMeta={meta}
          initialSearchQuery={initialSearch}
          initialCategory={initialCategory}
        />
      </Suspense>
    </main>
  );
}
