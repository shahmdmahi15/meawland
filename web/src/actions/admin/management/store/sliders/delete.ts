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

export async function deleteSliderAction(sliderId: string): Promise<{
  success: boolean;
  message?: string;
}> {
  try {
    // Get the slider to retrieve the image key
    const slider = await db.slider.findUnique({
      where: { id: sliderId },
    });

    if (!slider) {
      return {
        success: false,
        message: "Slider not found",
      };
    }

    // Delete the image from S3
    if (slider.image) {
      const deleteResult = await deleteFile({
        key: slider.image,
      });

      if (!deleteResult.success) {
        console.warn(
          `[Action.Admin.Management.Sliders.Delete] Failed to delete image from S3: ${slider.image}`,
        );
        // Continue with deletion even if image delete fails
      }
    }

    // Delete the slider from database
    await db.slider.delete({
      where: { id: sliderId },
    });

    // Revalidate paths for admin and homepage
    revalidatePath("/admin/management/store/sliders");
    revalidatePath("/");

    await recordAuditLog({
      action: AuditAction.DELETE,
      entity: AuditEntity.SYSTEM_SETTINGS,
      entityId: slider.id,
      entityName: slider.text,
      summary: `Hero Banner Slider "${slider.text}" deleted`,
      severity: AuditSeverity.INFO,
      previousState: { id: slider.id, text: slider.text },
      path: "/admin/management/store/sliders",
    });

    return {
      success: true,
      message: "Slider deleted successfully",
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Sliders.Delete]:", error);
    return {
      success: false,
      message: "Failed to delete slider. Please try again.",
    };
  }
}
