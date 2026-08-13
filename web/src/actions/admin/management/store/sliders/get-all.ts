"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
import { Slider } from "@/generated/prisma/client";

export async function getAllSlidersAdminAction(): Promise<{
  success: boolean;
  message: string;
  sliders?: Slider[];
}> {
  try {
    const sliders = await db.slider.findMany({
      orderBy: { createdAt: "desc" },
    });

    const slidersWithImageBase64 = await Promise.all(
      sliders.map(async (slider) => {
        const base64 = await getImageBase64(slider.image);
        return {
          ...slider,
          image: base64,
        };
      }),
    );

    return {
      success: true,
      message: "Successfully retrieved all sliders for admin",
      sliders: slidersWithImageBase64,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Sliders.GetAll]:", error);
    return {
      success: false,
      message: "Failed to retrieve all sliders for admin",
    };
  }
}
