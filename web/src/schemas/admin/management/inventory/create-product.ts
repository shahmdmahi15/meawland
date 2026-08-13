import { z } from "zod";
import { AttributeType } from "@/generated/prisma/enums";

// Max image size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileSchema = z
  .custom<File>((val) => typeof window !== "undefined" && val instanceof File, {
    message: "Image file is required",
  })
  .refine((file) => file.size <= MAX_FILE_SIZE, "Max image size is 5MB.")
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png and .webp formats are supported.",
  );

export const attributeSchema = z.object({
  type: z.enum(AttributeType),
  name: z.string().min(1, "Attribute name is required"),
  value: z.string().min(1, "Attribute value is required"),
});

export type AttributeInput = z.infer<typeof attributeSchema>;

export const variantSchema = z.object({
  sku: z.string().min(1, "Variant SKU is required"),
  image: fileSchema,
  costPrice: z.string().min(1, "Cost price is required"),
  regularPrice: z.string().min(1, "Regular price is required"),
  salePrice: z.string().min(1, "Sale price is required"),
  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
  attributes: z
    .array(attributeSchema)
    .min(1, "At least one attribute is required for each variant"),
});

export type VariantInput = z.infer<typeof variantSchema>;

export const baseProductSchema = z.object({
  name: z.string().min(2, "Product name must be at least 2 characters"),
  sku: z.string().min(1, "Product SKU is required"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    ),
  shortDescription: z.string().min(5, "Short description is required"),
  longDescription: z.string().min(10, "Long description is required"),
  subCategoryId: z.string().min(1, "Sub-category selection is required"),
  brandId: z.string().nullable().optional(),

  // Primary image & Gallery images
  image: fileSchema,
  gallery: z.array(fileSchema),

  // Variable product flag
  isVariable: z.boolean(),

  // Simple Product fields
  costPrice: z.string().optional(),
  regularPrice: z.string().optional(),
  salePrice: z.string().optional(),
  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .optional(),

  // Variable Product fields
  variants: z.array(variantSchema),
});

export const createProductSchema = baseProductSchema.superRefine(
  (data, ctx) => {
    if (!data.isVariable) {
      if (!data.costPrice || data.costPrice.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["costPrice"],
          message: "Cost price is required for simple products",
        });
      }
      if (!data.regularPrice || data.regularPrice.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["regularPrice"],
          message: "Regular price is required for simple products",
        });
      }
      if (!data.salePrice || data.salePrice.trim() === "") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["salePrice"],
          message: "Sale price is required for simple products",
        });
      }
      if (data.stock === undefined || data.stock === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["stock"],
          message: "Initial stock is required for simple products",
        });
      }
    } else {
      if (!data.variants || data.variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message:
            "At least one product variant is required for variable products",
        });
      }
    }
  },
);

export type CreateProductInput = z.infer<typeof baseProductSchema>;
export type CreateProductError = z.inferFlattenedErrors<
  typeof baseProductSchema
>;
