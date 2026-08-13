"use server";

import db from "@/lib/db";
import { deleteFile } from "@/lib/storage";
import { revalidatePath } from "next/cache";

export async function deleteSubCategoryAction(subCategoryId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    // Get the sub-category to retrieve the image key
    const subCategory = await db.subCategory.findUnique({
      where: { id: subCategoryId },
    });

    if (!subCategory) {
      return {
        success: false,
        message: "Sub-category not found",
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

    // Revalidate the sub-categories page
    revalidatePath("/admin/management/store/sub-categories");

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
