"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { deleteFile, uploadFile } from "@/lib/storage";
import {
  updateProductSchema,
  type UpdateProductError,
  type UpdateProductInput,
} from "@/schemas/admin/management/inventory/update-product";

export async function updateProductAction(input: UpdateProductInput): Promise<{
  success: boolean;
  message?: string;
  errors?: UpdateProductError;
}> {
  try {
    const validate = await updateProductSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: "Validation failed. Please check the form errors.",
        errors: validate.error.flatten(),
      };
    }

    const data = validate.data;

    const existing = await db.product.findUnique({
      where: { id: data.id },
      include: {
        variants: true,
      },
    });

    if (!existing) {
      return {
        success: false,
        message: "Product not found.",
      };
    }

    const skuOwner = await db.product.findUnique({
      where: { sku: data.sku },
      select: { id: true },
    });
    if (skuOwner && skuOwner.id !== data.id) {
      return {
        success: false,
        message: `A product with SKU \"${data.sku}\" already exists.`,
      };
    }

    const slugOwner = await db.product.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });
    if (slugOwner && slugOwner.id !== data.id) {
      return {
        success: false,
        message: "A product with this slug already exists.",
      };
    }

    const removedGalleryKeys = (data.removeGalleryKeys ?? []).filter((key) =>
      existing.gallery.includes(key),
    );

    const keptGallery = existing.gallery.filter(
      (key) => !removedGalleryKeys.includes(key),
    );

    let nextMainImageKey = existing.image;
    if (data.image) {
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

      if (!mainUploadResult.success || !mainUploadResult.key) {
        return {
          success: false,
          message: "Failed to upload main product image.",
        };
      }

      nextMainImageKey = mainUploadResult.key;
    }

    const uploadedGalleryKeys: string[] = [];
    for (const galleryFile of data.galleryAdd ?? []) {
      const buffer = await galleryFile.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const timestamp = Date.now();
      const randomHex = crypto.randomBytes(6).toString("hex");
      const ext = galleryFile.name.split(".").pop() || "jpg";
      const key = `products/gallery/${timestamp}-${randomHex}.${ext}`;

      const uploadResult = await uploadFile({
        key,
        body: uint8,
        contentType: galleryFile.type,
      });

      if (!uploadResult.success || !uploadResult.key) {
        return {
          success: false,
          message: `Failed to upload gallery image ${galleryFile.name}.`,
        };
      }

      uploadedGalleryKeys.push(uploadResult.key);
    }

    const nextGallery = [...keptGallery, ...uploadedGalleryKeys];

    const existingVariantMap = new Map(
      existing.variants.map((variant) => [variant.id, variant]),
    );
    const removeVariantIds = (data.removeVariantIds ?? []).filter((id) =>
      existingVariantMap.has(id),
    );

    const activeVariantUpdates = (data.variants ?? []).filter(
      (variant) =>
        existingVariantMap.has(variant.id) &&
        !removeVariantIds.includes(variant.id),
    );

    const newVariantsInput = data.newVariants ?? [];

    if (existing.isVariable) {
      const activeExistingCount =
        existing.variants.length - removeVariantIds.length;
      const totalActiveCount = activeExistingCount + newVariantsInput.length;
      if (totalActiveCount <= 0) {
        return {
          success: false,
          message:
            "A variable product must have at least one active variant remaining.",
        };
      }

      const hasUnknownVariant = (data.variants ?? []).some(
        (variant) => !existingVariantMap.has(variant.id),
      );
      if (hasUnknownVariant) {
        return {
          success: false,
          message: "One or more variants do not belong to this product.",
        };
      }
    }

    const variantImageReplacements: Array<{
      variantId: string;
      previousImageKey: string;
      nextImageKey: string;
    }> = [];

    const variantDataUpdates = await Promise.all(
      activeVariantUpdates.map(async (variantInput) => {
        const existingVariant = existingVariantMap.get(variantInput.id)!;
        let nextImageKey = existingVariant.image;

        if (variantInput.image) {
          const imageBuffer = await variantInput.image.arrayBuffer();
          const imageUint8Array = new Uint8Array(imageBuffer);
          const timestamp = Date.now();
          const randomHex = crypto.randomBytes(6).toString("hex");
          const imageExt = variantInput.image.name.split(".").pop() || "jpg";
          const imageKey = `products/variants/${timestamp}-${randomHex}.${imageExt}`;

          const uploadResult = await uploadFile({
            key: imageKey,
            body: imageUint8Array,
            contentType: variantInput.image.type,
          });

          if (!uploadResult.success || !uploadResult.key) {
            throw new Error(
              `Failed to upload image for variant ${variantInput.sku}.`,
            );
          }

          nextImageKey = uploadResult.key;
          if (existingVariant.image && existingVariant.image !== nextImageKey) {
            variantImageReplacements.push({
              variantId: variantInput.id,
              previousImageKey: existingVariant.image,
              nextImageKey,
            });
          }
        }

        return {
          ...variantInput,
          nextImageKey,
        };
      }),
    );

    const uploadedNewVariants = await Promise.all(
      newVariantsInput.map(async (newV, idx) => {
        let imageKey = "";
        if (newV.image) {
          const buffer = await newV.image.arrayBuffer();
          const uint8 = new Uint8Array(buffer);
          const timestamp = Date.now();
          const randomHex = crypto.randomBytes(6).toString("hex");
          const ext = newV.image.name.split(".").pop() || "jpg";
          const key = `products/variants/${timestamp}-${randomHex}-new-${idx}.${ext}`;

          const uploadRes = await uploadFile({
            key,
            body: uint8,
            contentType: newV.image.type,
          });

          if (!uploadRes.success || !uploadRes.key) {
            throw new Error(
              `Failed to upload image for new variant ${newV.sku}.`,
            );
          }

          imageKey = uploadRes.key;
        }

        return {
          ...newV,
          imageKey,
        };
      }),
    );

    await db.$transaction(async (tx) => {
      for (const variantInput of variantDataUpdates) {
        const skuOwner = await tx.variant.findUnique({
          where: { sku: variantInput.sku },
          select: { id: true },
        });

        if (skuOwner && skuOwner.id !== variantInput.id) {
          throw new Error(
            `A variant with SKU "${variantInput.sku}" already exists.`,
          );
        }
      }

      for (const newV of uploadedNewVariants) {
        const existingSku = await tx.variant.findUnique({
          where: { sku: newV.sku },
          select: { id: true },
        });

        if (existingSku) {
          throw new Error(`A variant with SKU "${newV.sku}" already exists.`);
        }
      }

      await tx.product.update({
        where: { id: data.id },
        data: {
          name: data.name,
          sku: data.sku,
          slug: data.slug,
          shortDescription: data.shortDescription,
          longDescription: data.longDescription,
          subCategoryId: data.subCategoryId,
          brandId: data.brandId || null,
          image: nextMainImageKey,
          gallery: nextGallery,
          costPrice: existing.isVariable ? existing.costPrice : data.costPrice,
          regularPrice: existing.isVariable
            ? existing.regularPrice
            : data.regularPrice,
          salePrice: existing.isVariable ? existing.salePrice : data.salePrice,
          stock: existing.stock,
        },
      });

      if (existing.isVariable) {
        if (removeVariantIds.length > 0) {
          await tx.variant.deleteMany({
            where: {
              id: { in: removeVariantIds },
              productId: data.id,
            },
          });
        }

        for (const variantInput of variantDataUpdates) {
          await tx.variant.update({
            where: { id: variantInput.id },
            data: {
              sku: variantInput.sku,
              costPrice: variantInput.costPrice,
              regularPrice: variantInput.regularPrice,
              salePrice: variantInput.salePrice,
              image: variantInput.nextImageKey,
            },
          });

          if (variantInput.attributes && variantInput.attributes.length > 0) {
            await tx.attribute.deleteMany({
              where: { variantId: variantInput.id },
            });

            await tx.attribute.createMany({
              data: variantInput.attributes.map((attr) => ({
                variantId: variantInput.id,
                type: attr.type,
                name: attr.name,
                value: attr.value,
              })),
            });
          }
        }

        for (const newV of uploadedNewVariants) {
          await tx.variant.create({
            data: {
              productId: data.id,
              sku: newV.sku,
              costPrice: newV.costPrice,
              regularPrice: newV.regularPrice,
              salePrice: newV.salePrice,
              stock: newV.stock,
              image: newV.imageKey,
              attributes: {
                create: newV.attributes.map((attr) => ({
                  type: attr.type,
                  name: attr.name,
                  value: attr.value,
                })),
              },
              stockEvents: {
                create: [
                  {
                    type: "INITIAL",
                    quantity: newV.stock,
                    previousStock: 0,
                    newStock: newV.stock,
                    reason: "INITIAL_STOCK",
                    note: `Initial stock entry for variant ${newV.sku}`,
                    productId: data.id,
                  },
                ],
              },
            },
          });
        }
      }
    });

    if (data.image && existing.image && existing.image !== nextMainImageKey) {
      try {
        await deleteFile({ key: existing.image });
      } catch (error) {
        console.warn(
          "[Action.Admin.Management.Inventory.UpdateProduct] old main image cleanup failed",
          error,
        );
      }
    }

    for (const removedKey of removedGalleryKeys) {
      try {
        await deleteFile({ key: removedKey });
      } catch (error) {
        console.warn(
          "[Action.Admin.Management.Inventory.UpdateProduct] gallery cleanup failed",
          error,
        );
      }
    }

    for (const removedVariantId of removeVariantIds) {
      const removedVariant = existingVariantMap.get(removedVariantId);
      if (removedVariant?.image) {
        try {
          await deleteFile({ key: removedVariant.image });
        } catch (error) {
          console.warn(
            "[Action.Admin.Management.Inventory.UpdateProduct] removed variant image cleanup failed",
            error,
          );
        }
      }
    }

    for (const replacement of variantImageReplacements) {
      try {
        await deleteFile({ key: replacement.previousImageKey });
      } catch (error) {
        console.warn(
          "[Action.Admin.Management.Inventory.UpdateProduct] old variant image cleanup failed",
          error,
        );
      }
    }

    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory");
    revalidatePath("/admin/management/inventory/modify-stock");
    revalidatePath("/admin/management/inventory/combo-products");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/category", "layout");
    revalidatePath("/product", "layout");

    return {
      success: true,
      message: "Product updated successfully.",
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Inventory.UpdateProduct]:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update product due to server error.",
    };
  }
}
