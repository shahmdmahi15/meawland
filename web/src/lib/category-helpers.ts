import { Category } from "@/generated/prisma/enums";

export interface CategoryInfo {
  enumValue: Category;
  title: string;
  slug: string;
}

export const CATEGORY_MAP: Record<string, CategoryInfo> = {
  "pet-accessories": {
    enumValue: Category.PET_ACCESSORIES,
    title: "Pet Accessories",
    slug: "pet-accessories",
  },
  "pet-accessories": {
    enumValue: Category.PET_ACCESSORIES,
    title: "Pet Accessories",
    slug: "pet-accessories",
  },
  "pet-care": {
    enumValue: Category.PET_CARE,
    title: "Pet Care",
    slug: "pet-care",
  },
  "pet-food": {
    enumValue: Category.PET_FOOD,
    title: "Pet Food",
    slug: "pet-food",
  },
  "pet-medicine": {
    enumValue: Category.PET_MEDICINE,
    title: "Pet Medicine",
    slug: "pet-medicine",
  },
  "pet-dress": {
    enumValue: Category.PET_DRESS,
    title: "Pet Dress",
    slug: "pet-dress",
  },
  "pet-toy": {
    enumValue: Category.PET_TOY,
    title: "Pet Toy",
    slug: "pet-toy",
  },
  "pet-litter": {
    enumValue: Category.PET_LITTER,
    title: "Pet Litter",
    slug: "pet-litter",
  },
};

export function getCategoryBySlug(slug: string): CategoryInfo | null {
  const normalized = slug.toLowerCase();
  return CATEGORY_MAP[normalized] ?? null;
}

export function formatCategorySlugToTitle(slug: string): string {
  const info = getCategoryBySlug(slug);
  if (info) return info.title;
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
