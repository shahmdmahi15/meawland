import { z } from "zod";

export const comboProductPayloadSchema = z.object({
  name: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  longDescription: z.string().trim().optional(),
  productIds: z.array(z.string().min(1)).optional().default([]),
  variantIds: z.array(z.string().min(1)).optional().default([]),
  regularPrice: z.union([z.string(), z.number()]).optional(),
  salePrice: z.union([z.string(), z.number()]).optional(),
});

export const createComboProductSchema = comboProductPayloadSchema;

export const updateComboProductSchema = comboProductPayloadSchema.extend({
  comboId: z.string().min(1, "Combo product ID is required"),
});

export type CreateComboProductInput = z.infer<typeof createComboProductSchema>;
export type UpdateComboProductInput = z.infer<typeof updateComboProductSchema>;
