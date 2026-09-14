"use server";

import db from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";

export type StoreSlider = {
  id: string;
  image: string;
  text: string;
  buttonText: string;
  buttonLink: string;
};

const FALLBACK_SLIDERS: StoreSlider[] = [
  {
    id: "fallback-1",
    image: "/fallback-slider.webp",
    text: "Meawland - Everything for Your Beloved Pets",
    buttonText: "Shop Now",
    buttonLink: "/products",
  },
];

export async function getSlidersAction(): Promise<{
  success: boolean;
  message: string;
  sliders: StoreSlider[];
}> {
  try {
    const sliders = await db.slider.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (sliders.length === 0) {
      return {
        success: true,
        message: "No database sliders found, using fallback",
        sliders: FALLBACK_SLIDERS,
      };
    }

    const slidersWithUrl = sliders.map((slider) => ({
      id: slider.id,
      text: slider.text,
      buttonText: slider.buttonText,
      buttonLink: slider.buttonLink,
      image: getPublicUrl(slider.image, "/fallback-slider.webp"),
    }));

    return {
      success: true,
      message: "Successfully retrieved sliders for storefront",
      sliders: slidersWithUrl,
    };
  } catch (error) {
    console.error("[Action.Store.Sliders.Get]:", error);
    return {
      success: false,
      message: "Failed to retrieve sliders, using fallback",
      sliders: FALLBACK_SLIDERS,
    };
  }
}
