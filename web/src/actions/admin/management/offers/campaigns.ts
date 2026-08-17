"use server";

import { revalidatePath } from "next/cache";
import db from "@/lib/db";
import { getMeAction } from "@/actions/auth/get-me";
import { Role, DiscountType, Category } from "@/generated/prisma/enums";
import { uploadFile, deleteFile, getImageBase64 } from "@/lib/storage";
import crypto from "crypto";
import { CATEGORY_MAP } from "@/lib/category-helpers";
import {
  createCampaignSchema,
  updateCampaignSchema,
  deleteCampaignSchema,
} from "@/schemas/admin/management/offers/campaign";
import {
  CouponCatalogCategory,
  CouponCatalogSubCategory,
  CouponCatalogBrand,
  CouponCatalogProduct,
  CouponCatalogCombo,
} from "./coupons";

export type CampaignStatus = "ACTIVE" | "EXPIRED" | "EXHAUSTED";

export type CampaignFormData = {
  categories: CouponCatalogCategory[];
  subCategories: CouponCatalogSubCategory[];
  brands: CouponCatalogBrand[];
  products: CouponCatalogProduct[];
  combos: CouponCatalogCombo[];
};

export type CampaignRow = {
  id: string;
  name: string;
  description: string;
  banner: string;
  bannerBase64?: string;
  discount: string | null;
  discountType: DiscountType;
  minPurchaseAmount: string | null;
  maxRedemptions: number | null;
  currentRedemptions: number;
  forAllCategories: boolean;
  forAllSubCategories: boolean;
  forAllBrands: boolean;
  forAllProducts: boolean;
  forAllCombos: boolean;
  endsAt: Date;
  createdAt: Date;
  updatedAt: Date;
  status: CampaignStatus;
  categoryCount: number;
  subCategoryCount: number;
  brandCount: number;
  productCount: number;
  variantCount: number;
  comboCount: number;
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

export type CampaignMetrics = {
  totalCampaigns: number;
  activeCampaigns: number;
  expiredCampaigns: number;
  totalRedemptions: number;
  avgDiscountPercent: number;
};

async function safeGetImageBase64(
  key: string | null | undefined,
): Promise<string> {
  if (!key) return "";
  try {
    return await getImageBase64(key);
  } catch (error) {
    console.error(
      `[Storage.GetCampaignBase64] Failed for key "${key}":`,
      error,
    );
    return "";
  }
}

function computeCampaignStatus(
  endsAt: Date,
  maxRedemptions: number | null,
  currentRedemptions: number,
): CampaignStatus {
  if (new Date(endsAt).getTime() < Date.now()) {
    return "EXPIRED";
  }
  if (maxRedemptions !== null && currentRedemptions >= maxRedemptions) {
    return "EXHAUSTED";
  }
  return "ACTIVE";
}

export async function getCampaignFormDataAction(): Promise<{
  success: boolean;
  message?: string;
  data?: CampaignFormData;
}> {
  try {
    const current = await getMeAction();
    if (
      !current ||
      (current.role !== Role.OWNER && current.role !== Role.ADMIN)
    ) {
      return { success: false, message: "Unauthorized access" };
    }

    const [rawSubCategories, rawBrands, rawProducts, rawCombos] =
      await Promise.all([
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
        categories,
        subCategories,
        brands,
        products,
        combos,
      },
    };
  } catch (error) {
    console.error("[Action.Offers.Campaigns.GetFormData]:", error);
    return { success: false, message: "Failed to load campaign form data" };
  }
}

export async function getAllCampaignsAdminAction(): Promise<{
  success: boolean;
  message?: string;
  campaigns?: CampaignRow[];
  metrics?: CampaignMetrics;
}> {
  try {
    const current = await getMeAction();
    if (
      !current ||
      (current.role !== Role.OWNER && current.role !== Role.ADMIN)
    ) {
      return { success: false, message: "Unauthorized access" };
    }

    const campaigns = await db.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: {
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

    let activeCampaigns = 0;
    let expiredCampaigns = 0;
    let totalRedemptions = 0;
    let percentSum = 0;
    let percentCount = 0;

    const formattedCampaigns: CampaignRow[] = await Promise.all(
      campaigns.map(async (c) => {
        const bannerBase64 = await safeGetImageBase64(c.banner);
        const status = computeCampaignStatus(
          c.endsAt,
          c.maxRedemptions,
          c.currentRedemptions,
        );

        if (status === "ACTIVE") activeCampaigns++;
        else expiredCampaigns++;

        totalRedemptions += c.currentRedemptions;

        if (c.discountType === DiscountType.PERCENTAGE && c.discount) {
          const p = parseFloat(c.discount);
          if (!isNaN(p)) {
            percentSum += p;
            percentCount++;
          }
        }

        return {
          id: c.id,
          name: c.name,
          description: c.description,
          banner: c.banner,
          bannerBase64,
          discount: c.discount,
          discountType: c.discountType,
          minPurchaseAmount: c.minPurchaseAmount,
          maxRedemptions: c.maxRedemptions,
          currentRedemptions: c.currentRedemptions,
          forAllCategories: c.forAllCategories,
          forAllSubCategories: c.forAllSubCategories,
          forAllBrands: c.forAllBrands,
          forAllProducts: c.forAllProducts,
          forAllCombos: c.forAllCombos,
          endsAt: c.endsAt,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          status,
          categoryCount: c.categories.length,
          subCategoryCount: c.subCategories.length,
          brandCount: c.brands.length,
          productCount: c.products.length,
          variantCount: c.variants.length,
          comboCount: c.comboProducts.length,
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
      }),
    );

    const avgDiscountPercent =
      percentCount > 0 ? Math.round((percentSum / percentCount) * 10) / 10 : 0;

    return {
      success: true,
      campaigns: formattedCampaigns,
      metrics: {
        totalCampaigns: formattedCampaigns.length,
        activeCampaigns,
        expiredCampaigns,
        totalRedemptions,
        avgDiscountPercent,
      },
    };
  } catch (error) {
    console.error("[Action.Offers.Campaigns.GetAll]:", error);
    return { success: false, message: "Failed to fetch campaigns" };
  }
}

export async function getCampaignByIdAdminAction(id: string): Promise<{
  success: boolean;
  message?: string;
  campaign?: CampaignRow;
}> {
  try {
    const current = await getMeAction();
    if (
      !current ||
      (current.role !== Role.OWNER && current.role !== Role.ADMIN)
    ) {
      return { success: false, message: "Unauthorized access" };
    }

    const c = await db.campaign.findUnique({
      where: { id },
      include: {
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
      return { success: false, message: "Campaign not found" };
    }

    const bannerBase64 = await safeGetImageBase64(c.banner);
    const status = computeCampaignStatus(
      c.endsAt,
      c.maxRedemptions,
      c.currentRedemptions,
    );

    return {
      success: true,
      campaign: {
        id: c.id,
        name: c.name,
        description: c.description,
        banner: c.banner,
        bannerBase64,
        discount: c.discount,
        discountType: c.discountType,
        minPurchaseAmount: c.minPurchaseAmount,
        maxRedemptions: c.maxRedemptions,
        currentRedemptions: c.currentRedemptions,
        forAllCategories: c.forAllCategories,
        forAllSubCategories: c.forAllSubCategories,
        forAllBrands: c.forAllBrands,
        forAllProducts: c.forAllProducts,
        forAllCombos: c.forAllCombos,
        endsAt: c.endsAt,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        status,
        categoryCount: c.categories.length,
        subCategoryCount: c.subCategories.length,
        brandCount: c.brands.length,
        productCount: c.products.length,
        variantCount: c.variants.length,
        comboCount: c.comboProducts.length,
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
    console.error("[Action.Offers.Campaigns.GetById]:", error);
    return { success: false, message: "Failed to fetch campaign details" };
  }
}

export async function createCampaignAction(formData: FormData): Promise<{
  success: boolean;
  message: string;
  campaignId?: string;
}> {
  try {
    const current = await getMeAction();
    if (
      !current ||
      (current.role !== Role.OWNER && current.role !== Role.ADMIN)
    ) {
      return { success: false, message: "Unauthorized access" };
    }

    const bannerFile = formData.get("banner") as File | null;
    if (!bannerFile || !(bannerFile instanceof File) || bannerFile.size === 0) {
      return {
        success: false,
        message: "Please upload a campaign banner image",
      };
    }

    if (bannerFile.size > 5 * 1024 * 1024) {
      return {
        success: false,
        message: "Banner image must be less than 5MB",
      };
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(bannerFile.type)) {
      return {
        success: false,
        message: "Banner image must be in PNG, JPG, or WebP format",
      };
    }

    const payload = {
      name: formData.get("name"),
      description: formData.get("description"),
      discountType: formData.get("discountType"),
      discount: formData.get("discount"),
      minPurchaseAmount: formData.get("minPurchaseAmount"),
      maxRedemptions: formData.get("maxRedemptions"),
      forAllCategories: formData.get("forAllCategories") === "true",
      forAllSubCategories: formData.get("forAllSubCategories") === "true",
      forAllBrands: formData.get("forAllBrands") === "true",
      forAllProducts: formData.get("forAllProducts") === "true",
      forAllCombos: formData.get("forAllCombos") === "true",
      endsAt: formData.get("endsAt"),
      categoryEnums: JSON.parse(
        (formData.get("categoryEnums") as string) || "[]",
      ),
      subCategoryIds: JSON.parse(
        (formData.get("subCategoryIds") as string) || "[]",
      ),
      brandIds: JSON.parse((formData.get("brandIds") as string) || "[]"),
      productIds: JSON.parse((formData.get("productIds") as string) || "[]"),
      variantIds: JSON.parse((formData.get("variantIds") as string) || "[]"),
      comboProductIds: JSON.parse(
        (formData.get("comboProductIds") as string) || "[]",
      ),
    };

    const parsed = createCampaignSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid campaign input",
      };
    }

    const data = parsed.data;

    // Upload banner to S3
    const arrayBuffer = await bannerFile.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const timestamp = Date.now();
    const randomHex = crypto.randomBytes(8).toString("hex");
    const extension = bannerFile.name.split(".").pop() || "jpg";
    const bannerKey = `campaigns/${timestamp}-${randomHex}.${extension}`;

    const uploadResult = await uploadFile({
      key: bannerKey,
      body: uint8Array,
      contentType: bannerFile.type,
    });

    if (!uploadResult.success) {
      return {
        success: false,
        message: "Failed to upload campaign banner image. Please try again.",
      };
    }

    const campaign = await db.campaign.create({
      data: {
        name: data.name,
        description: data.description,
        banner: uploadResult.key!,
        discount: data.discount,
        discountType: data.discountType,
        minPurchaseAmount: data.minPurchaseAmount,
        maxRedemptions: data.maxRedemptions,
        forAllCategories: data.forAllCategories,
        forAllSubCategories: data.forAllSubCategories,
        forAllBrands: data.forAllBrands,
        forAllProducts: data.forAllProducts,
        forAllCombos: data.forAllCombos,
        endsAt: data.endsAt,
        categories: !data.forAllCategories ? data.categoryEnums : [],
        subCategories:
          !data.forAllSubCategories && data.subCategoryIds.length > 0
            ? { connect: data.subCategoryIds.map((id) => ({ id })) }
            : undefined,
        brands:
          !data.forAllBrands && data.brandIds.length > 0
            ? { connect: data.brandIds.map((id) => ({ id })) }
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

    revalidatePath("/admin/management/offers/campaigns");
    return {
      success: true,
      message: `Campaign "${campaign.name}" created successfully`,
      campaignId: campaign.id,
    };
  } catch (error) {
    console.error("[Action.Offers.Campaigns.Create]:", error);
    return {
      success: false,
      message: "An unexpected error occurred while creating the campaign",
    };
  }
}

export async function updateCampaignAction(formData: FormData): Promise<{
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

    const campaignId = formData.get("campaignId") as string;
    if (!campaignId) {
      return { success: false, message: "Campaign ID is required" };
    }

    const existing = await db.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true, banner: true },
    });

    if (!existing) {
      return { success: false, message: "Campaign not found" };
    }

    const bannerFile = formData.get("banner") as File | null;
    let bannerKey = existing.banner;

    // If new banner uploaded
    if (bannerFile && bannerFile instanceof File && bannerFile.size > 0) {
      if (bannerFile.size > 5 * 1024 * 1024) {
        return {
          success: false,
          message: "Banner image must be less than 5MB",
        };
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(bannerFile.type)) {
        return {
          success: false,
          message: "Banner image must be PNG, JPG, or WebP",
        };
      }

      const arrayBuffer = await bannerFile.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      const timestamp = Date.now();
      const randomHex = crypto.randomBytes(8).toString("hex");
      const extension = bannerFile.name.split(".").pop() || "jpg";
      const newKey = `campaigns/${timestamp}-${randomHex}.${extension}`;

      const uploadResult = await uploadFile({
        key: newKey,
        body: uint8Array,
        contentType: bannerFile.type,
      });

      if (!uploadResult.success) {
        return {
          success: false,
          message: "Failed to upload new banner image",
        };
      }

      // Cleanup old banner
      if (existing.banner && existing.banner !== newKey) {
        await deleteFile({ key: existing.banner }).catch((err) =>
          console.error("[Campaign.OldBannerDeleteFailed]:", err),
        );
      }

      bannerKey = uploadResult.key!;
    }

    const payload = {
      campaignId,
      name: formData.get("name"),
      description: formData.get("description"),
      discountType: formData.get("discountType"),
      discount: formData.get("discount"),
      minPurchaseAmount: formData.get("minPurchaseAmount"),
      maxRedemptions: formData.get("maxRedemptions"),
      forAllCategories: formData.get("forAllCategories") === "true",
      forAllSubCategories: formData.get("forAllSubCategories") === "true",
      forAllBrands: formData.get("forAllBrands") === "true",
      forAllProducts: formData.get("forAllProducts") === "true",
      forAllCombos: formData.get("forAllCombos") === "true",
      endsAt: formData.get("endsAt"),
      categoryEnums: JSON.parse(
        (formData.get("categoryEnums") as string) || "[]",
      ),
      subCategoryIds: JSON.parse(
        (formData.get("subCategoryIds") as string) || "[]",
      ),
      brandIds: JSON.parse((formData.get("brandIds") as string) || "[]"),
      productIds: JSON.parse((formData.get("productIds") as string) || "[]"),
      variantIds: JSON.parse((formData.get("variantIds") as string) || "[]"),
      comboProductIds: JSON.parse(
        (formData.get("comboProductIds") as string) || "[]",
      ),
    };

    const parsed = updateCampaignSchema.safeParse(payload);
    if (!parsed.success) {
      return {
        success: false,
        message: parsed.error.issues[0]?.message ?? "Invalid campaign input",
      };
    }

    const data = parsed.data;

    await db.campaign.update({
      where: { id: campaignId },
      data: {
        name: data.name,
        description: data.description,
        banner: bannerKey,
        discount: data.discount,
        discountType: data.discountType,
        minPurchaseAmount: data.minPurchaseAmount,
        maxRedemptions: data.maxRedemptions,
        forAllCategories: data.forAllCategories,
        forAllSubCategories: data.forAllSubCategories,
        forAllBrands: data.forAllBrands,
        forAllProducts: data.forAllProducts,
        forAllCombos: data.forAllCombos,
        endsAt: data.endsAt,
        categories: !data.forAllCategories ? data.categoryEnums : [],
        subCategories: {
          set: !data.forAllSubCategories
            ? data.subCategoryIds.map((id) => ({ id }))
            : [],
        },
        brands: {
          set: !data.forAllBrands ? data.brandIds.map((id) => ({ id })) : [],
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

    revalidatePath("/admin/management/offers/campaigns");
    return {
      success: true,
      message: `Campaign "${data.name}" updated successfully`,
    };
  } catch (error) {
    console.error("[Action.Offers.Campaigns.Update]:", error);
    return {
      success: false,
      message: "An unexpected error occurred while updating the campaign",
    };
  }
}

export async function deleteCampaignAction(rawInput: unknown): Promise<{
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

    const parsed = deleteCampaignSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: "Invalid campaign identifier",
      };
    }

    const { campaignId } = parsed.data;

    const existing = await db.campaign.findUnique({
      where: { id: campaignId },
      select: { name: true, banner: true },
    });

    if (!existing) {
      return { success: false, message: "Campaign not found" };
    }

    // Delete record
    await db.campaign.delete({
      where: { id: campaignId },
    });

    // Clean up banner from S3
    if (existing.banner) {
      await deleteFile({ key: existing.banner }).catch((err) =>
        console.error("[Campaign.BannerDeleteFailed]:", err),
      );
    }

    revalidatePath("/admin/management/offers/campaigns");
    return {
      success: true,
      message: `Campaign "${existing.name}" has been removed`,
    };
  } catch (error) {
    console.error("[Action.Offers.Campaigns.Delete]:", error);
    return {
      success: false,
      message: "Failed to delete the campaign",
    };
  }
}
