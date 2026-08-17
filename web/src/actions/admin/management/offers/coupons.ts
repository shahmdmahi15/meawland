"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { Role, DiscountType, Category } from "@/generated/prisma/enums";
import { getImageBase64 } from "@/lib/storage";
import { CATEGORY_MAP } from "@/lib/category-helpers";
import {
  createCouponSchema,
  updateCouponSchema,
  deleteCouponSchema,
} from "@/schemas/admin/management/offers/coupon";

export type CouponStatus = "ACTIVE" | "EXPIRED" | "EXHAUSTED";

export type CouponCatalogUser = {
  id: string;
  name: string;
  email: string;
  code: string;
  avatar: string | null;
};

export type CouponCatalogCategory = {
  enumValue: Category;
  title: string;
  slug: string;
  productCount: number;
};

export type CouponCatalogSubCategory = {
  id: string;
  name: string;
  slug: string;
  category: Category;
  productCount: number;
};

export type CouponCatalogBrand = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  imageBase64?: string;
  productCount: number;
};

export type CouponCatalogProduct = {
  id: string;
  name: string;
  code: string;
  sku: string;
  image: string;
  imageBase64?: string;
  isVariable: boolean;
  regularPrice: string | null;
  salePrice: string | null;
  categoryName?: string;
  subCategoryId?: string;
  categoryEnum?: Category;
  brandId?: string | null;
  brandName?: string | null;
  variants: Array<{
    id: string;
    sku: string;
    image: string;
    imageBase64?: string;
    regularPrice: string;
    salePrice: string;
    attributes: Array<{
      id: string;
      name: string;
      value: string;
    }>;
  }>;
};

export type CouponCatalogCombo = {
  id: string;
  name: string;
  code: string;
  sku: string;
  image: string;
  imageBase64?: string;
  regularPrice: string | null;
  salePrice: string | null;
};

export type CouponFormData = {
  users: CouponCatalogUser[];
  categories: CouponCatalogCategory[];
  subCategories: CouponCatalogSubCategory[];
  brands: CouponCatalogBrand[];
  products: CouponCatalogProduct[];
  combos: CouponCatalogCombo[];
};

export type CouponRow = {
  id: string;
  name: string;
  couponCode: string;
  discount: string | null;
  discountType: DiscountType;
  minOrder: string | null;
  maxOrder: string | null;
  maxRedemptions: number | null;
  minPurchaseAmount: string | null;
  currentRedemptions: number;
  forAllUsers: boolean;
  forAllCategories: boolean;
  forAllSubCategories: boolean;
  forAllBrands: boolean;
  forAllProducts: boolean;
  forAllCombos: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  status: CouponStatus;
  userCount: number;
  categoryCount: number;
  subCategoryCount: number;
  brandCount: number;
  productCount: number;
  variantCount: number;
  comboCount: number;
  users: Array<{
    id: string;
    name: string;
    email: string;
    code: string;
  }>;
  categories: Category[];
  subCategories: Array<{
    id: string;
    name: string;
    category: Category;
  }>;
  brands: Array<{
    id: string;
    name: string;
  }>;
  products: Array<{
    id: string;
    name: string;
    code: string;
    image: string;
    isVariable: boolean;
  }>;
  variants: Array<{
    id: string;
    sku: string;
    productId: string;
    productName: string;
    regularPrice: string;
    salePrice: string;
  }>;
  comboProducts: Array<{
    id: string;
    name: string;
    code: string;
    image: string;
  }>;
};

export type CouponMetrics = {
  totalCoupons: number;
  activeCoupons: number;
  expiredCoupons: number;
  exhaustedCoupons: number;
  totalRedemptions: number;
};

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.error(`[Storage.GetCouponBase64] Failed for key "${key}":`, error);
    return "";
  }
}

function computeCouponStatus(
  expiresAt: Date,
  maxRedemptions: number | null,
  currentRedemptions: number,
): CouponStatus {
  if (new Date(expiresAt).getTime() < Date.now()) {
    return "EXPIRED";
  }
  if (maxRedemptions !== null && currentRedemptions >= maxRedemptions) {
    return "EXHAUSTED";
  }
  return "ACTIVE";
}

export async function getCouponFormDataAction(): Promise<{
  success: boolean;
  message?: string;
  data?: CouponFormData;
}> {
  try {
    const current = await getMeAction();
    if (
      !current ||
      (current.role !== Role.OWNER && current.role !== Role.ADMIN)
    ) {
      return { success: false, message: "Unauthorized access" };
    }

    const [rawUsers, rawSubCategories, rawBrands, rawProducts, rawCombos] =
      await Promise.all([
        db.user.findMany({
          orderBy: { name: "asc" },
          select: {
            id: true,
            name: true,
            email: true,
            code: true,
            avatar: true,
          },
        }),
        db.subCategory.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { products: true },
            },
          },
        }),
        db.brand.findMany({
          orderBy: { name: "asc" },
          include: {
            _count: {
              select: { products: true },
            },
          },
        }),
        db.product.findMany({
          orderBy: { createdAt: "desc" },
          include: {
            subCategory: {
              select: { id: true, name: true, category: true },
            },
            brand: {
              select: { id: true, name: true },
            },
            variants: {
              include: {
                attributes: {
                  select: { id: true, name: true, value: true },
                },
              },
            },
          },
        }),
        db.comboProduct.findMany({
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            code: true,
            sku: true,
            image: true,
            regularPrice: true,
            salePrice: true,
          },
        }),
      ]);

    // Categories catalog
    const categoryCounts: Record<Category, number> = {} as Record<
      Category,
      number
    >;
    Object.values(Category).forEach((cat) => {
      categoryCounts[cat] = 0;
    });
    rawProducts.forEach((p) => {
      if (p.subCategory?.category) {
        categoryCounts[p.subCategory.category] =
          (categoryCounts[p.subCategory.category] || 0) + 1;
      }
    });

    const categories: CouponCatalogCategory[] = Object.values(CATEGORY_MAP).map(
      (info) => ({
        enumValue: info.enumValue,
        title: info.title,
        slug: info.slug,
        productCount: categoryCounts[info.enumValue] || 0,
      }),
    );

    // SubCategories catalog
    const subCategories: CouponCatalogSubCategory[] = rawSubCategories.map(
      (sc) => ({
        id: sc.id,
        name: sc.name,
        slug: sc.slug,
        category: sc.category,
        productCount: sc._count.products,
      }),
    );

    // Brands catalog
    const brands: CouponCatalogBrand[] = await Promise.all(
      rawBrands.map(async (b) => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        image: b.image,
        imageBase64: await safeGetImageBase64(b.image),
        productCount: b._count.products,
      })),
    );

    // Products catalog
    const products: CouponCatalogProduct[] = await Promise.all(
      rawProducts.map(async (p) => {
        const imageBase64 = await safeGetImageBase64(p.image);
        const variantsWithImages = await Promise.all(
          p.variants.map(async (v) => ({
            ...v,
            imageBase64: await safeGetImageBase64(v.image || p.image),
          })),
        );

        return {
          id: p.id,
          name: p.name,
          code: p.code,
          sku: p.sku,
          image: p.image,
          imageBase64,
          isVariable: p.isVariable,
          regularPrice: p.regularPrice,
          salePrice: p.salePrice,
          categoryName: p.subCategory?.name,
          subCategoryId: p.subCategory?.id,
          categoryEnum: p.subCategory?.category,
          brandId: p.brand?.id,
          brandName: p.brand?.name,
          variants: variantsWithImages,
        };
      }),
    );

    const combos: CouponCatalogCombo[] = await Promise.all(
      rawCombos.map(async (c) => ({
        ...c,
        imageBase64: await safeGetImageBase64(c.image),
      })),
    );

    return {
      success: true,
      data: {
        users: rawUsers,
        categories,
        subCategories,
        brands,
        products,
        combos,
      },
    };
  } catch (error) {
    console.error("[Action.Offers.Coupons.GetFormData]:", error);
    return {
      success: false,
      message: "Failed to load coupon configuration form data",
    };
  }
}

export async function getAllCouponsAdminAction(): Promise<{
  success: boolean;
  message?: string;
  coupons?: CouponRow[];
  metrics?: CouponMetrics;
}> {
  try {
    const current = await getMeAction();
    if (
      !current ||
      (current.role !== Role.OWNER && current.role !== Role.ADMIN)
    ) {
      return { success: false, message: "Unauthorized access" };
    }

    const coupons = await db.coupon.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        users: {
          select: { id: true, name: true, email: true, code: true },
        },
        subCategories: {
          select: { id: true, name: true, category: true },
        },
        brands: {
          select: { id: true, name: true },
        },
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            image: true,
            isVariable: true,
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            productId: true,
            product: { select: { name: true } },
            regularPrice: true,
            salePrice: true,
          },
        },
        comboProducts: {
          select: { id: true, name: true, code: true, image: true },
        },
      },
    });

    let activeCoupons = 0;
    let expiredCoupons = 0;
    let exhaustedCoupons = 0;
    let totalRedemptions = 0;

    const formattedCoupons: CouponRow[] = coupons.map((c) => {
      const status = computeCouponStatus(
        c.expiresAt,
        c.maxRedemptions,
        c.currentRedemptions,
      );

      if (status === "ACTIVE") activeCoupons++;
      else if (status === "EXPIRED") expiredCoupons++;
      else if (status === "EXHAUSTED") exhaustedCoupons++;

      totalRedemptions += c.currentRedemptions;

      return {
        id: c.id,
        name: c.name,
        couponCode: c.couponCode,
        discount: c.discount,
        discountType: c.discountType,
        minOrder: c.minOrder,
        maxOrder: c.maxOrder,
        maxRedemptions: c.maxRedemptions,
        minPurchaseAmount: c.minPurchaseAmount,
        currentRedemptions: c.currentRedemptions,
        forAllUsers: c.forAllUsers,
        forAllCategories: c.forAllCategories,
        forAllSubCategories: c.forAllSubCategories,
        forAllBrands: c.forAllBrands,
        forAllProducts: c.forAllProducts,
        forAllCombos: c.forAllCombos,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        status,
        userCount: c.users.length,
        categoryCount: c.categories.length,
        subCategoryCount: c.subCategories.length,
        brandCount: c.brands.length,
        productCount: c.products.length,
        variantCount: c.variants.length,
        comboCount: c.comboProducts.length,
        users: c.users,
        categories: c.categories,
        subCategories: c.subCategories,
        brands: c.brands,
        products: c.products,
        variants: c.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          productId: v.productId,
          productName: v.product.name,
          regularPrice: v.regularPrice,
          salePrice: v.salePrice,
        })),
        comboProducts: c.comboProducts,
      };
    });

    return {
      success: true,
      coupons: formattedCoupons,
      metrics: {
        totalCoupons: formattedCoupons.length,
        activeCoupons,
        expiredCoupons,
        exhaustedCoupons,
        totalRedemptions,
      },
    };
  } catch (error) {
    console.error("[Action.Offers.Coupons.GetAll]:", error);
    return { success: false, message: "Failed to fetch coupons" };
  }
}

export async function getCouponByIdAdminAction(id: string): Promise<{
  success: boolean;
  message?: string;
  coupon?: CouponRow;
}> {
  try {
    const current = await getMeAction();
    if (
      !current ||
      (current.role !== Role.OWNER && current.role !== Role.ADMIN)
    ) {
      return { success: false, message: "Unauthorized access" };
    }

    const c = await db.coupon.findUnique({
      where: { id },
      include: {
        users: {
          select: { id: true, name: true, email: true, code: true },
        },
        subCategories: {
          select: { id: true, name: true, category: true },
        },
        brands: {
          select: { id: true, name: true },
        },
        products: {
          select: {
            id: true,
            name: true,
            code: true,
            image: true,
            isVariable: true,
          },
        },
        variants: {
          select: {
            id: true,
            sku: true,
            productId: true,
            product: { select: { name: true } },
            regularPrice: true,
            salePrice: true,
          },
        },
        comboProducts: {
          select: { id: true, name: true, code: true, image: true },
        },
      },
    });

    if (!c) {
      return { success: false, message: "Coupon not found" };
    }

    const status = computeCouponStatus(
      c.expiresAt,
      c.maxRedemptions,
      c.currentRedemptions,
    );

    return {
      success: true,
      coupon: {
        id: c.id,
        name: c.name,
        couponCode: c.couponCode,
        discount: c.discount,
        discountType: c.discountType,
        minOrder: c.minOrder,
        maxOrder: c.maxOrder,
        maxRedemptions: c.maxRedemptions,
        minPurchaseAmount: c.minPurchaseAmount,
        currentRedemptions: c.currentRedemptions,
        forAllUsers: c.forAllUsers,
        forAllCategories: c.forAllCategories,
        forAllSubCategories: c.forAllSubCategories,
        forAllBrands: c.forAllBrands,
        forAllProducts: c.forAllProducts,
        forAllCombos: c.forAllCombos,
        expiresAt: c.expiresAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        status,
        userCount: c.users.length,
        categoryCount: c.categories.length,
        subCategoryCount: c.subCategories.length,
        brandCount: c.brands.length,
        productCount: c.products.length,
        variantCount: c.variants.length,
        comboCount: c.comboProducts.length,
        users: c.users,
        categories: c.categories,
        subCategories: c.subCategories,
        brands: c.brands,
        products: c.products,
        variants: c.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          productId: v.productId,
          productName: v.product.name,
          regularPrice: v.regularPrice,
          salePrice: v.salePrice,
        })),
        comboProducts: c.comboProducts,
      },
    };
  } catch (error) {
    console.error("[Action.Offers.Coupons.GetById]:", error);
    return { success: false, message: "Failed to fetch coupon details" };
  }
}

export async function createCouponAction(rawInput: unknown): Promise<{
  success: boolean;
  message: string;
  couponId?: string;
}> {
  try {
    const current = await getMeAction();
    if (
      !current ||
      (current.role !== Role.OWNER && current.role !== Role.ADMIN)
    ) {
      return { success: false, message: "Unauthorized access" };
    }

    const parsed = createCouponSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid coupon input",
      };
    }

    const data = parsed.data;

    // Check if code already exists
    const existing = await db.coupon.findFirst({
      where: { couponCode: data.couponCode },
    });

    if (existing) {
      return {
        success: false,
        message: `Coupon with code "${data.couponCode}" already exists. Please choose a unique code.`,
      };
    }

    const created = await db.coupon.create({
      data: {
        name: data.name,
        couponCode: data.couponCode,
        discount: data.discount,
        discountType: data.discountType,
        minOrder: data.minOrder,
        maxOrder: data.maxOrder,
        maxRedemptions: data.maxRedemptions,
        minPurchaseAmount: data.minPurchaseAmount,
        forAllUsers: data.forAllUsers,
        forAllCategories: data.forAllCategories,
        forAllSubCategories: data.forAllSubCategories,
        forAllBrands: data.forAllBrands,
        forAllProducts: data.forAllProducts,
        forAllCombos: data.forAllCombos,
        expiresAt: data.expiresAt,
        categories: !data.forAllCategories ? data.categoryEnums : [],
        subCategories:
          !data.forAllSubCategories && data.subCategoryIds.length > 0
            ? { connect: data.subCategoryIds.map((id) => ({ id })) }
            : undefined,
        brands:
          !data.forAllBrands && data.brandIds.length > 0
            ? { connect: data.brandIds.map((id) => ({ id })) }
            : undefined,
        users:
          !data.forAllUsers && data.userIds.length > 0
            ? { connect: data.userIds.map((id) => ({ id })) }
            : undefined,
        products:
          !data.forAllProducts && data.productIds.length > 0
            ? { connect: data.productIds.map((id) => ({ id })) }
            : undefined,
        variants:
          !data.forAllProducts && data.variantIds.length > 0
            ? { connect: data.variantIds.map((id) => ({ id })) }
            : undefined,
        comboProducts:
          !data.forAllCombos && data.comboProductIds.length > 0
            ? { connect: data.comboProductIds.map((id) => ({ id })) }
            : undefined,
      },
    });

    revalidatePath("/admin/management/offers/coupons");
    return {
      success: true,
      message: `Coupon "${created.couponCode}" created successfully`,
      couponId: created.id,
    };
  } catch (error) {
    console.error("[Action.Offers.Coupons.Create]:", error);
    return {
      success: false,
      message: "An unexpected error occurred while creating the coupon",
    };
  }
}

export async function updateCouponAction(rawInput: unknown): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const current = await getMeAction();
    if (
      !current ||
      (current.role !== Role.OWNER && current.role !== Role.ADMIN)
    ) {
      return { success: false, message: "Unauthorized access" };
    }

    const parsed = updateCouponSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid coupon input",
      };
    }

    const data = parsed.data;

    // Check code collision with other coupons
    const conflict = await db.coupon.findFirst({
      where: {
        couponCode: data.couponCode,
        NOT: { id: data.couponId },
      },
    });

    if (conflict) {
      return {
        success: false,
        message: `Coupon with code "${data.couponCode}" is already in use by another coupon.`,
      };
    }

    await db.coupon.update({
      where: { id: data.couponId },
      data: {
        name: data.name,
        couponCode: data.couponCode,
        discount: data.discount,
        discountType: data.discountType,
        minOrder: data.minOrder,
        maxOrder: data.maxOrder,
        maxRedemptions: data.maxRedemptions,
        minPurchaseAmount: data.minPurchaseAmount,
        forAllUsers: data.forAllUsers,
        forAllCategories: data.forAllCategories,
        forAllSubCategories: data.forAllSubCategories,
        forAllBrands: data.forAllBrands,
        forAllProducts: data.forAllProducts,
        forAllCombos: data.forAllCombos,
        expiresAt: data.expiresAt,
        categories: !data.forAllCategories ? data.categoryEnums : [],
        subCategories: {
          set: !data.forAllSubCategories
            ? data.subCategoryIds.map((id) => ({ id }))
            : [],
        },
        brands: {
          set: !data.forAllBrands ? data.brandIds.map((id) => ({ id })) : [],
        },
        users: {
          set: !data.forAllUsers ? data.userIds.map((id) => ({ id })) : [],
        },
        products: {
          set: !data.forAllProducts
            ? data.productIds.map((id) => ({ id }))
            : [],
        },
        variants: {
          set: !data.forAllProducts
            ? data.variantIds.map((id) => ({ id }))
            : [],
        },
        comboProducts: {
          set: !data.forAllCombos
            ? data.comboProductIds.map((id) => ({ id }))
            : [],
        },
      },
    });

    revalidatePath("/admin/management/offers/coupons");
    return {
      success: true,
      message: `Coupon "${data.couponCode}" updated successfully`,
    };
  } catch (error) {
    console.error("[Action.Offers.Coupons.Update]:", error);
    return {
      success: false,
      message: "An unexpected error occurred while updating the coupon",
    };
  }
}

export async function deleteCouponAction(rawInput: unknown): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const current = await getMeAction();
    if (
      !current ||
      (current.role !== Role.OWNER && current.role !== Role.ADMIN)
    ) {
      return { success: false, message: "Unauthorized access" };
    }

    const parsed = deleteCouponSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid coupon identifier",
      };
    }

    const { couponId } = parsed.data;

    const existing = await db.coupon.findUnique({
      where: { id: couponId },
      select: { couponCode: true },
    });

    if (!existing) {
      return { success: false, message: "Coupon not found" };
    }

    await db.coupon.delete({
      where: { id: couponId },
    });

    revalidatePath("/admin/management/offers/coupons");
    return {
      success: true,
      message: `Coupon "${existing.couponCode}" has been removed`,
    };
  } catch (error) {
    console.error("[Action.Offers.Coupons.Delete]:", error);
    return {
      success: false,
      message: "Failed to delete the coupon",
    };
  }
}
