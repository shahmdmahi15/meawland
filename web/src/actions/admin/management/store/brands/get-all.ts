"use server";

import db from "@/lib/db";
import { getPublicUrl } from "@/lib/storage";
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

    const brandsWithPublicUrl = brands.map((brand) => ({
      ...brand,
      image: getPublicUrl(brand.image),
      productCount: brand._count.products,
    }));

    return {
      success: true,
      message: "Successfully retrieved all brands for admin",
      brands: brandsWithPublicUrl,
    };
  } catch (error) {
    console.error("[Action.Admin.Management.Brands.GetAll]:", error);
    return {
      success: false,
      message: "Failed to retrieve all brands for admin",
    };
  }
}
