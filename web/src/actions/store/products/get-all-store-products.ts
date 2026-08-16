"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
import { Category } from "@/generated/prisma/enums";

export type FilterableStoreProduct = {
  id: string;
  name: string;
  slug: string;
  code: string;
  sku: string;
  shortDescription?: string | null;
  price: string;
  originalPrice?: string;
  numericPrice: number;
  numericOriginalPrice?: number;
  discountPercent?: number;
  image: string;
  isVariable: boolean;
  stock: number;
  isStockOut: boolean;
  categoryEnum?: Category | null;
  categoryName?: string | null;
  categorySlug?: string | null;
  subCategoryId?: string | null;
  subCategoryName?: string | null;
  subCategorySlug?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  brandSlug?: string | null;
  createdAt: string;
};

export type StoreFilterMeta = {
  categories: Array<{
    enumValue: Category;
    title: string;
    slug: string;
    count: number;
  }>;
  subCategories: Array<{
    id: string;
    name: string;
    slug: string;
    category: Category;
    count: number;
  }>;
  brands: Array<{
    id: string;
    name: string;
    slug: string;
    count: number;
  }>;
  minPrice: number;
  maxPrice: number;
};

async function safeGetImageBase64(
  key: string | null | undefined,
  fallback = "/fallback-product.png",
): Promise<string> {
  if (!key) return fallback;
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.warn(
      `[GetAllStoreProducts] Failed to load S3 image for key "${key}":`,
      error,
    );
    return fallback;
  }
}

function formatCategoryEnumToTitle(category: Category): string {
  switch (category) {
    case Category.PET_ACCESSORIES:
      return "Pet Accessories";
    case Category.PET_CARE:
      return "Pet Care";
    case Category.PET_FOOD:
      return "Pet Food";
    case Category.PET_MEDICINE:
      return "Pet Medicine";
    case Category.PET_DRESS:
      return "Pet Dress";
    case Category.PET_TOY:
      return "Pet Toy";
    case Category.PET_LITTER:
      return "Pet Litter";
    default:
      return "Pet Essentials";
  }
}

function formatCategoryEnumToSlug(category: Category): string {
  switch (category) {
    case Category.PET_ACCESSORIES:
      return "pet-accessories";
    case Category.PET_CARE:
      return "pet-care";
    case Category.PET_FOOD:
      return "pet-food";
    case Category.PET_MEDICINE:
      return "pet-medicine";
    case Category.PET_DRESS:
      return "pet-dress";
    case Category.PET_TOY:
      return "pet-toy";
    case Category.PET_LITTER:
      return "pet-litter";
    default:
      return "all";
  }
}

export async function getAllStoreProductsAction(): Promise<{
  success: boolean;
  message: string;
  products: FilterableStoreProduct[];
  meta: StoreFilterMeta;
}> {
  try {
    const [dbProducts, dbSubCategories, dbBrands] = await Promise.all([
      db.product.findMany({
        include: {
          subCategory: true,
          brand: true,
          variants: {
            orderBy: {
              createdAt: "asc",
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      db.subCategory.findMany({
        orderBy: {
          name: "asc",
        },
      }),
      db.brand.findMany({
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    let minPrice = Infinity;
    let maxPrice = 0;

    const products: FilterableStoreProduct[] = await Promise.all(
      dbProducts.map(async (p) => {
        const base64Image = await safeGetImageBase64(p.image);

        let price = "0 tk";
        let originalPrice: string | undefined = undefined;
        let numericPrice = 0;
        let numericOriginalPrice: number | undefined = undefined;

        if (p.isVariable && p.variants.length > 0) {
          const firstVariant = p.variants[0];
          const hasSale =
            firstVariant.salePrice &&
            firstVariant.salePrice !== firstVariant.regularPrice;

          if (hasSale) {
            price = `${firstVariant.salePrice} tk`;
            originalPrice = `${firstVariant.regularPrice} tk`;
            numericPrice = parseFloat(firstVariant.salePrice || "0");
            numericOriginalPrice = parseFloat(firstVariant.regularPrice || "0");
          } else if (firstVariant.regularPrice) {
            price = `${firstVariant.regularPrice} tk`;
            numericPrice = parseFloat(firstVariant.regularPrice || "0");
          }
        } else {
          const hasSale = p.salePrice && p.salePrice !== p.regularPrice;

          if (hasSale) {
            price = `${p.salePrice} tk`;
            numericPrice = parseFloat(p.salePrice || "0");
            if (p.regularPrice) {
              originalPrice = `${p.regularPrice} tk`;
              numericOriginalPrice = parseFloat(p.regularPrice || "0");
            }
          } else if (p.regularPrice) {
            price = `${p.regularPrice} tk`;
            numericPrice = parseFloat(p.regularPrice || "0");
          }
        }

        if (numericPrice < minPrice) minPrice = numericPrice;
        if (numericPrice > maxPrice) maxPrice = numericPrice;

        const discountPercent =
          numericOriginalPrice && numericOriginalPrice > numericPrice
            ? Math.round(
                ((numericOriginalPrice - numericPrice) / numericOriginalPrice) *
                  100,
              )
            : undefined;

        const stock = p.isVariable
          ? p.variants.reduce((acc, v) => acc + (v.stock || 0), 0)
          : (p.stock ?? 0);

        const isStockOut = stock <= 0;

        const catEnum = p.subCategory?.category as Category | undefined;

        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          code: p.code,
          sku: p.sku,
          shortDescription: p.shortDescription,
          price,
          originalPrice,
          numericPrice,
          numericOriginalPrice,
          discountPercent,
          image: base64Image,
          isVariable: p.isVariable,
          stock,
          isStockOut,
          categoryEnum: catEnum,
          categoryName: catEnum ? formatCategoryEnumToTitle(catEnum) : null,
          categorySlug: catEnum ? formatCategoryEnumToSlug(catEnum) : null,
          subCategoryId: p.subCategoryId,
          subCategoryName: p.subCategory?.name,
          subCategorySlug: p.subCategory?.slug,
          brandId: p.brandId,
          brandName: p.brand?.name,
          brandSlug: p.brand?.slug,
          createdAt: p.createdAt.toISOString(),
        };
      }),
    );

    // Compute Category counts
    const categoriesMap: Record<Category, number> = {
      [Category.PET_ACCESSORIES]: 0,
      [Category.PET_CARE]: 0,
      [Category.PET_FOOD]: 0,
      [Category.PET_MEDICINE]: 0,
      [Category.PET_DRESS]: 0,
      [Category.PET_TOY]: 0,
      [Category.PET_LITTER]: 0,
    };

    products.forEach((p) => {
      if (p.categoryEnum && categoriesMap[p.categoryEnum] !== undefined) {
        categoriesMap[p.categoryEnum]++;
      }
    });

    const categoryList = (Object.values(Category) as Category[]).map((cat) => ({
      enumValue: cat,
      title: formatCategoryEnumToTitle(cat),
      slug: formatCategoryEnumToSlug(cat),
      count: categoriesMap[cat] || 0,
    }));

    // Compute Subcategory counts
    const subCatCounts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.subCategoryId) {
        subCatCounts[p.subCategoryId] =
          (subCatCounts[p.subCategoryId] || 0) + 1;
      }
    });

    const subCategories = dbSubCategories.map((sub) => ({
      id: sub.id,
      name: sub.name,
      slug: sub.slug,
      category: sub.category as Category,
      count: subCatCounts[sub.id] || 0,
    }));

    // Compute Brand counts
    const brandCounts: Record<string, number> = {};
    products.forEach((p) => {
      if (p.brandId) {
        brandCounts[p.brandId] = (brandCounts[p.brandId] || 0) + 1;
      }
    });

    const brands = dbBrands.map((b) => ({
      id: b.id,
      name: b.name,
      slug: b.slug,
      count: brandCounts[b.id] || 0,
    }));

    return {
      success: true,
      message: `Successfully loaded ${products.length} products`,
      products,
      meta: {
        categories: categoryList,
        subCategories,
        brands,
        minPrice: minPrice === Infinity ? 0 : minPrice,
        maxPrice: maxPrice === 0 ? 5000 : maxPrice,
      },
    };
  } catch (error) {
    console.error("[GetAllStoreProductsAction Error]:", error);
    return {
      success: false,
      message: "Failed to fetch store products",
      products: [],
      meta: {
        categories: [],
        subCategories: [],
        brands: [],
        minPrice: 0,
        maxPrice: 5000,
      },
    };
  }
}
