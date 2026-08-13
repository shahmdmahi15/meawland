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

export default async function SubCategoryPage({
  params,
}: SubCategoryPageProps) {
  const { slug, subSlug } = await params;

  const subCategoryTitle = formatCategorySlugToTitle(subSlug);

  const mockProducts = getMockProducts(slug, subSlug);

  return (
    <main className="min-h-screen bg-white pb-16">
      {/* Sub-Category Header Banner */}
      <CategoryHeader title={subCategoryTitle} />

      {/* Mock Products Grid only - no sub category fetching here */}
      <ProductGrid products={mockProducts} />
    </main>
  );
}
