"use server";

import db from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
import { SubCategory } from "@/generated/prisma/client";

export type SubCategoryWithCount = SubCategory & { productCount: number };

export async function getAllSubCategoriesAdminAction(): Promise<{
  success: boolean;
  message: string;
  subCategories?: SubCategoryWithCount[];
}> {
  try {
    const subCategories = await db.subCategory.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const subCategoriesWithPublicUrl = subCategories.map((subCategory) => ({
      ...subCategory,
      image: getPublicUrl(subCategory.image),
      productCount: subCategory._count.products,
    }));

    return {
      success: true,
      message: "Sucessfully retrieved all the sub categories for admin",
      subCategories: subCategoriesWithPublicUrl,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.SubCategories.GetAll:", error);
    return {
      success: false,
      message: "Failed to retireve all the subcategories for admin",
    };
  }
}
