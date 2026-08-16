"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";

export type StoreBestsellerProduct = {
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
  image: string;
  isVariable: boolean;
  stock: number;
  subCategoryName?: string;
  brandName?: string;
  brandSlug?: string;
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
      `[GetBestsellerProducts] Failed to load S3 image for key "${key}":`,
      error,
    );
    return fallback;
  }
}

export async function getBestsellerProductsAction(): Promise<{
  success: boolean;
  message: string;
  products: StoreBestsellerProduct[];
}> {
  try {
    // 1. Fetch available products from DB
    const dbProducts = await db.product.findMany({
      take: 12,
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

    if (dbProducts.length === 0) {
      return {
        success: true,
        message: "No products in database",
        products: [],
      };
    }

    // 2. Shuffle / sample products for a dynamic bestseller feel
    const shuffled = [...dbProducts].sort(() => 0.5 - Math.random());

    // 3. Process products
    const products: StoreBestsellerProduct[] = await Promise.all(
      shuffled.map(async (p) => {
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
          image: base64Image,
          isVariable: p.isVariable,
          stock,
          subCategoryName: p.subCategory?.name,
          brandName: p.brand?.name,
          brandSlug: p.brand?.slug,
        };
      }),
    );

    return {
      success: true,
      message: `Successfully retrieved ${products.length} bestseller products`,
      products,
    };
  } catch (error) {
    console.error("[GetBestsellerProductsAction Error]:", error);
    return {
      success: false,
      message: "Failed to fetch bestsellers",
      products: [],
    };
  }
}
