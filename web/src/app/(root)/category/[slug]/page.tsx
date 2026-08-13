import { notFound } from "next/navigation";
import { getSubCategoriesByCategoryAction } from "@/actions/store/sub-categories/get-by-category";
import { getMockProducts } from "@/lib/mock-products";
import { formatCategorySlugToTitle } from "@/lib/category-helpers";
import { CategoryHeader } from "@/components/store/category-header";
import { SubCategoryCarousel } from "@/components/store/sub-category-carousel";
import { ProductGrid } from "@/components/store/product-grid";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const res = await getSubCategoriesByCategoryAction(slug);

  const categoryTitle = res.categoryTitle ?? formatCategorySlugToTitle(slug);

  const subCategories = res.subCategories ?? [];

  const mockProducts = getMockProducts(slug);

  return (
    <main className="min-h-screen bg-white pb-16">
      {/* Category Header Banner */}
      <CategoryHeader title={categoryTitle} />

      {/* Actual DB-fetched Sub-Categories Carousel */}
      <SubCategoryCarousel categorySlug={slug} subCategories={subCategories} />

      {/* Mock Products Grid */}
      <ProductGrid products={mockProducts} />
    </main>
  );
}
