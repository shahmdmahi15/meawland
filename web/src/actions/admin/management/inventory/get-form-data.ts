"use server";

import db from "@/lib/db";

export async function getNewProductFormDataAction(): Promise<{
  success: boolean;
  message?: string;
  subCategories: Array<{
    id: string;
    name: string;
    category: string;
    slug: string;
  }>;
  brands: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}> {
  try {
    const subCategories = await db.subCategory.findMany({
      select: {
        id: true,
        name: true,
        category: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const brands = await db.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return {
      success: true,
      subCategories,
      brands,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Inventory.GetFormData]:", error);
    return {
      success: false,
      message: "Failed to load form data.",
      subCategories: [],
      brands: [],
    };
  }
}
