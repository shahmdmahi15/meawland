"use server";

import db from "@/lib/db";
import { deleteFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";
import {
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";

export async function deleteProductAction(productId: string): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    if (!productId) {
      return {
        success: false,
        message: "Product ID is required.",
      };
    }

    // 1. Fetch product to find associated S3 keys
    const product = await db.product.findUnique({
      where: { id: productId },
      include: {
        variants: {
          select: {
            image: true,
          },
        },
      },
    });

    if (!product) {
      return {
        success: false,
        message: "Product not found or already deleted.",
      };
    }

    // 2. Collect all S3 file keys (main image, gallery images, variant images)
    const keysToDelete: string[] = [];

    if (product.image) {
      keysToDelete.push(product.image);
    }

    if (product.gallery && Array.isArray(product.gallery)) {
      for (const gKey of product.gallery) {
        if (gKey) keysToDelete.push(gKey);
      }
    }

    if (product.variants && Array.isArray(product.variants)) {
      for (const variant of product.variants) {
        if (variant.image) keysToDelete.push(variant.image);
      }
    }

    // 3. Delete files from S3 storage
    for (const key of keysToDelete) {
      try {
        await deleteFile({ key });
      } catch (s3Err) {
        console.error(
          `[DeleteProduct] Failed to delete S3 file ${key}:`,
          s3Err,
        );
      }
    }

    // 4. Delete product from Prisma database (Cascade will clean up variants, attributes, stock events)
    await db.product.delete({
      where: { id: productId },
    });

    // 5. Revalidate paths for admin and storefront
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory");
    revalidatePath("/admin/management/inventory/modify-stock");
    revalidatePath("/admin/management/inventory/combo-products");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/category", "layout");
    revalidatePath("/product", "layout");

    await recordAuditLog({
      action: AuditAction.DELETE,
      entity: AuditEntity.PRODUCT,
      entityId: product.id,
      entityName: product.name,
      summary: `Product "${product.name}" (${product.code}, SKU: ${product.sku}) was permanently deleted`,
      severity: AuditSeverity.WARNING,
      previousState: {
        code: product.code,
        sku: product.sku,
        name: product.name,
        regularPrice: product.regularPrice,
        salePrice: product.salePrice,
        stock: product.stock,
      },
      path: "/admin/management/inventory/all-products",
    });

    return {
      success: true,
      message: `Product "${product.name}" (${product.code}) was deleted successfully.`,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Inventory.DeleteProduct]:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete product due to a server error.",
    };
  }
}
