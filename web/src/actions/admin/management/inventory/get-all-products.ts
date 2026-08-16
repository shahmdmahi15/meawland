"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
import {
  Product,
  SubCategory,
  Brand,
  Variant,
  Attribute,
  StockEvent,
} from "@/generated/prisma/client";

export type ProductVariantWithAttributes = Variant & {
  attributes: Attribute[];
  stockEvents: StockEvent[];
  imageBase64?: string;
};

export type FullProduct = Product & {
  subCategory: SubCategory;
  brand: Brand | null;
  variants: ProductVariantWithAttributes[];
  stockEvents: StockEvent[];
  imageBase64?: string;
  galleryBase64?: string[];
  _count: {
    variants: number;
    stockEvents: number;
  };
};

export type InventoryMetrics = {
  totalProducts: number;
  simpleCount: number;
  variableCount: number;
  totalStockUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
  brandsCount: number;
};

export type GetAllProductsResult = {
  success: boolean;
  message: string;
  products?: FullProduct[];
  metrics?: InventoryMetrics;
};

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.error(`[Storage.GetBase64] Failed for key "${key}":`, error);
    return "";
  }
}

export async function getAllProductsAdminAction(): Promise<GetAllProductsResult> {
  try {
    const products = await db.product.findMany({
      include: {
        subCategory: true,
        brand: true,
        variants: {
          include: {
            attributes: true,
            stockEvents: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        stockEvents: {
          orderBy: {
            createdAt: "desc",
          },
          take: 25,
        },
        _count: {
          select: {
            variants: true,
            stockEvents: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    let totalStockUnits = 0;
    let simpleCount = 0;
    let variableCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    const categorySet = new Set<string>();
    const brandSet = new Set<string>();

    const productsWithImages: FullProduct[] = await Promise.all(
      products.map(async (product) => {
        categorySet.add(product.subCategory.category);
        if (product.brandId) brandSet.add(product.brandId);

        let productStock = 0;
        if (product.isVariable) {
          variableCount++;
          productStock = product.variants.reduce(
            (acc, v) => acc + (v.stock || 0),
            0,
          );
        } else {
          simpleCount++;
          productStock = product.stock ?? 0;
        }

        totalStockUnits += productStock;

        if (productStock === 0) {
          outOfStockCount++;
        } else if (productStock <= 5) {
          lowStockCount++;
        }

        // Resolve main image base64
        const imageBase64 = await safeGetImageBase64(product.image);

        // Resolve gallery base64
        const galleryBase64 = product.gallery
          ? await Promise.all(
              product.gallery.map((gKey) => safeGetImageBase64(gKey)),
            )
          : [];

        // Resolve variants images base64
        const variantsWithImages: ProductVariantWithAttributes[] =
          await Promise.all(
            product.variants.map(async (variant) => {
              const vBase64 = await safeGetImageBase64(variant.image);
              return {
                ...variant,
                imageBase64: vBase64,
                stockEvents: variant.stockEvents ?? [],
              };
            }),
          );

        return {
          ...product,
          imageBase64,
          galleryBase64,
          variants: variantsWithImages,
          stockEvents: product.stockEvents ?? [],
        };
      }),
    );

    const metrics: InventoryMetrics = {
      totalProducts: products.length,
      simpleCount,
      variableCount,
      totalStockUnits,
      lowStockCount,
      outOfStockCount,
      categoriesCount: categorySet.size,
      brandsCount: brandSet.size,
    };

    return {
      success: true,
      message: "Successfully fetched all products with inventory metrics.",
      products: productsWithImages,
      metrics,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Inventory.GetAllProducts]:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to retrieve products due to a server error.",
    };
  }
}
