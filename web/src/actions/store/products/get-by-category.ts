"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
import { getCategoryBySlug } from "@/lib/category-helpers";

export type CategoryStoreProduct = {
  id: string;
  name: string;
  slug: string;
  code: string;
  sku: string;
  price: string;
  originalPrice?: string;
  image: string;
  isVariable: boolean;
  subCategoryName: string;
  subCategorySlug: string;
  categorySlug: string;
  brandName?: string;
};

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "/fallback-product.png";
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.warn(
      `[GetProductsByCategory] Failed to load S3 image for key "${key}":`,
      error,
    );
    return "/fallback-product.png";
  }
}

export async function getProductsByCategoryAction(
  categorySlug: string,
  subCategorySlug?: string,
): Promise<{
  success: boolean;
  message: string;
  categoryTitle?: string;
  products: CategoryStoreProduct[];
}> {
  try {
    const categoryInfo = getCategoryBySlug(categorySlug);
    if (!categoryInfo) {
      return {
        success: false,
        message: "Category not found",
        products: [],
      };
    }

    const whereCondition = subCategorySlug
      ? { subCategory: { slug: subCategorySlug } }
      : { subCategory: { category: categoryInfo.enumValue } };

    const dbProducts = await db.product.findMany({
      where: whereCondition,
      include: {
        subCategory: true,
        brand: true,
        variants: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const products: CategoryStoreProduct[] = await Promise.all(
      dbProducts.map(async (p) => {
        const base64Image = await safeGetImageBase64(p.image);

        let price = "0 tk";
        let originalPrice: string | undefined = undefined;

        if (p.isVariable && p.variants.length > 0) {
          const firstVariant = p.variants[0];
          if (
            firstVariant.salePrice &&
            firstVariant.salePrice !== firstVariant.regularPrice
          ) {
            price = `${firstVariant.salePrice} tk`;
            originalPrice = `${firstVariant.regularPrice} tk`;
          } else if (firstVariant.regularPrice) {
            price = `${firstVariant.regularPrice} tk`;
          }
        } else {
          if (p.salePrice && p.salePrice !== p.regularPrice) {
            price = `${p.salePrice} tk`;
            if (p.regularPrice) {
              originalPrice = `${p.regularPrice} tk`;
            }
          } else if (p.regularPrice) {
            price = `${p.regularPrice} tk`;
          }
        }

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          code: p.code,
          sku: p.sku,
          price,
          originalPrice,
          image: base64Image,
          isVariable: p.isVariable,
          subCategoryName: p.subCategory.name,
          subCategorySlug: p.subCategory.slug,
          categorySlug,
          brandName: p.brand?.name,
        };
      }),
    );

    return {
      success: true,
      message: "Successfully fetched products",
      categoryTitle: categoryInfo.title,
      products,
    };
  } catch (error) {
    console.error("[Action.Store.Products.GetByCategory]:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch products due to a server error",
      products: [],
    };
  }
}
