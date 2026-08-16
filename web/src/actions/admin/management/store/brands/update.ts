"use server";

import crypto from "crypto";
import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { deleteFile, uploadFile } from "@/lib/storage";
import {
  updateBrandSchema,
  type UpdateBrandError,
  type UpdateBrandInput,
} from "@/schemas/admin/management/store/brands/update";

export async function updateBrandAction(input: UpdateBrandInput): Promise<{
  success: boolean;
  message?: string;
  errors?: UpdateBrandError;
}> {
  try {
    const validate = await updateBrandSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: "Invalid input",
        errors: validate.error.flatten(),
      };
    }

    const data = validate.data;

    const existing = await db.brand.findUnique({
      where: { id: data.id },
    });

    if (!existing) {
      return {
        success: false,
        message: "Brand not found.",
      };
    }

    const slugOwner = await db.brand.findUnique({
      where: { slug: data.slug },
      select: { id: true },
    });

    if (slugOwner && slugOwner.id !== data.id) {
      return {
        success: false,
        message: "A brand with this slug already exists.",
      };
    }

    let nextImageKey = existing.image;
    if (data.image) {
      const imageBuffer = await data.image.arrayBuffer();
      const imageUint8Array = new Uint8Array(imageBuffer);
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString("hex");
      const extension = data.image.name.split(".").pop() || "jpg";
      const imageKey = `brands/${timestamp}-${randomString}.${extension}`;

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

    await db.brand.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        image: nextImageKey,
      },
    });

    if (data.image && existing.image && existing.image !== nextImageKey) {
      try {
        await deleteFile({ key: existing.image });
      } catch (error) {
        console.warn(
          "[Action.Admin.Management.Brands.Update] old image cleanup failed",
          error,
        );
      }
    }

    revalidatePath("/admin/management/store/brands");

    return {
      success: true,
      message: "Brand updated successfully",
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Brands.Update]:", error);
    return {
      success: false,
      message: "Failed to update brand. Please try again.",
    };
  }
}
