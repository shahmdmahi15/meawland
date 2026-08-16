import { Metadata } from "next";
import { getProductsByCategoryAction } from "@/actions/store/products/get-by-category";
import { getSubCategoriesByCategoryAction } from "@/actions/store/sub-categories/get-by-category";
import { formatCategorySlugToTitle } from "@/lib/category-helpers";
import { CategoryHeader } from "@/components/root/store/category-header";
import { SubCategoryPills } from "@/components/root/store/sub-category-pills";
import { ProductGrid } from "@/components/root/store/product-grid";

interface SubCategoryPageProps {
  params: Promise<{
    slug: string;
    subSlug: string;
  }>;
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: SubCategoryPageProps): Promise<Metadata> {
  const { slug, subSlug } = await params;
  const categoryTitle = formatCategorySlugToTitle(slug);
  const subCategoryTitle = formatCategorySlugToTitle(subSlug);

  return {
    title: `${subCategoryTitle} - ${categoryTitle} | Meawland`,
    description: `Shop the finest ${subCategoryTitle.toLowerCase()} under ${categoryTitle} with premium quality and best prices at Meawland.`,
    alternates: {
      canonical: `/category/${slug}/${subSlug}`,
    },
    openGraph: {
      title: `${subCategoryTitle} - ${categoryTitle} | Meawland`,
      description: `Shop the finest ${subCategoryTitle.toLowerCase()} under ${categoryTitle} with premium quality and best prices at Meawland.`,
      url: `/category/${slug}/${subSlug}`,
    },
  };
}

export default async function SubCategoryPage({
  params,
}: SubCategoryPageProps) {
  const { slug, subSlug } = await params;

  // 1. Fetch sub-categories for the category to render sibling pills
  const subCatRes = await getSubCategoriesByCategoryAction(slug);
  const categoryTitle =
    subCatRes.categoryTitle ?? formatCategorySlugToTitle(slug);
  const subCategories = subCatRes.subCategories ?? [];

  // 2. Fetch real DB products filtered by sub-category slug
  const productsRes = await getProductsByCategoryAction(slug, subSlug);
  const realProducts = productsRes.products ?? [];
  const subCategoryTitle =
    productsRes.subCategoryTitle ?? formatCategorySlugToTitle(subSlug);

  return (
    <main className="min-h-screen bg-white pb-20">
      {/* Sub-Category Header Banner */}
      <CategoryHeader
        title={subCategoryTitle}
        subtitle={`Explore our hand-picked selection of ${subCategoryTitle.toLowerCase()} under ${categoryTitle}.`}
        totalProducts={realProducts.length}
        parentCategory={{
          title: categoryTitle,
          slug,
        }}
      />

      {/* Sibling Sub-Categories Pills Navigation */}
      {subCategories.length > 0 && (
        <SubCategoryPills
          categorySlug={slug}
          subCategories={subCategories}
          activeSubSlug={subSlug}
        />
      )}

      {/* Real DB Products Grid & Interactive Explorer */}
      <ProductGrid
        products={realProducts}
        categoryTitle={subCategoryTitle}
        emptyMessage={`No products found under ${subCategoryTitle}.`}
      />
    </main>
  );
}
