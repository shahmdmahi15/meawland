"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { getImageBase64 } from "@/lib/storage";
import {
  getActiveCampaigns,
  matchProductCampaign,
  type ProductCampaignBadge,
} from "@/lib/campaign-helper";

export type WishlistProductItem = {
  id: string;
  name: string;
  slug: string;
  code: string;
  sku: string;
  shortDescription?: string | null;
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
  subCategoryName?: string | null;
  brandName?: string | null;
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
      `[Wishlist.safeGetImageBase64] Failed for key "${key}":`,
      error,
    );
    return fallback;
  }
}

export async function getWishlistAction(): Promise<{
  success: boolean;
  unauthorized?: boolean;
  message?: string;
  products?: WishlistProductItem[];
  count?: number;
}> {
  try {
    const current = await getMeAction();
    if (!current) {
      return {
        success: false,
        unauthorized: true,
        message: "Please log in to view your wishlist.",
      };
    }

    const [wishlist, activeCampaigns] = await Promise.all([
      db.wishlist.findUnique({
        where: { userId: current.id },
        include: {
          products: {
            include: {
              subCategory: true,
              brand: true,
              variants: {
                orderBy: { createdAt: "asc" },
              },
            },
            orderBy: { createdAt: "desc" },
          },
        },
      }),
      getActiveCampaigns(),
    ]);

    if (!wishlist || !wishlist.products || wishlist.products.length === 0) {
      return {
        success: true,
        products: [],
        count: 0,
      };
    }

    const products: WishlistProductItem[] = await Promise.all(
      wishlist.products.map(async (p) => {
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
            originalPrice = `${p.regularPrice} tk`;
            numericOriginalPrice = parseFloat(p.regularPrice || "0");
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
          shortDescription: p.shortDescription,
          price,
          originalPrice,
          numericPrice,
          numericOriginalPrice,
          discountPercent,
          campaignBadge: campaignBadge ?? undefined,
          image: base64Image || "/fallback-product.png",
          isVariable: p.isVariable,
          stock,
          isStockOut,
          subCategoryName: p.subCategory?.name,
          brandName: p.brand?.name ?? null,
        };
      }),
    );

    return {
      success: true,
      products,
      count: products.length,
    };
  } catch (error) {
    console.error("[Action.Store.Wishlist.GetWishlist]:", error);
    return {
      success: false,
      message: "Failed to load your wishlist. Please try again.",
      products: [],
      count: 0,
    };
  }
}

export async function getWishlistProductIdsAction(): Promise<string[]> {
  try {
    const current = await getMeAction();
    if (!current) return [];

    const wishlist = await db.wishlist.findUnique({
      where: { userId: current.id },
      select: {
        products: {
          select: { id: true },
        },
      },
    });

    return wishlist?.products.map((p) => p.id) ?? [];
  } catch (error) {
    console.error("[Action.Store.Wishlist.GetProductIds]:", error);
    return [];
  }
}

export async function toggleWishlistAction(productId: string): Promise<{
  success: boolean;
  unauthorized?: boolean;
  isWishlisted?: boolean;
  message: string;
}> {
  try {
    const current = await getMeAction();
    if (!current) {
      return {
        success: false,
        unauthorized: true,
        message: "Please log in to save items to your wishlist.",
      };
    }

    const wishlist = await db.wishlist.findUnique({
      where: { userId: current.id },
      include: { products: { select: { id: true } } },
    });

    if (!wishlist) {
      await db.wishlist.create({
        data: {
          userId: current.id,
          products: { connect: { id: productId } },
        },
      });

      revalidatePath("/wishlist");
      revalidatePath("/account/wishlist");
      return {
        success: true,
        isWishlisted: true,
        message: "Added to Wishlist! ❤️",
      };
    }

    const isAlready = wishlist.products.some((p) => p.id === productId);

    if (isAlready) {
      await db.wishlist.update({
        where: { userId: current.id },
        data: {
          products: {
            disconnect: { id: productId },
          },
        },
      });

      revalidatePath("/wishlist");
      revalidatePath("/account/wishlist");
      return {
        success: true,
        isWishlisted: false,
        message: "Removed from Wishlist",
      };
    } else {
      await db.wishlist.update({
        where: { userId: current.id },
        data: {
          products: {
            connect: { id: productId },
          },
        },
      });

      revalidatePath("/wishlist");
      revalidatePath("/account/wishlist");
      return {
        success: true,
        isWishlisted: true,
        message: "Added to Wishlist! ❤️",
      };
    }
  } catch (error) {
    console.error("[Action.Store.Wishlist.Toggle]:", error);
    return {
      success: false,
      message: "An error occurred while updating your wishlist.",
    };
  }
}

export async function removeFromWishlistAction(productId: string): Promise<{
  success: boolean;
  unauthorized?: boolean;
  message: string;
}> {
  try {
    const current = await getMeAction();
    if (!current) {
      return {
        success: false,
        unauthorized: true,
        message: "Please log in to manage your wishlist.",
      };
    }

    await db.wishlist.update({
      where: { userId: current.id },
      data: {
        products: {
          disconnect: { id: productId },
        },
      },
    });

    revalidatePath("/wishlist");
    revalidatePath("/account/wishlist");
    return {
      success: true,
      message: "Item removed from wishlist.",
    };
  } catch (error) {
    console.error("[Action.Store.Wishlist.Remove]:", error);
    return {
      success: false,
      message: "Failed to remove item from wishlist.",
    };
  }
}

export async function clearWishlistAction(): Promise<{
  success: boolean;
  unauthorized?: boolean;
  message: string;
}> {
  try {
    const current = await getMeAction();
    if (!current) {
      return {
        success: false,
        unauthorized: true,
        message: "Please log in to clear your wishlist.",
      };
    }

    await db.wishlist.update({
      where: { userId: current.id },
      data: {
        products: {
          set: [],
        },
      },
    });

    revalidatePath("/wishlist");
    revalidatePath("/account/wishlist");
    return {
      success: true,
      message: "Your wishlist has been cleared.",
    };
  } catch (error) {
    console.error("[Action.Store.Wishlist.Clear]:", error);
    return {
      success: false,
      message: "Failed to clear wishlist.",
    };
  }
}
