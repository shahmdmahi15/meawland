"use server";

import db from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import { generateId } from "@/lib/generate-code";
import {
  createProductSchema,
  variantSchema,
  type CreateProductInput,
  type CreateProductError,
  type VariantInput,
} from "@/schemas/admin/management/inventory/create-product";
import crypto from "crypto";
import { revalidatePath } from "next/cache";

export async function createProductAction(input: CreateProductInput): Promise<{
  success: boolean;
  message?: string;
  errors?: CreateProductError;
  productId?: string;
}> {
  try {
    // 1. Validate input with Zod schema
    const validate = await createProductSchema.safeParseAsync(input);

    if (!validate.success) {
      return {
        success: false,
        message: "Validation failed. Please check the form errors.",
        errors: validate.error.flatten(),
      };
    }

    const data = validate.data;
    // Parse variants with variantSchema so v.stock is coerced to a number (Int) for Prisma DB insert
    const typedVariants: VariantInput[] = (
      (data.variants ?? []) as unknown[]
    ).map((v) => {
      const parsed = variantSchema.safeParse(v);
      if (parsed.success) {
        return parsed.data;
      }
      const raw = v as Record<string, unknown>;
      return {
        ...(v as VariantInput),
        stock:
          typeof raw.stock === "number"
            ? raw.stock
            : parseInt(String(raw.stock || "0"), 10),
      };
    });

    // 2. Upload main product image to S3
    const mainImageBuffer = await data.image.arrayBuffer();
    const mainImageUint8Array = new Uint8Array(mainImageBuffer);
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(6).toString("hex");
    const mainImageExt = data.image.name.split(".").pop() || "jpg";
    const mainImageKey = `products/main/${timestamp}-${randomHex}.${mainImageExt}`;

    const mainUploadResult = await uploadFile({
      key: mainImageKey,
      body: mainImageUint8Array,
      contentType: data.image.type,
    });

    if (!mainUploadResult.success) {
      return {
        success: false,
        message: "Failed to upload main product image to S3.",
      };
    }

    // 3. Upload gallery images to S3 if provided
    const galleryKeys: string[] = [];
    if (data.gallery && data.gallery.length > 0) {
      for (let i = 0; i < data.gallery.length; i++) {
        const galleryFile = data.gallery[i];
        const gBuffer = await galleryFile.arrayBuffer();
        const gUint8Array = new Uint8Array(gBuffer);
        const gExt = galleryFile.name.split(".").pop() || "jpg";
        const gKey = `products/gallery/${timestamp}-${randomHex}-${i}.${gExt}`;

        const gUploadResult = await uploadFile({
          key: gKey,
          body: gUint8Array,
          contentType: galleryFile.type,
        });

        if (gUploadResult.success && gUploadResult.key) {
          galleryKeys.push(gUploadResult.key);
        }
      }
    }

    // 4. Upload variant images to S3 if variable product
    const variantImageKeys: string[] = [];
    if (data.isVariable && typedVariants.length > 0) {
      for (let i = 0; i < typedVariants.length; i++) {
        const vImageFile = typedVariants[i].image;
        const vBuffer = await vImageFile.arrayBuffer();
        const vUint8Array = new Uint8Array(vBuffer);
        const vExt = vImageFile.name.split(".").pop() || "jpg";
        const vKey = `products/variants/${timestamp}-${randomHex}-${i}.${vExt}`;

        const vUploadResult = await uploadFile({
          key: vKey,
          body: vUint8Array,
          contentType: vImageFile.type,
        });

        if (!vUploadResult.success || !vUploadResult.key) {
          return {
            success: false,
            message: `Failed to upload image for Variant #${i + 1}.`,
          };
        }

        variantImageKeys.push(vUploadResult.key);
      }
    }

    // 5. Perform product creation, variant creation, and sequential ID generation within an atomic DB transaction
    const product = await db.$transaction(async (tx) => {
      // Generate sequential product code
      const productCode = await generateId("PRODUCT", tx);

      // Check product SKU uniqueness
      const existingSku = await tx.product.findUnique({
        where: { sku: data.sku },
      });

      if (existingSku) {
        throw new Error(`A product with SKU "${data.sku}" already exists.`);
      }

      // Check product slug uniqueness
      const existingSlug = await tx.product.findUnique({
        where: { slug: data.slug },
      });

      if (existingSlug) {
        throw new Error("A product with this slug already exists.");
      }

      // Check variant SKUs uniqueness if variable product
      if (data.isVariable && typedVariants.length > 0) {
        for (const v of typedVariants) {
          const existingVariantSku = await tx.variant.findUnique({
            where: { sku: v.sku },
          });

          if (existingVariantSku) {
            throw new Error(`A variant with SKU "${v.sku}" already exists.`);
          }
        }
      }

      // Create product in database
      const createdProduct = await tx.product.create({
        data: {
          name: data.name,
          code: productCode,
          sku: data.sku,
          slug: data.slug,
          shortDescription: data.shortDescription,
          longDescription: data.longDescription,
          image: mainUploadResult.key!,
          gallery: galleryKeys,
          isVariable: data.isVariable,

          // Simple product pricing & stock
          costPrice: !data.isVariable ? data.costPrice : null,
          regularPrice: !data.isVariable ? data.regularPrice : null,
          salePrice: !data.isVariable ? data.salePrice : null,
          stock: !data.isVariable ? data.stock : null,

          // Foreign keys
          subCategoryId: data.subCategoryId,
          brandId: data.brandId || null,

          // Simple product initial stock event
          stockEvents:
            !data.isVariable && data.stock !== undefined && data.stock !== null
              ? {
                  create: [
                    {
                      type: "INITIAL",
                      quantity: Number(data.stock),
                      previousStock: 0,
                      newStock: Number(data.stock),
                      reason: "INITIAL_STOCK",
                      note: "Initial stock entry for simple product",
                    },
                  ],
                }
              : undefined,

          // Variable product variants & attributes & initial stock events
          variants:
            data.isVariable && typedVariants.length > 0
              ? {
                  create: typedVariants.map((v, index) => ({
                    sku: v.sku,
                    image: variantImageKeys[index],
                    costPrice: v.costPrice,
                    regularPrice: v.regularPrice,
                    salePrice: v.salePrice,
                    stock:
                      typeof v.stock === "number" ? v.stock : Number(v.stock),
                    attributes: {
                      create: v.attributes.map((a) => ({
                        type: a.type,
                        name: a.name,
                        value: a.value,
                      })),
                    },
                    stockEvents: {
                      create: [
                        {
                          type: "INITIAL",
                          quantity: Number(v.stock),
                          previousStock: 0,
                          newStock: Number(v.stock),
                          reason: "INITIAL_STOCK",
                          note: `Initial stock entry for variant ${v.sku}`,
                        },
                      ],
                    },
                  })),
                }
              : undefined,
        },
      });

      if (data.isVariable) {
        const createdVariants = await tx.variant.findMany({
          where: { productId: createdProduct.id },
        });

        for (const variant of createdVariants) {
          await tx.stockEvent.updateMany({
            where: { variantId: variant.id },
            data: { productId: createdProduct.id },
          });
        }
      }

      return createdProduct;
    });

    // 6. Revalidate paths
    revalidatePath("/admin/management/inventory");
    revalidatePath("/admin/management/inventory/new-product");
    revalidatePath("/admin/management/inventory/all-products");

    return {
      success: true,
      message: `Product created successfully with Code: ${product.code} and SKU: ${product.sku}`,
      productId: product.id,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Inventory.CreateProduct]:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to create product due to an unexpected server error.";
    return {
      success: false,
      message: errorMessage,
    };
  }
}
