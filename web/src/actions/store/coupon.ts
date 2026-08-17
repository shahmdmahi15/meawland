"use server";

import db from "@/lib/db";
import { DiscountType } from "@/generated/prisma/enums";
import {
  validateCouponCartSchema,
  ValidateCouponCartInput,
} from "@/schemas/admin/management/offers/coupon";

export type CouponValidationResult = {
  isValid: boolean;
  message: string;
  coupon?: {
    id: string;
    name: string;
    couponCode: string;
    discountType: DiscountType;
    discountValue: number;
    discountAmount: number;
    isFreeDelivery: boolean;
    finalSubtotal: number;
  };
};

export async function validateStoreCouponAction(
  rawInput: ValidateCouponCartInput,
): Promise<CouponValidationResult> {
  try {
    const parsed = validateCouponCartSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        isValid: false,
        message: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const {
      code,
      subtotal,
      userId,
      productIds,
      variantIds,
      comboProductIds,
      totalItemsCount,
    } = parsed.data;

    const coupon = await db.coupon.findFirst({
      where: {
        couponCode: {
          equals: code.trim(),
          mode: "insensitive",
        },
      },
      include: {
        users: { select: { id: true } },
        products: { select: { id: true } },
        variants: { select: { id: true } },
        comboProducts: { select: { id: true } },
      },
    });

    if (!coupon) {
      return {
        isValid: false,
        message: "Invalid coupon code. Please check and try again.",
      };
    }

    // Check expiration
    if (new Date(coupon.expiresAt).getTime() < Date.now()) {
      return {
        isValid: false,
        message: "This coupon code has expired.",
      };
    }

    // Check redemption limit
    if (
      coupon.maxRedemptions !== null &&
      coupon.currentRedemptions >= coupon.maxRedemptions
    ) {
      return {
        isValid: false,
        message: "This coupon has reached its maximum redemption limit.",
      };
    }

    // Check user restriction
    if (!coupon.forAllUsers) {
      if (!userId) {
        return {
          isValid: false,
          message: "Please log in to your account to use this special coupon.",
        };
      }
      const allowedUserIds = new Set(coupon.users.map((u) => u.id));
      if (!allowedUserIds.has(userId)) {
        return {
          isValid: false,
          message: "This coupon is not valid for your account.",
        };
      }
    }

    // Check min purchase amount
    if (coupon.minPurchaseAmount) {
      const minAmount = parseFloat(coupon.minPurchaseAmount);
      if (!isNaN(minAmount) && subtotal < minAmount) {
        return {
          isValid: false,
          message: `Minimum order subtotal of ৳${minAmount.toLocaleString()} is required for this coupon.`,
        };
      }
    }

    // Check min / max order items count
    if (coupon.minOrder) {
      const minCount = parseInt(coupon.minOrder, 10);
      if (!isNaN(minCount) && totalItemsCount < minCount) {
        return {
          isValid: false,
          message: `Minimum ${minCount} item(s) required to redeem this coupon.`,
        };
      }
    }

    if (coupon.maxOrder) {
      const maxCount = parseInt(coupon.maxOrder, 10);
      if (!isNaN(maxCount) && totalItemsCount > maxCount) {
        return {
          isValid: false,
          message: `Coupon is only valid for orders with up to ${maxCount} items.`,
        };
      }
    }

    // Check Product / Variant / Combo restrictions
    const allowedProductIds = new Set(coupon.products.map((p) => p.id));
    const allowedVariantIds = new Set(coupon.variants.map((v) => v.id));
    const allowedComboIds = new Set(coupon.comboProducts.map((c) => c.id));

    let hasEligibleItem = false;

    // Check simple product and variant eligibility
    if (
      coupon.forAllProducts &&
      (productIds.length > 0 || variantIds.length > 0)
    ) {
      hasEligibleItem = true;
    } else {
      if (productIds.some((id) => allowedProductIds.has(id)))
        hasEligibleItem = true;
      if (variantIds.some((id) => allowedVariantIds.has(id)))
        hasEligibleItem = true;
    }

    // Check combo bundle eligibility
    if (coupon.forAllCombos && comboProductIds.length > 0) {
      hasEligibleItem = true;
    } else {
      if (comboProductIds.some((id) => allowedComboIds.has(id)))
        hasEligibleItem = true;
    }

    if (!hasEligibleItem) {
      return {
        isValid: false,
        message: "None of the items in your cart are eligible for this coupon.",
      };
    }

    // Calculate discount amount
    let discountAmount = 0;
    let isFreeDelivery = false;
    const discountVal = coupon.discount ? parseFloat(coupon.discount) : 0;

    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = Math.round(subtotal * (discountVal / 100) * 100) / 100;
      discountAmount = Math.min(discountAmount, subtotal);
    } else if (coupon.discountType === DiscountType.FIXED) {
      discountAmount = Math.min(discountVal, subtotal);
    } else if (coupon.discountType === DiscountType.FREE_DELIVERY) {
      isFreeDelivery = true;
      discountAmount = 0;
    }

    const finalSubtotal = Math.max(0, subtotal - discountAmount);

    return {
      isValid: true,
      message: `Coupon "${coupon.couponCode}" applied successfully!`,
      coupon: {
        id: coupon.id,
        name: coupon.name,
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        discountValue: discountVal,
        discountAmount,
        isFreeDelivery,
        finalSubtotal,
      },
    };
  } catch (error) {
    console.error("[Action.Store.Coupon.Validate]:", error);
    return {
      isValid: false,
      message: "An error occurred while verifying the coupon.",
    };
  }
}
