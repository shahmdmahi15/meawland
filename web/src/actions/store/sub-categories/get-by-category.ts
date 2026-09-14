"use server";

import db from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
import { getCategoryBySlug } from "@/lib/category-helpers";

export type StoreSubCategory = {
  id: string;
  name: string;
  slug: string;
  image: string;
  category: string;
  productCount: number;
};

export async function getSubCategoriesByCategoryAction(
  categorySlug: string,
): Promise<{
  success: boolean;
  message: string;
  categoryTitle?: string;
  subCategories: StoreSubCategory[];
}> {
  try {
    const categoryInfo = getCategoryBySlug(categorySlug);
    if (!categoryInfo) {
      return {
        success: false,
        message: "Category not found",
        subCategories: [],
      };
    }

    const subCategories = await db.subCategory.findMany({
      where: {
        category: categoryInfo.enumValue,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const subCategoriesWithImage = subCategories.map((subCat) => ({
      id: subCat.id,
      name: subCat.name,
      slug: subCat.slug,
      image: getPublicUrl(subCat.image, "/fallback-slider.webp"),
      category: subCat.category,
      productCount: subCat._count.products,
    }));

    return {
      success: true,
      message: "Successfully retrieved sub-categories",
      categoryTitle: categoryInfo.title,
      subCategories: subCategoriesWithImage,
    };
  } catch (error) {
    console.error("[GetSubCategoriesByCategory Action Error]:", error);
    return {
      success: false,
      message: "Failed to fetch sub-categories",
      subCategories: [],
    };
  }
}
