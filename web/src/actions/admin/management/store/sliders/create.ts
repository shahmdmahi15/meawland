"use server";

import db from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import {
  createSliderSchema,
  type CreateSliderInput,
  type CreateSliderError,
} from "@/schemas/admin/management/store/sliders/create";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import {
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import { recordAuditLog } from "@/lib/audit-logger";

export async function createSliderAction(input: CreateSliderInput): Promise<{
  success: boolean;
  message?: string;
  errors?: CreateSliderError;
  slider?: {
    id: string;
    text: string;
    buttonText: string;
    buttonLink: string;
    image: string;
    createdAt: Date;
  };
}> {
  try {
    // Validate input
    const validate = await createSliderSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: "Invalid input",
        errors: validate.error.flatten(),
      };
    }

    // Convert image file to buffer
    const imageBuffer = await validate.data.image.arrayBuffer();
    const imageUint8Array = new Uint8Array(imageBuffer);

    // Generate a unique key for the image
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString("hex");
    const extension = validate.data.image.name.split(".").pop() || "jpg";
    const imageKey = `sliders/${timestamp}-${randomString}.${extension}`;

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

    // Create slider in database
    const slider = await db.slider.create({
      data: {
        text: validate.data.text,
        buttonText: validate.data.buttonText,
        buttonLink: validate.data.buttonLink,
        image: uploadResult.key!,
      },
    });

    // Revalidate paths for admin and homepage
    revalidatePath("/admin/management/store/sliders");
    revalidatePath("/");

    await recordAuditLog({
      action: AuditAction.CREATE,
      entity: AuditEntity.SYSTEM_SETTINGS,
      entityId: slider.id,
      entityName: slider.text,
      summary: `Hero Banner Slider "${slider.text}" created`,
      severity: AuditSeverity.INFO,
      newState: {
        id: slider.id,
        text: slider.text,
        buttonText: slider.buttonText,
        buttonLink: slider.buttonLink,
      },
      path: "/admin/management/store/sliders",
    });

    return {
      success: true,
      message: "Slider created successfully",
      slider: {
        id: slider.id,
        text: slider.text,
        buttonText: slider.buttonText,
        buttonLink: slider.buttonLink,
        image: slider.image,
        createdAt: slider.createdAt,
      },
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Sliders.Create]:", error);
    return {
      success: false,
      message: "Failed to create slider. Please try again.",
    };
  }
}
