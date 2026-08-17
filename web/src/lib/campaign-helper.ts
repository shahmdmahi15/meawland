import db from "@/lib/db";
import { DiscountType } from "@/generated/prisma/enums";

export type ProductCampaignBadge = {
  id: string;
  name: string;
  discount: string | null;
  discountType: DiscountType;
  badgeText: string;
};

export async function getActiveCampaigns() {
  try {
    const campaigns = await db.campaign.findMany({
      where: {
        endsAt: { gt: new Date() },
      },
      include: {
        products: { select: { id: true } },
        variants: { select: { id: true, productId: true } },
        comboProducts: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return campaigns.filter(
      (c) =>
        c.maxRedemptions === null || c.currentRedemptions < c.maxRedemptions,
    );
  } catch (error) {
    console.error("[GetActiveCampaigns] Error:", error);
    return [];
  }
}

export function matchProductCampaign(
  productId: string,
  variantIds: string[],
  activeCampaigns: Array<{
    id: string;
    name: string;
    discount: string | null;
    discountType: DiscountType;
    forAllProducts: boolean;
    products: Array<{ id: string }>;
    variants: Array<{ id: string; productId: string }>;
  }>,
): ProductCampaignBadge | null {
  for (const c of activeCampaigns) {
    const matchesAll = c.forAllProducts;
    const matchesProduct = c.products.some((p) => p.id === productId);
    const matchesVariant = c.variants.some(
      (v) => v.productId === productId || variantIds.includes(v.id),
    );

    if (matchesAll || matchesProduct || matchesVariant) {
      let badgeText = c.name;
      if (c.discountType === DiscountType.PERCENTAGE && c.discount) {
        badgeText = `${c.discount}% OFF • ${c.name}`;
      } else if (c.discountType === DiscountType.FIXED && c.discount) {
        badgeText = `৳${c.discount} OFF • ${c.name}`;
      } else if (c.discountType === DiscountType.FREE_DELIVERY) {
        badgeText = `Free Delivery • ${c.name}`;
      }

      return {
        id: c.id,
        name: c.name,
        discount: c.discount,
        discountType: c.discountType,
        badgeText,
      };
    }
  }
  return null;
}

export function matchComboCampaign(
  comboId: string,
  activeCampaigns: Array<{
    id: string;
    name: string;
    discount: string | null;
    discountType: DiscountType;
    forAllCombos: boolean;
    comboProducts: Array<{ id: string }>;
  }>,
): ProductCampaignBadge | null {
  for (const c of activeCampaigns) {
    const matchesAll = c.forAllCombos;
    const matchesCombo = c.comboProducts.some((cp) => cp.id === comboId);

    if (matchesAll || matchesCombo) {
      let badgeText = c.name;
      if (c.discountType === DiscountType.PERCENTAGE && c.discount) {
        badgeText = `${c.discount}% OFF • ${c.name}`;
      } else if (c.discountType === DiscountType.FIXED && c.discount) {
        badgeText = `৳${c.discount} OFF • ${c.name}`;
      } else if (c.discountType === DiscountType.FREE_DELIVERY) {
        badgeText = `Free Delivery • ${c.name}`;
      }

      return {
        id: c.id,
        name: c.name,
        discount: c.discount,
        discountType: c.discountType,
        badgeText,
      };
    }
  }
  return null;
}
