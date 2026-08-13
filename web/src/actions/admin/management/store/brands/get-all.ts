"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
import { Brand } from "@/generated/prisma/client";

export type BrandWithCount = Brand & { productCount: number };

export async function getAllBrandsAdminAction(): Promise<{
  success: boolean;
  message: string;
  brands?: BrandWithCount[];
}> {
  try {
    const brands = await db.brand.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    const brandsWithImageBase64 = await Promise.all(
      brands.map(async (brand) => {
        const base64 = await getImageBase64(brand.image);
        return {
          ...brand,
          image: base64,
          productCount: brand._count.products,
        };
      }),
    );

    return {
      success: true,
      message: "Successfully retrieved all brands for admin",
      brands: brandsWithImageBase64,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Brands.GetAll]:", error);
    return {
      success: false,
      message: "Failed to retrieve all brands for admin",
    };
  }
}
