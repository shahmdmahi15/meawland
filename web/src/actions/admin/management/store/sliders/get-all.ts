"use server";

import db from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
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

    const slidersWithPublicUrl = sliders.map((slider) => ({
      ...slider,
      image: getPublicUrl(slider.image),
    }));

    return {
      success: true,
      message: "Successfully retrieved all sliders for admin",
      sliders: slidersWithPublicUrl,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Sliders.GetAll]:", error);
    return {
      success: false,
      message: "Failed to retrieve all sliders for admin",
    };
  }
}
