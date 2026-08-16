import { Metadata } from "next";
import { getAllStoreProductsAction } from "@/actions/store/products/get-all-store-products";
import { AllProductsView } from "@/components/root/store/all-products-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Products | Meawland - The Ultimate Pet Store",
  description:
    "Explore Meawland's complete catalog of premium pet food, soothing grooming care, handcrafted clothes, accessories, and fun toys with fast nationwide delivery in Bangladesh.",
};

export default async function ProductsPage() {
  const { products, meta } = await getAllStoreProductsAction();

  return (
    <main className="min-h-screen bg-white">
      <AllProductsView initialProducts={products} filterMeta={meta} />
    </main>
  );
}
