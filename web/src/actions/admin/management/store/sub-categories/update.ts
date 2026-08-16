"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { deleteFile, uploadFile } from "@/lib/storage";
import {
  updateSubCategorySchema,
  type UpdateSubCategoryError,
  type UpdateSubCategoryInput,
} from "@/schemas/admin/management/store/sub-categories/update";

export async function updateSubCategoryAction(
  input: UpdateSubCategoryInput,
): Promise<{
  success: boolean;
  message?: string;
  errors?: UpdateSubCategoryError;
}> {
  try {
    const validate = await updateSubCategorySchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: "Invalid input",
        errors: validate.error.flatten(),
      };
    }

    const data = validate.data;

    const existing = await db.subCategory.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Sub-category not found.",
      };
    }

    const slugOwner = await db.subCategory.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });

    if (slugOwner && slugOwner.id !== data.id) {
      return {
        success: false,
        message: "A sub-category with this slug already exists.",
      };
    }

    let nextImageKey = existing.image;
    if (data.image) {
      const imageBuffer = await data.image.arrayBuffer();
      const imageUint8Array = new Uint8Array(imageBuffer);
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString("hex");
      const extension = data.image.name.split(".").pop() || "jpg";
      const imageKey = `sub-categories/${data.category}/${timestamp}-${randomString}.${extension}`;

      const uploadResult = await uploadFile({
        key: imageKey,
        body: imageUint8Array,
        contentType: data.image.type,
      });

      if (!uploadResult.success || !uploadResult.key) {
        return {
          success: false,
          message: "Failed to upload image. Please try again.",
        };
      }

      nextImageKey = uploadResult.key;
    }

    await db.subCategory.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        category: data.category,
        image: nextImageKey,
      },
    });

    if (data.image && existing.image && existing.image !== nextImageKey) {
      try {
        await deleteFile({ key: existing.image });
      } catch (error) {
        console.warn(
          "[Action.Admin.Management.SubCategories.Update] old image cleanup failed",
          error,
        );
      }
    }

    revalidatePath("/admin/management/store/sub-categories");

    return {
      success: true,
      message: "Sub-category updated successfully",
    };
  } catch (error) {
    console.error("[Action.Admin.Management.SubCategories.Update]:", error);
    return {
      success: false,
      message: "Failed to update sub-category. Please try again.",
    };
  }
}
