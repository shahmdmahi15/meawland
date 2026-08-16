import { z } from "zod";
import { Category } from "@/generated/prisma/enums";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const optionalFileSchema = z
  .custom<File | undefined>((val) => val === undefined || val instanceof File, {
    message: "Invalid image file",
  })
  .refine(
    (file) => !file || file.size <= MAX_FILE_SIZE,
    "Image must be less than 5MB",
  )
  .refine(
    (file) => !file || ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Image must be PNG, JPG, or WebP",
  );

export const updateSubCategorySchema = z.object({
  id: z.string().min(1, "Sub-category ID is required"),
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
  category: z.enum(Category),
  image: optionalFileSchema.optional(),
});

export type UpdateSubCategoryInput = z.infer<typeof updateSubCategorySchema>;
export type UpdateSubCategoryError = z.inferFlattenedErrors<
  typeof updateSubCategorySchema
>;
