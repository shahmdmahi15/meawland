import { z } from "zod";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const optionalImageFileSchema = z
  .custom<File | undefined>((val) => val === undefined || val instanceof File, {
    message: "Invalid image file",
  })
  .refine(
    (file) => !file || file.size <= MAX_FILE_SIZE,
    "Max image size is 5MB.",
  )
  .refine(
    (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png and .webp formats are supported.",
  );

export const comboProductPayloadSchema = z.object({
  name: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  longDescription: z.string().trim().optional(),
  productIds: z.array(z.string().min(1)).optional().default([]),
  variantIds: z.array(z.string().min(1)).optional().default([]),
  regularPrice: z.union([z.string(), z.number()]).optional(),
  salePrice: z.union([z.string(), z.number()]).optional(),
  // Main product image (File from input or undefined)
  image: optionalImageFileSchema.optional(),
  // Additional gallery images (Array of Files)
  gallery: z.array(optionalImageFileSchema).optional().default([]),
  // Retained existing S3 gallery keys for update workflow
  retainedGallery: z.array(z.string()).optional().default([]),
});

export const createComboProductSchema = comboProductPayloadSchema;

export const updateComboProductSchema = comboProductPayloadSchema.extend({
  comboId: z.string().min(1, "Combo product ID is required"),
  // Optional flag to explicitly remove the custom main image and revert to item fallback
  removeCustomImage: z.boolean().optional(),
});

export type CreateComboProductInput = z.infer<typeof createComboProductSchema>;
export type UpdateComboProductInput = z.infer<typeof updateComboProductSchema>;
