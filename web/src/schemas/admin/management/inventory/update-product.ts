import { z } from "zod";
import { AttributeType } from "@/generated/prisma/enums";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileSchema = z
  .custom<File>((val) => val instanceof File, {
    message: "Invalid image file",
  })
  .refine((file) => file.size <= MAX_FILE_SIZE, "Max image size is 5MB.")
  .refine(
    (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
    "Only .jpg, .jpeg, .png and .webp formats are supported.",
  );

const optionalFileSchema = z
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

export const attributeSchema = z.object({
  type: z.nativeEnum(AttributeType),
  name: z.string().min(1, "Attribute name is required"),
  value: z.string().min(1, "Attribute value is required"),
});

export type AttributeInput = z.infer<typeof attributeSchema>;

export const newVariantSchema = z.object({
  tempId: z.string().optional(),
  sku: z.string().min(1, "Variant SKU is required"),
  costPrice: z.string().min(1, "Cost price is required"),
  regularPrice: z.string().min(1, "Regular price is required"),
  salePrice: z.string().min(1, "Sale price is required"),
  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative"),
  attributes: z
    .array(attributeSchema)
    .min(1, "At least one attribute is required for each new variant"),
  image: optionalFileSchema.optional(),
});

export type NewVariantInput = z.infer<typeof newVariantSchema>;

const updateVariantSchema = z.object({
  id: z.string().min(1, "Variant ID is required"),
  sku: z.string().min(1, "Variant SKU is required"),
  costPrice: z.string().min(1, "Cost price is required"),
  regularPrice: z.string().min(1, "Regular price is required"),
  salePrice: z.string().min(1, "Sale price is required"),
  attributes: z.array(attributeSchema).optional().default([]),
  image: optionalFileSchema.optional(),
});

export type UpdateVariantInput = z.infer<typeof updateVariantSchema>;

export const updateProductSchema = z
  .object({
    id: z.string().min(1, "Product ID is required"),
    isVariable: z.boolean(),
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

    image: optionalFileSchema.optional(),
    galleryAdd: z.array(fileSchema).optional().default([]),
    removeGalleryKeys: z.array(z.string()).optional().default([]),

    costPrice: z.string().optional(),
    regularPrice: z.string().optional(),
    salePrice: z.string().optional(),
    variants: z.array(updateVariantSchema).optional().default([]),
    removeVariantIds: z.array(z.string()).optional().default([]),
    newVariants: z.array(newVariantSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
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
    } else {
      const activeExisting = (data.variants ?? []).filter(
        (v) => !(data.removeVariantIds ?? []).includes(v.id),
      );
      const activeNew = data.newVariants ?? [];
      if (activeExisting.length + activeNew.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message:
            "At least one active variant is required for variable products",
        });
      }
    }
  });

export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type UpdateProductError = z.inferFlattenedErrors<
  typeof updateProductSchema
>;
