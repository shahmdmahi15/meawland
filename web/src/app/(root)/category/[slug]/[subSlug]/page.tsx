import { getProductsByCategoryAction } from "@/actions/store/products/get-by-category";
import { getMockProducts } from "@/lib/mock-products";
import { formatCategorySlugToTitle } from "@/lib/category-helpers";
import { CategoryHeader } from "@/components/root/store/category-header";
import { ProductGrid } from "@/components/root/store/product-grid";

interface SubCategoryPageProps {
  params: Promise<{
    slug: string;
    subSlug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function SubCategoryPage({
  params,
}: SubCategoryPageProps) {
  const { slug, subSlug } = await params;

  const subCategoryTitle = formatCategorySlugToTitle(subSlug);

  // 1. Fetch real DB products filtered by sub-category slug
  const productsRes = await getProductsByCategoryAction(slug, subSlug);
  const realProducts = productsRes.products ?? [];

  // Use real DB products if available, fallback to mock products if 0 items in DB yet
  const displayProducts =
    realProducts.length > 0 ? realProducts : getMockProducts(slug, subSlug);

  return (
    <main className="min-h-screen bg-white pb-16">
      {/* Sub-Category Header Banner */}
      <CategoryHeader title={subCategoryTitle} />

      {/* Real DB Products Grid */}
      <ProductGrid
        products={displayProducts}
        emptyMessage={`No products found under ${subCategoryTitle}.`}
      />
    </main>
  );
}
