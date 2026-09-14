"use server";

import db from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
import {
  getActiveCampaigns,
  matchProductCampaign,
  type ProductCampaignBadge,
} from "@/lib/campaign-helper";

export type StoreBrandProduct = {
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
  subCategoryName?: string;
  brandName?: string;
  brandSlug?: string;
};

function resolveBrandImage(
  key: string | null | undefined,
  fallback = "/fallback-product.png",
): string {
  return getPublicUrl(key, fallback);
}

export async function getProductsByBrandSlugAction(
  brandSlug = "meawland",
): Promise<{
  success: boolean;
  message: string;
  brand?: {
    id: string;
    name: string;
    slug: string;
    image: string;
  };
  products: StoreBrandProduct[];
}> {
  try {
    // 1. Look up brand by slug (case-insensitive)
    const brand = await db.brand.findFirst({
      where: {
        OR: [
          { slug: { equals: brandSlug, mode: "insensitive" } },
          { name: { equals: brandSlug, mode: "insensitive" } },
        ],
      },
    });

    if (!brand) {
      return {
        success: true,
        message: "Brand not found",
        products: [],
      };
    }

    // 2. Fetch products and active campaigns
    const [dbProducts, activeCampaigns] = await Promise.all([
      db.product.findMany({
        where: {
          brandId: brand.id,
        },
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
        message: "No products found for this brand",
        brand: {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
          image: resolveBrandImage(brand.image, "/brand-placeholder.png"),
        },
        products: [],
      };
    }

    // 3. Process products with proper prices, images, and discounts
    const products: StoreBrandProduct[] = dbProducts.map((p) => {
      const image = resolveBrandImage(p.image);

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
        image,
        isVariable: p.isVariable,
        stock,
        subCategoryName: p.subCategory?.name,
        brandName: p.brand?.name || brand.name,
        brandSlug: p.brand?.slug || brand.slug,
      };
    });

    return {
      success: true,
      message: `Successfully retrieved ${products.length} products for brand ${brand.name}`,
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        image: resolveBrandImage(brand.image, "/brand-placeholder.png"),
      },
      products,
    };
  } catch (error) {
    console.error("[GetProductsByBrandSlugAction Error]:", error);
    return {
      success: false,
      message: "Failed to fetch brand products",
      products: [],
    };
  }
}
