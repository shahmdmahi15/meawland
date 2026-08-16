import { Metadata } from "next";
import { getSubCategoriesByCategoryAction } from "@/actions/store/sub-categories/get-by-category";
import { getProductsByCategoryAction } from "@/actions/store/products/get-by-category";
import { getMockProducts } from "@/lib/mock-products";
import { formatCategorySlugToTitle } from "@/lib/category-helpers";
import { CategoryHeader } from "@/components/root/store/category-header";
import { SubCategoryCarousel } from "@/components/root/store/sub-category-carousel";
import { SubCategoryPills } from "@/components/root/store/sub-category-pills";
import { ProductGrid } from "@/components/root/store/product-grid";

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categoryTitle = formatCategorySlugToTitle(slug);
  return {
    title: `${categoryTitle} | Meawland Pet Store`,
    description: `Explore premium ${categoryTitle} products for your beloved pets at Meawland with fast delivery across Bangladesh.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  // 1. Fetch sub-categories for carousel and pills
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
    <main className="min-h-screen bg-white pb-20">
      {/* Category Header Banner */}
      <CategoryHeader
        title={categoryTitle}
        subtitle={`Discover top-quality ${categoryTitle.toLowerCase()} products, trusted by pet lovers across Bangladesh.`}
        totalProducts={displayProducts.length}
      />

      {/* Sub-Categories Carousel (Organic blob slider) */}
      {subCategories.length > 0 && (
        <SubCategoryCarousel
          categorySlug={slug}
          subCategories={subCategories}
        />
      )}

      {/* Sub-Categories Navigation Pills Bar */}
      {subCategories.length > 0 && (
        <SubCategoryPills categorySlug={slug} subCategories={subCategories} />
      )}

      {/* Interactive Products Grid & Explorer */}
      <ProductGrid
        products={displayProducts}
        categoryTitle={categoryTitle}
        emptyMessage={`No products found under ${categoryTitle}.`}
      />
    </main>
  );
}
