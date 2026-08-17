import { z } from "zod";
import { DiscountType, Category } from "@/generated/prisma/enums";

export const couponPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Coupon name is required")
    .max(100, "Coupon name must be at most 100 characters"),
  couponCode: z
    .string()
    .trim()
    .min(2, "Coupon code must be at least 2 characters")
    .max(30, "Coupon code must be at most 30 characters")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Coupon code can only contain alphanumeric characters, underscores, and hyphens",
    )
    .transform((val) => val.toUpperCase()),
  discountType: z.nativeEnum(DiscountType, {
    message: "Invalid discount type",
  }),
  discount: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) =>
      val !== undefined && val !== null ? String(val) : null,
    ),
  minOrder: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) =>
      val !== undefined && val !== null ? String(val) : null,
    ),
  maxOrder: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) =>
      val !== undefined && val !== null ? String(val) : null,
    ),
  maxRedemptions: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((val) => {
      if (val === undefined || val === null || val === "") return null;
      const num = Number(val);
      return isNaN(num) ? null : num;
    }),
  minPurchaseAmount: z
    .union([z.string(), z.number()])
    .optional()
    .nullable()
    .transform((val) =>
      val !== undefined && val !== null ? String(val) : null,
    ),
  forAllUsers: z.boolean().default(false),
  forAllCategories: z.boolean().default(false),
  forAllSubCategories: z.boolean().default(false),
  forAllBrands: z.boolean().default(false),
  forAllProducts: z.boolean().default(false),
  forAllCombos: z.boolean().default(false),
  userIds: z.array(z.string()).default([]),
  categoryEnums: z.array(z.nativeEnum(Category)).default([]),
  subCategoryIds: z.array(z.string()).default([]),
  brandIds: z.array(z.string()).default([]),
  productIds: z.array(z.string()).default([]),
  variantIds: z.array(z.string()).default([]),
  comboProductIds: z.array(z.string()).default([]),
  expiresAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
});

export const createCouponSchema = couponPayloadSchema.refine(
  (data) => {
    if (data.discountType === DiscountType.PERCENTAGE) {
      if (!data.discount) return false;
      const num = parseFloat(data.discount);
      return !isNaN(num) && num > 0 && num <= 100;
    }
    if (data.discountType === DiscountType.FIXED) {
      if (!data.discount) return false;
      const num = parseFloat(data.discount);
      return !isNaN(num) && num > 0;
    }
    return true;
  },
  {
    message:
      "Please enter a valid discount amount (1-100% for percentage, >0 for fixed)",
    path: ["discount"],
  },
);

export const updateCouponSchema = couponPayloadSchema
  .extend({
    couponId: z.string().min(1, "Coupon ID is required"),
  })
  .refine(
    (data) => {
      if (data.discountType === DiscountType.PERCENTAGE) {
        if (!data.discount) return false;
        const num = parseFloat(data.discount);
        return !isNaN(num) && num > 0 && num <= 100;
      }
      if (data.discountType === DiscountType.FIXED) {
        if (!data.discount) return false;
        const num = parseFloat(data.discount);
        return !isNaN(num) && num > 0;
      }
      return true;
    },
    {
      message:
        "Please enter a valid discount amount (1-100% for percentage, >0 for fixed)",
      path: ["discount"],
    },
  );

export const deleteCouponSchema = z.object({
  couponId: z.string().min(1, "Coupon ID is required"),
});

export const validateCouponCartSchema = z.object({
  code: z.string().trim().min(1, "Coupon code is required"),
  subtotal: z.number().nonnegative(),
  userId: z.string().optional(),
  categoryEnums: z.array(z.nativeEnum(Category)).default([]),
  subCategoryIds: z.array(z.string()).default([]),
  brandIds: z.array(z.string()).default([]),
  productIds: z.array(z.string()).default([]),
  variantIds: z.array(z.string()).default([]),
  comboProductIds: z.array(z.string()).default([]),
  totalItemsCount: z.number().optional().default(1),
});

export type CreateCouponInput = z.infer<typeof createCouponSchema>;
export type UpdateCouponInput = z.infer<typeof updateCouponSchema>;
export type DeleteCouponInput = z.infer<typeof deleteCouponSchema>;
export type ValidateCouponCartInput = z.infer<typeof validateCouponCartSchema>;
