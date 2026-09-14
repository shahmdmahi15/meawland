"use server";

import db from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
import {
  getActiveCampaigns,
  matchComboCampaign,
  type ProductCampaignBadge,
} from "@/lib/campaign-helper";

export type StoreComboIncludedItem = {
  id: string;
  name: string;
  image?: string;
  isVariant: boolean;
  sku?: string;
  regularPrice?: string | null;
  salePrice?: string | null;
};

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
  gallery: string[];
  bundleStockCapacity: number;
  isAvailable: boolean;
  itemsCount: number;
  includedItems: StoreComboIncludedItem[];
  createdAt: string;
};

export type StoreComboFilterMeta = {
  minPrice: number;
  maxPrice: number;
  totalCombos: number;
  inStockCount: number;
  outOfStockCount: number;
  availableCampaigns: string[];
};

function resolveComboImage(
  key: string | null | undefined,
  fallback = "/fallback-product.png",
): string {
  return getPublicUrl(key, fallback);
}

/**
 * Retrieves all active combo products with full pricing, stock capacity, bundled contents, and filter meta.
 */
export async function getAllStoreComboProductsAction(): Promise<{
  success: boolean;
  message: string;
  combos: StoreComboProduct[];
  meta: StoreComboFilterMeta;
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
        meta: {
          minPrice: 0,
          maxPrice: 0,
          totalCombos: 0,
          inStockCount: 0,
          outOfStockCount: 0,
          availableCampaigns: [],
        },
      };
    }

    const combos: StoreComboProduct[] = dbCombos.map((combo) => {
      // S3 URL combo image
      const comboImage = resolveComboImage(combo.image);

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
      const includedItems: StoreComboIncludedItem[] = [
        ...combo.products.map((p) => ({
          id: p.id,
          name: p.name,
          image: resolveComboImage(p.image),
          isVariant: false,
          regularPrice: p.regularPrice,
          salePrice: p.salePrice,
        })),
        ...combo.variants.map((v) => ({
          id: v.id,
          name: `${v.product.name} (${v.sku})`,
          image: resolveComboImage(v.image),
          isVariant: true,
          sku: v.sku,
          regularPrice: v.regularPrice,
          salePrice: v.salePrice,
        })),
      ];

      const campaignBadge = matchComboCampaign(combo.id, activeCampaigns);

      const gallery = (combo.gallery || []).map((g) => resolveComboImage(g));

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
        createdAt: combo.createdAt.toISOString(),
      };
    });

    // Compute meta stats
    const numericPrices = combos
      .map((c) => c.numericPrice)
      .filter((p) => p > 0);
    const minPrice = numericPrices.length > 0 ? Math.min(...numericPrices) : 0;
    const maxPrice = numericPrices.length > 0 ? Math.max(...numericPrices) : 0;
    const inStockCount = combos.filter((c) => c.isAvailable).length;
    const outOfStockCount = combos.length - inStockCount;

    const campaignSet = new Set<string>();
    for (const c of combos) {
      if (c.campaignBadge?.badgeText) {
        campaignSet.add(c.campaignBadge.badgeText);
      }
    }

    return {
      success: true,
      message: `Successfully retrieved ${combos.length} combo products`,
      combos,
      meta: {
        minPrice,
        maxPrice,
        totalCombos: combos.length,
        inStockCount,
        outOfStockCount,
        availableCampaigns: Array.from(campaignSet),
      },
    };
  } catch (error) {
    if ((error as { digest?: string })?.digest === "DYNAMIC_SERVER_USAGE") {
      throw error;
    }
    console.error("[GetAllStoreComboProductsAction Error]:", error);
    return {
      success: false,
      message: "Failed to fetch combo products",
      combos: [],
      meta: {
        minPrice: 0,
        maxPrice: 0,
        totalCombos: 0,
        inStockCount: 0,
        outOfStockCount: 0,
        availableCampaigns: [],
      },
    };
  }
}

/**
 * Backwards compatibility helper for existing components.
 */
export async function getStoreComboProductsAction(): Promise<{
  success: boolean;
  message: string;
  combos: StoreComboProduct[];
}> {
  const result = await getAllStoreComboProductsAction();
  return {
    success: result.success,
    message: result.message,
    combos: result.combos,
  };
}
