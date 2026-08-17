"use server";

import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { getImageBase64 } from "@/lib/storage";
import {
  getActiveCampaigns,
  matchProductCampaign,
  matchComboCampaign,
  type ProductCampaignBadge,
} from "@/lib/campaign-helper";
import { DiscountType } from "@/generated/prisma/enums";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  addToCartSchema,
  updateCartItemQuantitySchema,
  removeCartItemSchema,
  type AddToCartInput,
  type UpdateCartItemQuantityInput,
  type RemoveCartItemInput,
} from "@/schemas/store/cart";
import {
  FREE_DELIVERY_THRESHOLD,
  CART_COOKIE_NAME,
  CART_COOKIE_MAX_AGE,
} from "@/constants/cart";

export type CartItemType = "PRODUCT" | "VARIANT" | "COMBO";

export type ProcessedCartItem = {
  id: string; // CartItem DB ID
  itemType: CartItemType;
  productId?: string | null;
  variantId?: string | null;
  comboProductId?: string | null;
  name: string;
  slug: string;
  image: string;
  variantAttributes?: Array<{ name: string; value: string }>;
  variantTitle?: string;
  comboBadge?: string;
  unitRegularPrice?: number;
  unitSalePrice?: number;
  unitPrice: number; // Effective unit price after product sale & item campaign
  unitOriginalPrice: number; // Regular price before discounts
  quantity: number;
  lineTotal: number; // unitPrice * quantity
  lineOriginalTotal: number; // unitOriginalPrice * quantity
  lineDiscount: number; // lineOriginalTotal - lineTotal
  stock: number;
  isOutOfStock: boolean;
  exceedsStock: boolean;
  campaignBadge?: ProductCampaignBadge | null;
  categoryName?: string | null;
  brandName?: string | null;
};

export type CartData = {
  id: string | null;
  isTemporary: boolean;
  items: ProcessedCartItem[];
  itemCount: number; // total units
  distinctCount: number; // total line items
  subtotal: number;
  originalSubtotal: number;
  totalDiscount: number;
  deliveryFee: number;
  isFreeDelivery: boolean;
  freeDeliveryThreshold: number;
  amountNeededForFreeDelivery: number;
  freeDeliveryProgress: number; // 0 to 100
  grandTotal: number;
  isCheckoutDisabled: boolean;
  checkoutDisableReason?: string;
};

async function safeGetImageBase64(
  key: string | null | undefined,
  fallback = "/fallback-product.png",
): Promise<string> {
  if (!key) return fallback;
  try {
    return await getImageBase64(key);
  } catch {
    return fallback;
  }
}

/**
 * Retrieves the active Cart record (either for authenticated user or guest via cookie).
 */
async function resolveActiveCart(createIfNotFound = false) {
  const user = await getMeAction();
  const cookieStore = await cookies();
  const guestCartId = cookieStore.get(CART_COOKIE_NAME)?.value;

  if (user) {
    // If guest cart exists, merge it into the user cart
    if (guestCartId) {
      await mergeGuestCartIntoUser(user.id, guestCartId);
    }

    let userCart = await db.cart.findUnique({
      where: { userId: user.id },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                subCategory: true,
                brand: true,
                variants: true,
              },
            },
            variant: {
              include: {
                product: {
                  include: {
                    subCategory: true,
                    brand: true,
                  },
                },
                attributes: true,
              },
            },
            comboProduct: {
              include: {
                products: true,
                variants: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!userCart && createIfNotFound) {
      userCart = await db.cart.create({
        data: {
          userId: user.id,
          isTemporary: false,
        },
        include: {
          cartItems: {
            include: {
              product: {
                include: {
                  subCategory: true,
                  brand: true,
                  variants: true,
                },
              },
              variant: {
                include: {
                  product: {
                    include: {
                      subCategory: true,
                      brand: true,
                    },
                  },
                  attributes: true,
                },
              },
              comboProduct: {
                include: {
                  products: true,
                  variants: true,
                },
              },
            },
          },
        },
      });
    }

    return { cart: userCart, isGuest: false, userId: user.id };
  }

  // Guest flow
  if (guestCartId) {
    const guestCart = await db.cart.findUnique({
      where: { id: guestCartId },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                subCategory: true,
                brand: true,
                variants: true,
              },
            },
            variant: {
              include: {
                product: {
                  include: {
                    subCategory: true,
                    brand: true,
                  },
                },
                attributes: true,
              },
            },
            comboProduct: {
              include: {
                products: true,
                variants: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (guestCart) {
      return { cart: guestCart, isGuest: true, userId: null };
    }
  }

  if (createIfNotFound) {
    const newGuestCart = await db.cart.create({
      data: {
        isTemporary: true,
      },
      include: {
        cartItems: {
          include: {
            product: {
              include: {
                subCategory: true,
                brand: true,
                variants: true,
              },
            },
            variant: {
              include: {
                product: {
                  include: {
                    subCategory: true,
                    brand: true,
                  },
                },
                attributes: true,
              },
            },
            comboProduct: {
              include: {
                products: true,
                variants: {
                  include: {
                    product: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    cookieStore.set(CART_COOKIE_NAME, newGuestCart.id, {
      maxAge: CART_COOKIE_MAX_AGE,
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });

    return { cart: newGuestCart, isGuest: true, userId: null };
  }

  return { cart: null, isGuest: true, userId: null };
}

/**
 * Merges a guest cart into a user's authenticated cart upon login.
 */
export async function mergeGuestCartIntoUser(
  userId: string,
  guestCartId: string,
) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(CART_COOKIE_NAME);

    const guestCart = await db.cart.findUnique({
      where: { id: guestCartId },
      include: { cartItems: true },
    });

    if (!guestCart || guestCart.cartItems.length === 0) {
      if (guestCart) {
        await db.cart.delete({ where: { id: guestCart.id } });
      }
      return;
    }

    const userCart = await db.cart.findUnique({
      where: { userId },
      include: { cartItems: true },
    });

    if (!userCart) {
      // Assign the guest cart directly to the user
      await db.cart.update({
        where: { id: guestCart.id },
        data: {
          userId,
          isTemporary: false,
        },
      });
      return;
    }

    // Merge items into userCart
    for (const item of guestCart.cartItems) {
      const existing = userCart.cartItems.find(
        (ci) =>
          ci.productId === item.productId &&
          ci.variantId === item.variantId &&
          ci.comboProductId === item.comboProductId,
      );

      if (existing) {
        await db.cartItem.update({
          where: { id: existing.id },
          data: {
            quanitity: existing.quanitity + item.quanitity,
          },
        });
      } else {
        await db.cartItem.create({
          data: {
            cartId: userCart.id,
            productId: item.productId,
            variantId: item.variantId,
            comboProductId: item.comboProductId,
            quanitity: item.quanitity,
          },
        });
      }
    }

    // Delete temporary guest cart
    await db.cart.delete({ where: { id: guestCart.id } });
  } catch (error) {
    console.error("[Cart.MergeGuestCartIntoUser] Error:", error);
  }
}

/**
 * Returns full cart calculations, line items, campaign discounts, and delivery metrics.
 */
export async function getCartAction(): Promise<CartData> {
  try {
    const { cart } = await resolveActiveCart(false);
    const activeCampaigns = await getActiveCampaigns();

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return {
        id: cart?.id || null,
        isTemporary: cart?.isTemporary ?? true,
        items: [],
        itemCount: 0,
        distinctCount: 0,
        subtotal: 0,
        originalSubtotal: 0,
        totalDiscount: 0,
        deliveryFee: 0,
        isFreeDelivery: false,
        freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
        amountNeededForFreeDelivery: FREE_DELIVERY_THRESHOLD,
        freeDeliveryProgress: 0,
        grandTotal: 0,
        isCheckoutDisabled: true,
        checkoutDisableReason: "Your cart is empty.",
      };
    }

    // Aggregate pooled demand and stock across all cart items (products, variants, and bundle contents)
    const productDemandMap = new Map<string, number>();
    const variantDemandMap = new Map<string, number>();
    const productStockMap = new Map<string, number>();
    const variantStockMap = new Map<string, number>();
    const productNames = new Map<string, string>();
    const variantNames = new Map<string, string>();

    for (const ci of cart.cartItems) {
      const q = ci.quanitity;
      if (ci.variant) {
        variantDemandMap.set(
          ci.variant.id,
          (variantDemandMap.get(ci.variant.id) || 0) + q,
        );
        variantStockMap.set(ci.variant.id, ci.variant.stock ?? 0);
        variantNames.set(
          ci.variant.id,
          ci.variant.product?.name
            ? `${ci.variant.product.name} (${ci.variant.sku})`
            : ci.variant.sku,
        );
      } else if (ci.product) {
        productDemandMap.set(
          ci.product.id,
          (productDemandMap.get(ci.product.id) || 0) + q,
        );
        productStockMap.set(ci.product.id, ci.product.stock ?? 0);
        productNames.set(ci.product.id, ci.product.name);
      } else if (ci.comboProduct) {
        for (const p of ci.comboProduct.products || []) {
          productDemandMap.set(p.id, (productDemandMap.get(p.id) || 0) + q);
          productStockMap.set(p.id, p.stock ?? 0);
          productNames.set(p.id, p.name);
        }
        for (const v of ci.comboProduct.variants || []) {
          variantDemandMap.set(v.id, (variantDemandMap.get(v.id) || 0) + q);
          variantStockMap.set(v.id, v.stock ?? 0);
          variantNames.set(
            v.id,
            v.product?.name ? `${v.product.name} (${v.sku})` : v.sku,
          );
        }
      }
    }

    const items: ProcessedCartItem[] = await Promise.all(
      cart.cartItems.map(async (ci) => {
        let name = "Unknown Item";
        let slug = "#";
        let imageKey: string | null = null;
        let unitOriginalPrice = 0;
        let unitSalePrice: number | undefined = undefined;
        let unitPrice = 0;
        let stock = 0;
        let itemType: CartItemType = "PRODUCT";
        let variantAttributes:
          Array<{ name: string; value: string }> | undefined = undefined;
        let variantTitle: string | undefined = undefined;
        let comboBadge: string | undefined = undefined;
        let campaignBadge: ProductCampaignBadge | null = null;
        let categoryName: string | null = null;
        let brandName: string | null = null;
        let isOutOfStock = false;
        let exceedsStock = false;

        if (ci.variant && ci.variant.product) {
          itemType = "VARIANT";
          name = ci.variant.product.name;
          slug = ci.variant.product.slug;
          imageKey = ci.variant.image || ci.variant.product.image;
          stock = ci.variant.stock ?? 0;
          isOutOfStock = stock <= 0;
          const totalDemanded = variantDemandMap.get(ci.variant.id) || 0;
          exceedsStock = totalDemanded > stock || ci.quanitity > stock;
          categoryName = ci.variant.product.subCategory?.category ?? null;
          brandName = ci.variant.product.brand?.name ?? null;

          const reg = parseFloat(ci.variant.regularPrice || "0");
          const sale = ci.variant.salePrice
            ? parseFloat(ci.variant.salePrice)
            : undefined;
          unitOriginalPrice = reg;
          unitSalePrice = sale;
          unitPrice = sale && sale > 0 ? sale : reg;

          variantAttributes = ci.variant.attributes?.map((a) => ({
            name: a.name,
            value: a.value,
          }));
          variantTitle = variantAttributes
            ?.map((a) =>
              a.value && a.value !== a.name ? `${a.name} (${a.value})` : a.name,
            )
            .join(" • ");

          campaignBadge = matchProductCampaign(
            ci.variant.product.id,
            [ci.variant.id],
            activeCampaigns,
            {
              categoryEnum: ci.variant.product.subCategory?.category,
              subCategoryId: ci.variant.product.subCategoryId,
              brandId: ci.variant.product.brandId,
            },
          );
        } else if (ci.product) {
          itemType = "PRODUCT";
          name = ci.product.name;
          slug = ci.product.slug;
          imageKey = ci.product.image;
          stock = ci.product.stock ?? 0;
          isOutOfStock = stock <= 0;
          const totalDemanded = productDemandMap.get(ci.product.id) || 0;
          exceedsStock = totalDemanded > stock || ci.quanitity > stock;
          categoryName = ci.product.subCategory?.category ?? null;
          brandName = ci.product.brand?.name ?? null;

          const reg = parseFloat(ci.product.regularPrice || "0");
          const sale = ci.product.salePrice
            ? parseFloat(ci.product.salePrice)
            : undefined;
          unitOriginalPrice = reg;
          unitSalePrice = sale;
          unitPrice = sale && sale > 0 ? sale : reg;

          campaignBadge = matchProductCampaign(
            ci.product.id,
            ci.product.variants.map((v) => v.id),
            activeCampaigns,
            {
              categoryEnum: ci.product.subCategory?.category,
              subCategoryId: ci.product.subCategoryId,
              brandId: ci.product.brandId,
            },
          );
        } else if (ci.comboProduct) {
          itemType = "COMBO";
          name = ci.comboProduct.name;
          slug = ci.comboProduct.slug;
          imageKey = ci.comboProduct.image;
          const productStocks =
            ci.comboProduct.products?.map((p) => p.stock ?? 0) ?? [];
          const variantStocks =
            ci.comboProduct.variants?.map((v) => v.stock ?? 0) ?? [];
          const allStocks = [...productStocks, ...variantStocks];
          stock = allStocks.length > 0 ? Math.min(...allStocks) : 0;
          isOutOfStock = stock <= 0;

          // Check if any bundled item's total pooled cart demand exceeds its stock
          const hasOverdemandItem =
            (ci.comboProduct.products || []).some(
              (p) => (productDemandMap.get(p.id) || 0) > (p.stock ?? 0),
            ) ||
            (ci.comboProduct.variants || []).some(
              (v) => (variantDemandMap.get(v.id) || 0) > (v.stock ?? 0),
            );
          exceedsStock = ci.quanitity > stock || hasOverdemandItem;
          comboBadge = "Bundle Deal";

          const reg = parseFloat(ci.comboProduct.regularPrice || "0");
          const sale = ci.comboProduct.salePrice
            ? parseFloat(ci.comboProduct.salePrice)
            : undefined;
          unitOriginalPrice = reg;
          unitSalePrice = sale;
          unitPrice = sale && sale > 0 ? sale : reg;

          campaignBadge = matchComboCampaign(
            ci.comboProduct.id,
            activeCampaigns,
          );
        }

        // Apply campaign discounts if active on item
        if (campaignBadge) {
          if (
            campaignBadge.discountType === DiscountType.PERCENTAGE &&
            campaignBadge.discount
          ) {
            const pct = parseFloat(campaignBadge.discount);
            if (!isNaN(pct) && pct > 0) {
              const discounted = unitPrice * (1 - pct / 100);
              unitPrice = Math.max(0, Math.round(discounted));
            }
          } else if (
            campaignBadge.discountType === DiscountType.FIXED &&
            campaignBadge.discount
          ) {
            const fixedOff = parseFloat(campaignBadge.discount);
            if (!isNaN(fixedOff) && fixedOff > 0) {
              unitPrice = Math.max(0, unitPrice - fixedOff);
            }
          }
        }

        const quantity = ci.quanitity;
        const lineTotal = unitPrice * quantity;
        const lineOriginalTotal = (unitOriginalPrice || unitPrice) * quantity;
        const lineDiscount = Math.max(0, lineOriginalTotal - lineTotal);

        const base64Image = await safeGetImageBase64(imageKey);

        return {
          id: ci.id,
          itemType,
          productId: ci.productId,
          variantId: ci.variantId,
          comboProductId: ci.comboProductId,
          name,
          slug,
          image: base64Image,
          variantAttributes,
          variantTitle,
          comboBadge,
          unitRegularPrice: unitOriginalPrice,
          unitSalePrice,
          unitPrice,
          unitOriginalPrice,
          quantity,
          lineTotal,
          lineOriginalTotal,
          lineDiscount,
          stock,
          isOutOfStock,
          exceedsStock,
          campaignBadge,
          categoryName,
          brandName,
        };
      }),
    );

    const itemCount = items.reduce((acc, i) => acc + i.quantity, 0);
    const distinctCount = items.length;
    const subtotal = items.reduce((acc, i) => acc + i.lineTotal, 0);
    const originalSubtotal = items.reduce(
      (acc, i) => acc + i.lineOriginalTotal,
      0,
    );
    const totalDiscount = Math.max(0, originalSubtotal - subtotal);
    // On cart page/drawer, grandTotal is subtotal (campaign discount applied).
    const grandTotal = subtotal;

    // Free delivery threshold metrics
    const hasFreeDeliveryCampaign = items.some(
      (i) => i.campaignBadge?.discountType === DiscountType.FREE_DELIVERY,
    );

    const isFreeDelivery =
      (subtotal >= FREE_DELIVERY_THRESHOLD && subtotal > 0) ||
      hasFreeDeliveryCampaign;

    const amountNeededForFreeDelivery = Math.max(
      0,
      FREE_DELIVERY_THRESHOLD - subtotal,
    );
    const freeDeliveryProgress = Math.min(
      100,
      Math.round((subtotal / FREE_DELIVERY_THRESHOLD) * 100),
    );

    const hasStockIssues = items.some((i) => i.isOutOfStock || i.exceedsStock);
    let checkoutDisableReason: string | undefined = undefined;

    if (items.length === 0) {
      checkoutDisableReason = "Your cart is empty.";
    } else if (hasStockIssues) {
      // Find the first overdemanded item name to give an explicit, helpful message
      const overdemandedProducts = Array.from(
        productDemandMap.entries(),
      ).filter(([id, demanded]) => demanded > (productStockMap.get(id) ?? 0));
      const overdemandedVariants = Array.from(
        variantDemandMap.entries(),
      ).filter(([id, demanded]) => demanded > (variantStockMap.get(id) ?? 0));

      if (overdemandedProducts.length > 0) {
        const [id, demanded] = overdemandedProducts[0];
        const name = productNames.get(id) || "Product";
        const available = productStockMap.get(id) ?? 0;
        checkoutDisableReason = `"${name}" exceeds stock (${demanded} requested across items & bundles, only ${available} available).`;
      } else if (overdemandedVariants.length > 0) {
        const [id, demanded] = overdemandedVariants[0];
        const name = variantNames.get(id) || "Variant";
        const available = variantStockMap.get(id) ?? 0;
        checkoutDisableReason = `"${name}" exceeds stock (${demanded} requested across items & bundles, only ${available} available).`;
      } else {
        checkoutDisableReason =
          "Some items in your cart are out of stock or exceed available quantity across your bundles.";
      }
    }

    return {
      id: cart.id,
      isTemporary: cart.isTemporary,
      items,
      itemCount,
      distinctCount,
      subtotal,
      originalSubtotal,
      totalDiscount,
      deliveryFee: 0,
      isFreeDelivery,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      amountNeededForFreeDelivery,
      freeDeliveryProgress,
      grandTotal,
      isCheckoutDisabled: items.length === 0 || hasStockIssues,
      checkoutDisableReason,
    };
  } catch (error) {
    console.error("[Action.Store.Cart.GetCart] Error:", error);
    return {
      id: null,
      isTemporary: true,
      items: [],
      itemCount: 0,
      distinctCount: 0,
      subtotal: 0,
      originalSubtotal: 0,
      totalDiscount: 0,
      deliveryFee: 0,
      isFreeDelivery: false,
      freeDeliveryThreshold: FREE_DELIVERY_THRESHOLD,
      amountNeededForFreeDelivery: FREE_DELIVERY_THRESHOLD,
      freeDeliveryProgress: 0,
      grandTotal: 0,
      isCheckoutDisabled: true,
      checkoutDisableReason: "Unable to load cart.",
    };
  }
}

/**
 * Adds a product, variant, or combo product to the active cart.
 */
export async function addToCartAction(input: AddToCartInput): Promise<{
  success: boolean;
  message: string;
  cart?: CartData;
}> {
  try {
    const parsed = addToCartSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid input data.",
      };
    }

    const { productId, variantId, comboProductId, quantity } = parsed.data;

    // Resolve or create cart to check current pooled demand
    const { cart } = await resolveActiveCart(true);
    if (!cart) {
      return { success: false, message: "Failed to initialize cart." };
    }

    // Build pooled demand from existing items in cart
    const productDemandMap = new Map<string, number>();
    const variantDemandMap = new Map<string, number>();

    for (const ci of cart.cartItems) {
      const q = ci.quanitity;
      if (ci.variantId) {
        variantDemandMap.set(
          ci.variantId,
          (variantDemandMap.get(ci.variantId) || 0) + q,
        );
      } else if (ci.productId) {
        productDemandMap.set(
          ci.productId,
          (productDemandMap.get(ci.productId) || 0) + q,
        );
      } else if (ci.comboProduct) {
        for (const p of ci.comboProduct.products || []) {
          productDemandMap.set(p.id, (productDemandMap.get(p.id) || 0) + q);
        }
        for (const v of ci.comboProduct.variants || []) {
          variantDemandMap.set(v.id, (variantDemandMap.get(v.id) || 0) + q);
        }
      }
    }

    // Validate available stock against pooled demand
    let itemName = "Item";

    if (variantId) {
      const variant = await db.variant.findUnique({
        where: { id: variantId },
        include: { product: true },
      });
      if (!variant) return { success: false, message: "Variant not found." };
      itemName = `${variant.product.name} (Variant)`;
      const stock = variant.stock ?? 0;
      if (stock <= 0) {
        return {
          success: false,
          message: `Sorry, "${itemName}" is currently out of stock.`,
        };
      }
      const currentDemanded = variantDemandMap.get(variant.id) || 0;
      if (currentDemanded + quantity > stock) {
        const canAdd = Math.max(0, stock - currentDemanded);
        return {
          success: false,
          message: `Cannot add more. Only ${stock} in stock (${currentDemanded} already reserved across cart items & bundles). You can add at most ${canAdd} more.`,
        };
      }
    } else if (productId) {
      const product = await db.product.findUnique({
        where: { id: productId },
      });
      if (!product) return { success: false, message: "Product not found." };
      itemName = product.name;
      const stock = product.stock ?? 0;
      if (stock <= 0) {
        return {
          success: false,
          message: `Sorry, "${itemName}" is currently out of stock.`,
        };
      }
      const currentDemanded = productDemandMap.get(product.id) || 0;
      if (currentDemanded + quantity > stock) {
        const canAdd = Math.max(0, stock - currentDemanded);
        return {
          success: false,
          message: `Cannot add more. Only ${stock} in stock (${currentDemanded} already reserved across cart items & bundles). You can add at most ${canAdd} more.`,
        };
      }
    } else if (comboProductId) {
      const combo = await db.comboProduct.findUnique({
        where: { id: comboProductId },
        include: {
          products: true,
          variants: {
            include: { product: true },
          },
        },
      });
      if (!combo)
        return { success: false, message: "Combo product not found." };
      itemName = combo.name;

      // Check bundled products stock limit
      for (const p of combo.products) {
        const pStock = p.stock ?? 0;
        const currentDemanded = productDemandMap.get(p.id) || 0;
        if (currentDemanded + quantity > pStock) {
          const canAdd = Math.max(0, pStock - currentDemanded);
          return {
            success: false,
            message: `Cannot add bundle "${combo.name}". Bundled item "${p.name}" has only ${pStock} units in stock (${currentDemanded} already in your cart). You can add at most ${canAdd} more bundle(s).`,
          };
        }
      }

      // Check bundled variants stock limit
      for (const v of combo.variants) {
        const vStock = v.stock ?? 0;
        const currentDemanded = variantDemandMap.get(v.id) || 0;
        if (currentDemanded + quantity > vStock) {
          const canAdd = Math.max(0, vStock - currentDemanded);
          const vName = v.product?.name
            ? `${v.product.name} (${v.sku})`
            : v.sku;
          return {
            success: false,
            message: `Cannot add bundle "${combo.name}". Bundled item "${vName}" has only ${vStock} units in stock (${currentDemanded} already in your cart). You can add at most ${canAdd} more bundle(s).`,
          };
        }
      }
    }

    // Check if item already exists in cart
    const existingItem = await db.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: productId || null,
        variantId: variantId || null,
        comboProductId: comboProductId || null,
      },
    });

    if (existingItem) {
      await db.cartItem.update({
        where: { id: existingItem.id },
        data: { quanitity: existingItem.quanitity + quantity },
      });
    } else {
      await db.cartItem.create({
        data: {
          cartId: cart.id,
          productId: productId || null,
          variantId: variantId || null,
          comboProductId: comboProductId || null,
          quanitity: quantity,
        },
      });
    }

    revalidatePath("/cart");
    revalidatePath("/");

    const updatedCart = await getCartAction();
    return {
      success: true,
      message: `Added ${itemName} to cart! 🐾`,
      cart: updatedCart,
    };
  } catch (error) {
    console.error("[Action.Store.Cart.AddToCart] Error:", error);
    return {
      success: false,
      message: "Failed to add item to cart. Please try again.",
    };
  }
}

/**
 * Updates the quantity of an item in the cart.
 */
export async function updateCartItemQuantityAction(
  input: UpdateCartItemQuantityInput,
): Promise<{
  success: boolean;
  message: string;
  cart?: CartData;
}> {
  try {
    const parsed = updateCartItemQuantitySchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message || "Invalid input.",
      };
    }

    const { cartItemId, quantity } = parsed.data;

    const cartItem = await db.cartItem.findUnique({
      where: { id: cartItemId },
      include: {
        cart: {
          include: {
            cartItems: {
              include: {
                product: true,
                variant: { include: { product: true } },
                comboProduct: {
                  include: {
                    products: true,
                    variants: { include: { product: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cartItem) {
      return { success: false, message: "Cart item not found." };
    }

    // Build pooled demand and stock maps under the proposed new quantity
    const productDemandMap = new Map<string, number>();
    const variantDemandMap = new Map<string, number>();
    const productStockMap = new Map<string, number>();
    const variantStockMap = new Map<string, number>();
    const productNames = new Map<string, string>();
    const variantNames = new Map<string, string>();

    for (const ci of cartItem.cart.cartItems) {
      const itemQty = ci.id === cartItemId ? quantity : ci.quanitity;

      if (ci.variant) {
        variantDemandMap.set(
          ci.variant.id,
          (variantDemandMap.get(ci.variant.id) || 0) + itemQty,
        );
        variantStockMap.set(ci.variant.id, ci.variant.stock ?? 0);
        variantNames.set(
          ci.variant.id,
          ci.variant.product?.name
            ? `${ci.variant.product.name} (${ci.variant.sku})`
            : ci.variant.sku,
        );
      } else if (ci.product) {
        productDemandMap.set(
          ci.product.id,
          (productDemandMap.get(ci.product.id) || 0) + itemQty,
        );
        productStockMap.set(ci.product.id, ci.product.stock ?? 0);
        productNames.set(ci.product.id, ci.product.name);
      } else if (ci.comboProduct) {
        for (const p of ci.comboProduct.products || []) {
          productDemandMap.set(
            p.id,
            (productDemandMap.get(p.id) || 0) + itemQty,
          );
          productStockMap.set(p.id, p.stock ?? 0);
          productNames.set(p.id, p.name);
        }
        for (const v of ci.comboProduct.variants || []) {
          variantDemandMap.set(
            v.id,
            (variantDemandMap.get(v.id) || 0) + itemQty,
          );
          variantStockMap.set(v.id, v.stock ?? 0);
          variantNames.set(
            v.id,
            v.product?.name ? `${v.product.name} (${v.sku})` : v.sku,
          );
        }
      }
    }

    // Validate proposed quantities against actual stock limits
    for (const [pId, demanded] of productDemandMap.entries()) {
      const stock = productStockMap.get(pId) ?? 0;
      if (demanded > stock) {
        const name = productNames.get(pId) || "Product";
        return {
          success: false,
          message: `Cannot update quantity. "${name}" has only ${stock} units in stock (${demanded} requested across items and bundles).`,
        };
      }
    }

    for (const [vId, demanded] of variantDemandMap.entries()) {
      const stock = variantStockMap.get(vId) ?? 0;
      if (demanded > stock) {
        const name = variantNames.get(vId) || "Variant";
        return {
          success: false,
          message: `Cannot update quantity. "${name}" has only ${stock} units in stock (${demanded} requested across items and bundles).`,
        };
      }
    }

    await db.cartItem.update({
      where: { id: cartItemId },
      data: { quanitity: quantity },
    });

    revalidatePath("/cart");
    const updatedCart = await getCartAction();

    return {
      success: true,
      message: "Cart updated.",
      cart: updatedCart,
    };
  } catch (error) {
    console.error("[Action.Store.Cart.UpdateQuantity] Error:", error);
    return {
      success: false,
      message: "Failed to update item quantity.",
    };
  }
}

/**
 * Removes an item from the cart.
 */
export async function removeCartItemAction(
  input: RemoveCartItemInput,
): Promise<{
  success: boolean;
  message: string;
  cart?: CartData;
}> {
  try {
    const parsed = removeCartItemSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, message: "Invalid input." };
    }

    await db.cartItem.delete({
      where: { id: parsed.data.cartItemId },
    });

    revalidatePath("/cart");
    const updatedCart = await getCartAction();

    return {
      success: true,
      message: "Item removed from cart.",
      cart: updatedCart,
    };
  } catch (error) {
    console.error("[Action.Store.Cart.RemoveItem] Error:", error);
    return {
      success: false,
      message: "Failed to remove item from cart.",
    };
  }
}

/**
 * Clears all items in the active cart.
 */
export async function clearCartAction(): Promise<{
  success: boolean;
  message: string;
  cart?: CartData;
}> {
  try {
    const { cart } = await resolveActiveCart(false);
    if (cart) {
      await db.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    revalidatePath("/cart");
    const updatedCart = await getCartAction();

    return {
      success: true,
      message: "Cart cleared.",
      cart: updatedCart,
    };
  } catch (error) {
    console.error("[Action.Store.Cart.ClearCart] Error:", error);
    return {
      success: false,
      message: "Failed to clear cart.",
    };
  }
}
