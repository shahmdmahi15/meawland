"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
import {
  getActiveCampaigns,
  matchComboCampaign,
  type ProductCampaignBadge,
} from "@/lib/campaign-helper";

export type StoreComboProduct = {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string;
  price: string;
  originalPrice?: string;
  numericPrice: number;
  numericOriginalPrice?: number;
  discountPercent?: number;
  savingsAmount?: number;
  campaignBadge?: ProductCampaignBadge | null;
  image: string;
  bundleStockCapacity: number;
  isAvailable: boolean;
  itemsCount: number;
  includedItems: Array<{
    id: string;
    name: string;
    image?: string;
    isVariant: boolean;
  }>;
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
      `[GetStoreComboProducts] Failed to load S3 image for key "${key}":`,
      error,
    );
    return fallback;
  }
}

export async function getStoreComboProductsAction(): Promise<{
  success: boolean;
  message: string;
  combos: StoreComboProduct[];
}> {
  try {
    const [dbCombos, activeCampaigns] = await Promise.all([
      db.comboProduct.findMany({
        include: {
          products: {
            select: {
              id: true,
              name: true,
              code: true,
              stock: true,
              regularPrice: true,
              salePrice: true,
              image: true,
              isVariable: true,
            },
          },
          variants: {
            select: {
              id: true,
              sku: true,
              stock: true,
              image: true,
              regularPrice: true,
              salePrice: true,
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      getActiveCampaigns(),
    ]);

    if (dbCombos.length === 0) {
      return {
        success: true,
        message: "No combo products found",
        combos: [],
      };
    }

    const combos: StoreComboProduct[] = await Promise.all(
      dbCombos.map(async (combo) => {
        // Base64 combo image
        const comboImage = await safeGetImageBase64(combo.image);

        // Compute original items pricing sum
        const productsPriceSum = combo.products.reduce((sum, p) => {
          const pPrice = parseFloat(p.regularPrice || p.salePrice || "0") || 0;
          return sum + pPrice;
        }, 0);

        const variantsPriceSum = combo.variants.reduce((sum, v) => {
          const vPrice = parseFloat(v.regularPrice || v.salePrice || "0") || 0;
          return sum + vPrice;
        }, 0);

        const totalOriginalPriceNum =
          productsPriceSum + variantsPriceSum > 0
            ? productsPriceSum + variantsPriceSum
            : parseFloat(combo.regularPrice || "0") || 0;

        const effectivePriceStr = combo.salePrice || combo.regularPrice || "0";
        const numericPrice = parseFloat(effectivePriceStr) || 0;

        const hasDiscount =
          totalOriginalPriceNum > numericPrice && numericPrice > 0;
        const discountPercent = hasDiscount
          ? Math.round(
              ((totalOriginalPriceNum - numericPrice) / totalOriginalPriceNum) *
                100,
            )
          : undefined;

        const savingsAmount = hasDiscount
          ? Math.round(totalOriginalPriceNum - numericPrice)
          : undefined;

        // Compute stock capacity
        const allStocks = [
          ...combo.products.map((p) => p.stock ?? 0),
          ...combo.variants.map((v) => v.stock),
        ];
        const bundleStockCapacity =
          allStocks.length > 0 ? Math.min(...allStocks) : 0;
        const isAvailable = bundleStockCapacity > 0;

        // Included items preview
        const includedItems = [
          ...combo.products.map((p) => ({
            id: p.id,
            name: p.name,
            image: p.image,
            isVariant: false,
          })),
          ...combo.variants.map((v) => ({
            id: v.id,
            name: `${v.product.name} (${v.sku})`,
            image: v.image,
            isVariant: true,
          })),
        ];

        const campaignBadge = matchComboCampaign(combo.id, activeCampaigns);

        const gallery = await Promise.all(
          (combo.gallery || []).map((g) => safeGetImageBase64(g)),
        );

        return {
          id: combo.id,
          name: combo.name,
          slug: combo.slug,
          code: combo.code,
          description: combo.shortDescription || combo.longDescription,
          price: `৳${numericPrice.toLocaleString()}`,
          originalPrice:
            totalOriginalPriceNum > 0
              ? `৳${totalOriginalPriceNum.toLocaleString()}`
              : undefined,
          numericPrice,
          numericOriginalPrice:
            totalOriginalPriceNum > 0 ? totalOriginalPriceNum : undefined,
          discountPercent,
          savingsAmount,
          campaignBadge,
          image: comboImage,
          gallery: gallery.filter(Boolean),
          bundleStockCapacity,
          isAvailable,
          itemsCount: combo.products.length + combo.variants.length,
          includedItems,
        };
      }),
    );

    return {
      success: true,
      message: `Successfully retrieved ${combos.length} combo products`,
      combos,
    };
  } catch (error) {
    console.error("[GetStoreComboProductsAction Error]:", error);
    return {
      success: false,
      message: "Failed to fetch combo products",
      combos: [],
    };
  }
}
