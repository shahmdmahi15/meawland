import { getSubCategoriesByCategoryAction } from "@/actions/store/sub-categories/get-by-category";
import { getProductsByCategoryAction } from "@/actions/store/products/get-by-category";
import { getMockProducts } from "@/lib/mock-products";
import { formatCategorySlugToTitle } from "@/lib/category-helpers";
import { CategoryHeader } from "@/components/root/store/category-header";
import { SubCategoryCarousel } from "@/components/root/store/sub-category-carousel";
import { ProductGrid } from "@/components/root/store/product-grid";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  // 1. Fetch sub-categories for the carousel
  const subCatRes = await getSubCategoriesByCategoryAction(slug);
  const categoryTitle =
    subCatRes.categoryTitle ?? formatCategorySlugToTitle(slug);
  const subCategories = subCatRes.subCategories ?? [];

  // 2. Fetch real DB products
  const productsRes = await getProductsByCategoryAction(slug);
  const realProducts = productsRes.products ?? [];

  // Use real DB products if available, fallback to mock products if 0 items in DB yet
  const displayProducts =
    realProducts.length > 0 ? realProducts : getMockProducts(slug);

  return (
    <main className="min-h-screen bg-white pb-16">
      {/* Category Header Banner */}
      <CategoryHeader title={categoryTitle} />

      {/* DB-fetched Sub-Categories Carousel */}
      <SubCategoryCarousel categorySlug={slug} subCategories={subCategories} />

      {/* Products Grid */}
      <ProductGrid
        products={displayProducts}
        emptyMessage={`No products found under ${categoryTitle}.`}
      />
    </main>
  );
}
