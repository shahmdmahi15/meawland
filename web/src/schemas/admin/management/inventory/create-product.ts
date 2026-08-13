import { z } from "zod";
import { AttributeType } from "@/generated/prisma/enums";

// Max image size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const fileSchema = z
  .custom<File>(
    // File is a global in Node.js 18+ (required by Next.js 16), so instanceof
    // File works correctly on both client AND server (inside server actions).
    // The old `typeof window !== "undefined"` guard was causing every file to
    // fail validation inside server actions since window is always undefined there.
    (val) => val instanceof File,
    { message: "Image file is required" },
  )
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

// -----------------------------------------------------------------------
// Base schema uses z.unknown() for the variants array so that the Zod
// item-level validator (variantSchema) is NOT applied during the base
// parse pass. Full conditional validation happens in superRefine below.
// This is the only reliable way to prevent Zod from validating variant
// fields (e.g. image File check) when isVariable === false.
// -----------------------------------------------------------------------
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

  // Product type toggle
  isVariable: z.boolean(),

  // Simple product fields — optional at parse level, validated conditionally
  costPrice: z.string().optional(),
  regularPrice: z.string().optional(),
  salePrice: z.string().optional(),
  stock: z.coerce
    .number()
    .int("Stock must be an integer")
    .min(0, "Stock cannot be negative")
    .optional(),

  // Variant array — z.unknown() items so base schema never validates variant shape
  variants: z.array(z.unknown()).optional(),
});

export const createProductSchema = baseProductSchema.superRefine(
  (data, ctx) => {
    if (!data.isVariable) {
      // ── Simple product: validate pricing & stock; completely ignore variants ──
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
      // ── Variable product: validate variants; completely ignore simple pricing ──
      const variants = data.variants ?? [];
      if (variants.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["variants"],
          message:
            "At least one product variant is required for variable products",
        });
      } else {
        variants.forEach((variant, index) => {
          const result = variantSchema.safeParse(variant);
          if (!result.success) {
            result.error.issues.forEach((issue) => {
              ctx.addIssue({
                ...issue,
                path: ["variants", index, ...issue.path],
              });
            });
          }
        });
      }
    }
  },
);

// The typed input uses VariantInput[] for proper form typing in react-hook-form
export type CreateProductInput = Omit<
  z.infer<typeof baseProductSchema>,
  "variants"
> & {
  variants: VariantInput[];
};

export type CreateProductError = z.inferFlattenedErrors<
  typeof baseProductSchema
>;
