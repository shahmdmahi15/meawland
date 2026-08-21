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

export async function deleteBrandAction(brandId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    // Get the brand to retrieve the image key and check product count
    const brand = await db.brand.findUnique({
      where: { id: brandId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!brand) {
      return {
        success: false,
        message: "Brand not found",
      };
    }

    // Server-side enforcement guard: prevent deletion if products exist
    if (brand._count.products > 0) {
      return {
        success: false,
        message: `Cannot delete "${brand.name}" — it has ${brand._count.products} product${brand._count.products === 1 ? "" : "s"} assigned to it. Reassign or remove the products first.`,
      };
    }

    // Delete the image from S3
    if (brand.image) {
      const deleteResult = await deleteFile({
        key: brand.image,
      });

      if (!deleteResult.success) {
        console.warn(
          `[Action.Admin.Management.Brands.Delete] Failed to delete image from S3: ${brand.image}`,
        );
        // Continue with deletion even if image delete fails
      }
    }

    // Delete the brand from database
    await db.brand.delete({
      where: { id: brandId },
    });

    // Revalidate paths for admin and store
    revalidatePath("/admin/management/store/brands");
    revalidatePath("/admin/management/inventory/new-product");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory");
    revalidatePath("/");
    revalidatePath("/products");

    await recordAuditLog({
      action: AuditAction.DELETE,
      entity: AuditEntity.BRAND,
      entityId: brand.id,
      entityName: brand.name,
      summary: `Brand "${brand.name}" was permanently deleted`,
      severity: AuditSeverity.WARNING,
      previousState: { name: brand.name, slug: brand.slug },
      path: "/admin/management/store/brands",
    });

    return {
      success: true,
      message: "Brand deleted successfully",
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Brands.Delete]:", error);
    return {
      success: false,
      message: "Failed to delete brand. Please try again.",
    };
  }
}
