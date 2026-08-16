"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
import { Category } from "@/generated/prisma/enums";

export type QuickSearchResultProduct = {
  id: string;
  name: string;
  slug: string;
  code: string;
  sku: string;
  price: string;
  originalPrice?: string;
  image: string;
  categoryName?: string;
  brandName?: string;
};

export type QuickSearchCategorySuggestion = {
  title: string;
  slug: string;
  type: "category" | "sub-category";
};

export type QuickSearchResult = {
  products: QuickSearchResultProduct[];
  suggestions: QuickSearchCategorySuggestion[];
  totalMatches: number;
};

async function safeGetImageBase64(
  imageKey: string | null | undefined,
): Promise<string> {
  if (!imageKey) return "/placeholder-cat.png";
  if (
    imageKey.startsWith("data:") ||
    imageKey.startsWith("http://") ||
    imageKey.startsWith("https://")
  ) {
    return imageKey;
  }
  try {
    const base64 = await getImageBase64(imageKey);
    return base64 || "/placeholder-cat.png";
  } catch (error) {
    console.warn(
      `[quickSearchAction] Failed to load image for key ${imageKey}:`,
      error,
    );
    return "/placeholder-cat.png";
  }
}

export async function quickSearchAction(
  query: string,
): Promise<QuickSearchResult> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) {
    return {
      products: [],
      suggestions: [],
      totalMatches: 0,
    };
  }

  try {
    const [matchingProducts, matchingSubCategories] = await Promise.all([
      db.product.findMany({
        where: {
          OR: [
            { name: { contains: cleanQuery, mode: "insensitive" } },
            { code: { contains: cleanQuery, mode: "insensitive" } },
            { sku: { contains: cleanQuery, mode: "insensitive" } },
            { shortDescription: { contains: cleanQuery, mode: "insensitive" } },
          ],
        },
        include: {
          brand: true,
          subCategory: true,
          variants: {
            take: 1,
            orderBy: { createdAt: "asc" },
          },
        },
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
      db.subCategory.findMany({
        where: {
          name: { contains: cleanQuery, mode: "insensitive" },
        },
        take: 4,
      }),
    ]);

    const suggestions: QuickSearchCategorySuggestion[] = [];

    // Check enum categories
    const allCategories: Array<{
      enumVal: Category;
      title: string;
      slug: string;
    }> = [
      {
        enumVal: Category.PET_ACCESSORIES,
        title: "Pet Accessories",
        slug: "pet-accessories",
      },
      { enumVal: Category.PET_CARE, title: "Pet Care", slug: "pet-care" },
      { enumVal: Category.PET_FOOD, title: "Pet Food", slug: "pet-food" },
      {
        enumVal: Category.PET_MEDICINE,
        title: "Pet Medicine",
        slug: "pet-medicine",
      },
      { enumVal: Category.PET_DRESS, title: "Pet Dress", slug: "pet-dress" },
      { enumVal: Category.PET_TOY, title: "Pet Toy", slug: "pet-toy" },
      { enumVal: Category.PET_LITTER, title: "Pet Litter", slug: "pet-litter" },
    ];

    for (const cat of allCategories) {
      if (
        cat.title.toLowerCase().includes(cleanQuery) ||
        cat.slug.toLowerCase().includes(cleanQuery)
      ) {
        suggestions.push({
          title: cat.title,
          slug: `/category/${cat.slug}`,
          type: "category",
        });
      }
    }

    for (const sub of matchingSubCategories) {
      const parentCat = allCategories.find((c) => c.enumVal === sub.category);
      const parentSlug = parentCat ? parentCat.slug : "pet-accessories";
      suggestions.push({
        title: sub.name,
        slug: `/category/${parentSlug}/${sub.slug}`,
        type: "sub-category",
      });
    }

    const products: QuickSearchResultProduct[] = await Promise.all(
      matchingProducts.map(async (p) => {
        const image = await safeGetImageBase64(p.image);

        let price = "0 tk";
        let originalPrice: string | undefined = undefined;

        if (p.isVariable && p.variants.length > 0) {
          const firstVariant = p.variants[0];
          const hasSale =
            firstVariant.salePrice &&
            firstVariant.salePrice !== firstVariant.regularPrice;

          if (hasSale) {
            price = `${firstVariant.salePrice} tk`;
            originalPrice = `${firstVariant.regularPrice} tk`;
          } else if (firstVariant.regularPrice) {
            price = `${firstVariant.regularPrice} tk`;
          }
        } else {
          const hasSale = p.salePrice && p.salePrice !== p.regularPrice;
          if (hasSale) {
            price = `${p.salePrice} tk`;
            originalPrice = `${p.regularPrice} tk`;
          } else if (p.regularPrice) {
            price = `${p.regularPrice} tk`;
          }
        }

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          code: p.code,
          sku: p.sku,
          price,
          originalPrice,
          image,
          categoryName: p.subCategory?.category
            ? p.subCategory.category.replace(/_/g, " ")
            : undefined,
          brandName: p.brand?.name,
        };
      }),
    );

    return {
      products,
      suggestions: suggestions.slice(0, 4),
      totalMatches: matchingProducts.length,
    };
  } catch (error) {
    console.error("[quickSearchAction] Error searching products:", error);
    return {
      products: [],
      suggestions: [],
      totalMatches: 0,
    };
  }
}
