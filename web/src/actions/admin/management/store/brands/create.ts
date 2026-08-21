"use server";

import db from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import {
  createBrandSchema,
  type CreateBrandInput,
  type CreateBrandError,
} from "@/schemas/admin/management/store/brands/create";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import {
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";

export async function createBrandAction(input: CreateBrandInput): Promise<{
  success: boolean;
  message?: string;
  errors?: CreateBrandError;
  brand?: {
    id: string;
    name: string;
    slug: string;
    image: string;
    createdAt: Date;
  };
}> {
  try {
    // Validate input
    const validate = await createBrandSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: "Invalid input",
        errors: validate.error.flatten(),
      };
    }

    // Check if slug already exists
    const existingSlug = await db.brand.findUnique({
      where: { slug: validate.data.slug },
    });

    if (existingSlug) {
      return {
        success: false,
        message: "A brand with this slug already exists",
      };
    }

    // Convert image file to buffer
    const imageBuffer = await validate.data.image.arrayBuffer();
    const imageUint8Array = new Uint8Array(imageBuffer);

    // Generate a unique key for the image
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    const extension = validate.data.image.name.split(".").pop() || "jpg";
    const imageKey = `brands/${timestamp}-${randomString}.${extension}`;

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

    // Create brand in database
    const brand = await db.brand.create({
      data: {
        name: validate.data.name,
        slug: validate.data.slug,
        image: uploadResult.key!, // Store S3 key
      },
    });

    // Revalidate paths for admin and store
    revalidatePath("/admin/management/store/brands");
    revalidatePath("/admin/management/inventory/new-product");
    revalidatePath("/admin/management/inventory/all-products");
    revalidatePath("/admin/management/inventory");
    revalidatePath("/");
    revalidatePath("/products");

    await recordAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.BRAND,
      entityId: brand.id,
      entityName: brand.name,
      summary: `Brand "${brand.name}" created`,
      severity: AuditSeverity.INFO,
      newState: { id: brand.id, name: brand.name, slug: brand.slug },
      path: "/admin/management/store/brands",
    });

    return {
      success: true,
      message: "Brand created successfully",
      brand: {
        id: brand.id,
        name: brand.name,
        slug: brand.slug,
        image: brand.image,
        createdAt: brand.createdAt,
      },
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Brands.Create]:", error);
    return {
      success: false,
      message: "Failed to create brand. Please try again.",
    };
  }
}
