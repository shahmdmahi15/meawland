"use server";

import db from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import {
  createSubCategorySchema,
  type CreateSubCategoryInput,
  type CreateSubCategoryError,
} from "@/schemas/admin/management/store/sub-categories/create";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import {
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";

export async function createSubCategoryAction(
  input: CreateSubCategoryInput,
): Promise<{
  success: boolean;
  message?: string;
  errors?: CreateSubCategoryError;
  subCategory?: {
    id: string;
    name: string;
    slug: string;
    image: string;
    category: string;
    createdAt: Date;
  };
}> {
  try {
    // Validate input
    const validate = await createSubCategorySchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: "Invalid input",
        errors: validate.error.flatten(),
      };
    }

    // Check if slug already exists
    const existingSlug = await db.subCategory.findUnique({
      where: { slug: validate.data.slug },
    });

    if (existingSlug) {
      return {
        success: false,
        message: "A sub-category with this slug already exists",
      };
    }

    // Convert image file to buffer
    const imageBuffer = await validate.data.image.arrayBuffer();
    const imageUint8Array = new Uint8Array(imageBuffer);

    // Generate a unique key for the image
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    const extension = validate.data.image.name.split(".").pop() || "jpg";
    const imageKey = `sub-categories/${validate.data.category}/${timestamp}-${randomString}.${extension}`;

    // Upload image to S3
    const uploadResult = await uploadFile({
      key: imageKey,
      body: imageUint8Array,
      contentType: validate.data.image.type,
    });

    if (!uploadResult.success) {
      return {
        success: false,
        message: "Failed to upload image. Please try again.",
      };
    }

    // Create sub-category in database
    const subCategory = await db.subCategory.create({
      data: {
        name: validate.data.name,
        slug: validate.data.slug,
        image: uploadResult.key!, // Store the S3 key (guaranteed to exist when success is true)
        category: validate.data.category,
      },
    });

    // Revalidate paths for admin and store
    revalidatePath("/admin/management/store/sub-categories");
    revalidatePath("/admin/management/inventory/new-product");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory");
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/category", "layout");

    await recordAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.CATEGORY,
      entityId: subCategory.id,
      entityName: subCategory.name,
      summary: `Subcategory "${subCategory.name}" (Parent: ${subCategory.category}) created`,
      severity: AuditSeverity.INFO,
      newState: {
        id: subCategory.id,
        name: subCategory.name,
        category: subCategory.category,
      },
      path: "/admin/management/store/sub-categories",
    });

    return {
      success: true,
      message: "Sub-category created successfully",
      subCategory: {
        id: subCategory.id,
        name: subCategory.name,
        slug: subCategory.slug,
        image: subCategory.image,
        category: subCategory.category,
        createdAt: subCategory.createdAt,
      },
    };
  } catch (error) {
    console.error("[Action.Admin.Management.SubCategories.Create]:", error);
    return {
      success: false,
      message: "Failed to create sub-category. Please try again.",
    };
  }
}
