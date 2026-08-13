"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
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

    const subCategoriesWithImageBase64 = await Promise.all(
      subCategories.map(async (subCategory) => {
        const base64 = await getImageBase64(subCategory.image);
        return {
          ...subCategory,
          image: base64,
          productCount: subCategory._count.products,
        };
      }),
    );

    return {
      success: true,
      message: "Sucessfully retrieved all the sub categories for admin",
      subCategories: subCategoriesWithImageBase64,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.SubCategories.GetAll:", error);
    return {
      success: false,
      message: "Failed to retireve all the subcategories for admin",
    };
  }
}
