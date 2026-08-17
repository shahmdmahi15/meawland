"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
import {
  getActiveCampaigns,
  matchProductCampaign,
  type ProductCampaignBadge,
} from "@/lib/campaign-helper";

export type PurposeCategoryTab =
  "ALL" | "FASHION" | "ACCESSORIES" | "CARE" | "FOOD" | "TOYS";

export type StorePurposeProduct = {
  id: string;
  name: string;
  slug: string;
  code: string;
  sku: string;
  price: string;
  originalPrice?: string;
  numericPrice: number;
  numericOriginalPrice?: number;
  discountPercent?: number;
  campaignBadge?: ProductCampaignBadge | null;
  image: string;
  isVariable: boolean;
  stock: number;
  isStockOut: boolean;
  categoryEnum?: string;
  subCategoryName?: string;
  brandName?: string;
  purposeTag: "FASHION" | "ACCESSORIES" | "CARE" | "FOOD" | "TOYS" | "GENERAL";
};

async function safeGetImageBase64(
  key: string | null | undefined,
  fallback = "/fallback-product.png",
): Promise<string> {
  if (!key) return fallback;
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.warn(
      `[GetProductsByPurpose] Failed to load S3 image for key "${key}":`,
      error,
    );
    return fallback;
  }
}

function mapCategoryToPurpose(
  category?: string | null,
  subCatName?: string | null,
): "FASHION" | "ACCESSORIES" | "CARE" | "FOOD" | "TOYS" | "GENERAL" {
  if (!category) return "GENERAL";
  const cat = category.toUpperCase();
  const sub = (subCatName || "").toLowerCase();

  if (cat === "PET_DRESS" || sub.includes("dress") || sub.includes("gown")) {
    return "FASHION";
  }
  if (
    cat === "PET_ACCESSORIES" ||
    sub.includes("collar") ||
    sub.includes("harness") ||
    sub.includes("belt")
  ) {
    return "ACCESSORIES";
  }
  if (
    cat === "PET_CARE" ||
    cat === "PET_MEDICINE" ||
    sub.includes("shampoo") ||
    sub.includes("gel") ||
    sub.includes("care")
  ) {
    return "CARE";
  }
  if (
    cat === "PET_FOOD" ||
    sub.includes("food") ||
    sub.includes("treat") ||
    sub.includes("snack")
  ) {
    return "FOOD";
  }
  if (cat === "PET_TOY" || sub.includes("toy") || sub.includes("play")) {
    return "TOYS";
  }
  return "GENERAL";
}

export async function getProductsByPurposeAction(): Promise<{
  success: boolean;
  message: string;
  products: StorePurposeProduct[];
}> {
  try {
    const [dbProducts, activeCampaigns] = await Promise.all([
      db.product.findMany({
        take: 24,
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

    if (dbProducts.length === 0) {
      return {
        success: true,
        message: "No products in database",
        products: [],
      };
    }

    const products: StorePurposeProduct[] = await Promise.all(
      dbProducts.map(async (p) => {
        const base64Image = await safeGetImageBase64(p.image);

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

        const discountPercent =
          numericOriginalPrice && numericOriginalPrice > numericPrice
            ? Math.round(
                ((numericOriginalPrice - numericPrice) / numericOriginalPrice) *
                  100,
              )
            : undefined;

        const stock = p.isVariable
          ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
          : (p.stock ?? 0);

        const isStockOut = stock <= 0;

        const purposeTag = mapCategoryToPurpose(
          p.subCategory?.category,
          p.subCategory?.name,
        );

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
          discountPercent,
          campaignBadge,
          image: base64Image,
          isVariable: p.isVariable,
          stock,
          isStockOut,
          categoryEnum: p.subCategory?.category,
          subCategoryName: p.subCategory?.name,
          brandName: p.brand?.name,
          purposeTag,
        };
      }),
    );

    return {
      success: true,
      message: `Successfully retrieved ${products.length} purpose products`,
      products,
    };
  } catch (error) {
    console.error("[GetProductsByPurposeAction Error]:", error);
    return {
      success: false,
      message: "Failed to fetch purpose products",
      products: [],
    };
  }
}
