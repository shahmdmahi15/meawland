import { z } from "zod";
import { DiscountType } from "@/generated/prisma/enums";

export const campaignPayloadSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Campaign name is required")
    .max(120, "Campaign name must be at most 120 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(1000, "Description must be at most 1000 characters"),
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
  minPurchaseAmount: z
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
  forAllProducts: z.boolean().default(false),
  forAllCombos: z.boolean().default(false),
  productIds: z.array(z.string()).default([]),
  variantIds: z.array(z.string()).default([]),
  comboProductIds: z.array(z.string()).default([]),
  endsAt: z.union([z.string(), z.date()]).transform((val) => new Date(val)),
});

export const createCampaignSchema = campaignPayloadSchema.refine(
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

export const updateCampaignSchema = campaignPayloadSchema
  .extend({
    campaignId: z.string().min(1, "Campaign ID is required"),
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

export const deleteCampaignSchema = z.object({
  campaignId: z.string().min(1, "Campaign ID is required"),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type DeleteCampaignInput = z.infer<typeof deleteCampaignSchema>;
