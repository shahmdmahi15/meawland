"use server";

import db from "@/lib/db";
import { deleteFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export async function deleteSubCategoryAction(subCategoryId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    // Get the sub-category to retrieve the image key and product count
    const subCategory = await db.subCategory.findUnique({
      where: { id: subCategoryId },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!subCategory) {
      return {
        success: false,
        message: "Sub-category not found",
      };
    }

    // Enforce: cannot delete if products are associated
    if (subCategory._count.products > 0) {
      return {
        success: false,
        message: `Cannot delete "${subCategory.name}" — it has ${subCategory._count.products} product${subCategory._count.products === 1 ? "" : "s"} assigned to it. Reassign or remove the products first.`,
      };
    }

    // Delete the image from S3
    if (subCategory.image) {
      const deleteResult = await deleteFile({
        key: subCategory.image,
      });

      if (!deleteResult.success) {
        console.warn(
          `[Action.Admin.Management.SubCategories.Delete] Failed to delete image from S3: ${subCategory.image}`,
        );
        // Continue with deletion even if image delete fails
      }
    }

    // Delete the sub-category from database
    await db.subCategory.delete({
      where: { id: subCategoryId },
    });

    // Revalidate paths for admin and store
    revalidatePath("/admin/management/store/sub-categories");
    revalidatePath("/admin/management/inventory/new-product");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/category", "layout");

    return {
      success: true,
      message: "Sub-category deleted successfully",
    };
  } catch (error) {
    console.error("[Action.Admin.Management.SubCategories.Delete]:", error);
    return {
      success: false,
      message: "Failed to delete sub-category. Please try again.",
    };
  }
}
