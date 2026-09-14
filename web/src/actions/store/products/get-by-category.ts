"use server";

import db from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
import { getCategoryBySlug } from "@/lib/category-helpers";
import {
  getActiveCampaigns,
  matchProductCampaign,
  type ProductCampaignBadge,
} from "@/lib/campaign-helper";

export type CategoryStoreProduct = {
  id: string;
  name: string;
  slug: string;
  code: string;
  sku: string;
  price: string;
  originalPrice?: string;
  numericPrice: number;
  numericOriginalPrice?: number;
  campaignBadge?: ProductCampaignBadge | null;
  image: string;
  isVariable: boolean;
  stock: number;
  shortDescription?: string;
  subCategoryName: string;
  subCategorySlug: string;
  categorySlug: string;
  brandName?: string;
};

function resolveProductImage(
  key: string | null | undefined,
  fallback = "/fallback-product.png",
): string {
  return getPublicUrl(key, fallback);
}

export async function getProductsByCategoryAction(
  categorySlug: string,
  subCategorySlug?: string,
): Promise<{
  success: boolean;
  message: string;
  categoryTitle?: string;
  subCategoryTitle?: string;
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
      ? {
          subCategory: {
            slug: subCategorySlug,
            category: categoryInfo.enumValue,
          },
        }
      : { subCategory: { category: categoryInfo.enumValue } };

    const [dbProducts, activeCampaigns] = await Promise.all([
      db.product.findMany({
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
      }),
      getActiveCampaigns(),
    ]);

    let foundSubCategoryTitle: string | undefined = undefined;
    if (subCategorySlug && dbProducts.length > 0) {
      foundSubCategoryTitle = dbProducts[0].subCategory.name;
    } else if (subCategorySlug) {
      const sc = await db.subCategory.findFirst({
        where: { slug: subCategorySlug, category: categoryInfo.enumValue },
        select: { name: true },
      });
      foundSubCategoryTitle = sc?.name;
    }

    const products: CategoryStoreProduct[] = dbProducts.map((p) => {
      const image = resolveProductImage(p.image);

      let price = "0 tk";
      let originalPrice: string | undefined = undefined;
      let numericPrice = 0;
      let numericOriginalPrice: number | undefined = undefined;

      if (p.isVariable && p.variants.length > 0) {
        const firstVariant = p.variants[0];
        const hasSale =
          firstVariant.salePrice &&
          firstVariant.salePrice !== firstVariant.regularPrice;

        if (hasSale) {
          price = `${firstVariant.salePrice} tk`;
          originalPrice = `${firstVariant.regularPrice} tk`;
          numericPrice = parseFloat(firstVariant.salePrice || "0");
          numericOriginalPrice = parseFloat(firstVariant.regularPrice || "0");
        } else if (firstVariant.regularPrice) {
          price = `${firstVariant.regularPrice} tk`;
          numericPrice = parseFloat(firstVariant.regularPrice || "0");
        }
      } else {
        const hasSale = p.salePrice && p.salePrice !== p.regularPrice;

        if (hasSale) {
          price = `${p.salePrice} tk`;
          numericPrice = parseFloat(p.salePrice || "0");
          if (p.regularPrice) {
            originalPrice = `${p.regularPrice} tk`;
            numericOriginalPrice = parseFloat(p.regularPrice || "0");
          }
        } else if (p.regularPrice) {
          price = `${p.regularPrice} tk`;
          numericPrice = parseFloat(p.regularPrice || "0");
        }
      }

      const stock = p.isVariable
        ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
        : (p.stock ?? 0);

      const campaignBadge = matchProductCampaign(
        p.id,
        p.variants.map((v) => v.id),
        activeCampaigns,
      );

      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        code: p.code,
        sku: p.sku,
        price,
        originalPrice,
        numericPrice,
        numericOriginalPrice,
        campaignBadge,
        image,
        isVariable: p.isVariable,
        stock,
        shortDescription: p.shortDescription,
        subCategoryName: p.subCategory.name,
        subCategorySlug: p.subCategory.slug,
        categorySlug,
        brandName: p.brand?.name,
      };
    });

    return {
      success: true,
      message: "Successfully fetched products",
      categoryTitle: categoryInfo.title,
      subCategoryTitle: foundSubCategoryTitle,
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
