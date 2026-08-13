import { z } from "zod";
import { Category } from "@/generated/prisma/enums";

export const createSubCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must be lowercase with hyphens only",
    ),
  category: z.nativeEnum(Category),
  image: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "Image must be less than 5MB",
    )
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Image must be PNG, JPG, or WebP",
    ),
});

export type CreateSubCategoryInput = z.infer<typeof createSubCategorySchema>;
export type CreateSubCategoryError = z.inferFlattenedErrors<
  typeof createSubCategorySchema
>;
