"use server";

import db from "@/lib/db";
import { getImageBase64 } from "@/lib/storage";
import {
  getActiveCampaigns,
  matchProductCampaign,
  matchComboCampaign,
  type ProductCampaignBadge,
} from "@/lib/campaign-helper";
import {
  formatCategoryToSlug,
  formatCategorySlugToTitle,
} from "@/lib/category-helpers";
import { Category, AttributeType } from "@/generated/prisma/enums";

export type AttributeOption = {
  name: string; // e.g. "White", "Small", "Half Kg"
  value: string; // e.g. "#ffffff", "S", "500g"
};

export type AttributeGroup = {
  type: AttributeType;
  title: string; // e.g. "Color", "Size", "Weight"
  options: AttributeOption[];
};

export type ProductDetailVariant = {
  id: string;
  sku: string;
  image: string;
  regularPrice: string;
  salePrice: string;
  numericPrice: number;
  numericOriginalPrice?: number;
  stock: number;
  attributes: Array<{
    type: AttributeType;
    name: string;
    value: string;
  }>;
};

export type ComboBundleItem = {
  id: string;
  name: string;
  slug: string;
  image: string;
  regularPrice?: string | null;
  salePrice?: string | null;
  variantTitle?: string;
  stock: number;
  isVariant?: boolean;
};

export type RelatedProductItem = {
  id: string;
  name: string;
  slug: string;
  code: string;
  sku: string;
  price: string;
  originalPrice?: string;
  numericPrice: number;
  numericOriginalPrice?: number;
  discountPercent?: number;
  campaignBadge?: ProductCampaignBadge | null;
  image: string;
  isVariable: boolean;
  stock: number;
  brandName?: string;
  subCategoryName?: string;
};

export type ProductDetailData = {
  id: string;
  itemType: "PRODUCT" | "COMBO";
  name: string;
  code: string;
  slug: string;
  sku: string;
  shortDescription: string;
  longDescription: string;
  image: string;
  gallery: string[];
  isVariable: boolean;
  price: string;
  originalPrice?: string;
  numericPrice: number;
  numericOriginalPrice?: number;
  priceRange?: {
    min: number;
    max: number;
    formatted: string;
  };
  discountPercent?: number;
  stock: number;
  isOutOfStock: boolean;
  campaignBadge?: ProductCampaignBadge | null;
  categoryEnum?: Category | null;
  categoryTitle?: string;
  categorySlug?: string;
  subCategoryName?: string;
  subCategorySlug?: string;
  brandName?: string;
  brandSlug?: string;
  variants: ProductDetailVariant[];
  attributeGroups: AttributeGroup[];
  comboProducts?: ComboBundleItem[];
  relatedProducts: RelatedProductItem[];
};

async function safeGetImageBase64(
  key: string | null | undefined,
  fallback = "/fallback-product.png",
): Promise<string> {
  if (!key) return fallback;
  try {
    return await getImageBase64(key);
  } catch {
    return fallback;
  }
}

export async function getProductDetailsAction(slug: string): Promise<{
  success: boolean;
  notFound?: boolean;
  message?: string;
  product?: ProductDetailData;
}> {
  try {
    const activeCampaigns = await getActiveCampaigns();

    // 1. Try finding regular Product
    const product = await db.product.findUnique({
      where: { slug },
      include: {
        subCategory: true,
        brand: true,
        variants: {
          include: {
            attributes: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (product) {
      const [mainImage, ...galleryImages] = await Promise.all([
        safeGetImageBase64(product.image),
        ...(product.gallery || []).map((g) => safeGetImageBase64(g)),
      ]);

      const allGallery = [
        mainImage,
        ...galleryImages.filter((g) => g && g !== "/fallback-product.png"),
      ];

      // Process variants
      const processedVariants: ProductDetailVariant[] = await Promise.all(
        product.variants.map(async (v) => {
          const varImage = v.image
            ? await safeGetImageBase64(v.image)
            : mainImage;
          const reg = parseFloat(v.regularPrice || "0");
          const sale =
            v.salePrice && v.salePrice !== v.regularPrice
              ? parseFloat(v.salePrice)
              : undefined;
          const numericPrice = sale && sale > 0 ? sale : reg;

          return {
            id: v.id,
            sku: v.sku,
            image: varImage,
            regularPrice: `${v.regularPrice} tk`,
            salePrice: v.salePrice
              ? `${v.salePrice} tk`
              : `${v.regularPrice} tk`,
            numericPrice,
            numericOriginalPrice: sale ? reg : undefined,
            stock: v.stock ?? 0,
            attributes: v.attributes.map((a) => ({
              type: a.type,
              name: a.name,
              value: a.value,
            })),
          };
        }),
      );

      // Attribute Groups (COLOR, SIZE, WEIGHT)
      const groupMap = new Map<AttributeType, Map<string, string>>();
      product.variants.forEach((v) => {
        v.attributes.forEach((a) => {
          if (!groupMap.has(a.type)) {
            groupMap.set(a.type, new Map<string, string>());
          }
          // Key by name, store value
          groupMap.get(a.type)!.set(a.name, a.value);
        });
      });

      const typeTitles: Record<AttributeType, string> = {
        [AttributeType.COLOR]: "Color",
        [AttributeType.SIZE]: "Size",
        [AttributeType.WEIGHT]: "Weight",
      };

      const attributeGroups: AttributeGroup[] = Array.from(
        groupMap.entries(),
      ).map(([type, optMap]) => ({
        type,
        title: typeTitles[type] || type,
        options: Array.from(optMap.entries()).map(([name, value]) => ({
          name,
          value,
        })),
      }));

      // Calculate initial pricing & stock
      let price = "0 tk";
      let originalPrice: string | undefined = undefined;
      let numericPrice = 0;
      let numericOriginalPrice: number | undefined = undefined;
      let priceRange:
        { min: number; max: number; formatted: string } | undefined = undefined;
      let totalStock = 0;

      if (product.isVariable && processedVariants.length > 0) {
        const prices = processedVariants.map((v) => v.numericPrice);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);

        if (minPrice === maxPrice) {
          price = `${minPrice} tk`;
        } else {
          price = `${minPrice} tk - ${maxPrice} tk`;
          priceRange = {
            min: minPrice,
            max: maxPrice,
            formatted: `${minPrice} tk - ${maxPrice} tk`,
          };
        }
        numericPrice = minPrice;
        totalStock = processedVariants.reduce((sum, v) => sum + v.stock, 0);
      } else {
        const reg = parseFloat(product.regularPrice || "0");
        const sale =
          product.salePrice && product.salePrice !== product.regularPrice
            ? parseFloat(product.salePrice)
            : undefined;
        numericPrice = sale && sale > 0 ? sale : reg;
        price = `${numericPrice} tk`;
        if (sale && sale < reg) {
          originalPrice = `${reg} tk`;
          numericOriginalPrice = reg;
        }
        totalStock = product.stock ?? 0;
      }

      const discountPercent =
        numericOriginalPrice && numericOriginalPrice > numericPrice
          ? Math.round(
              ((numericOriginalPrice - numericPrice) / numericOriginalPrice) *
                100,
            )
          : undefined;

      const campaignBadge = matchProductCampaign(
        product.id,
        product.variants.map((v) => v.id),
        activeCampaigns,
        {
          categoryEnum: product.subCategory.category,
          subCategoryId: product.subCategoryId,
          brandId: product.brandId,
        },
      );

      // Fetch Related Products (same subcategory -> same category -> other products)
      let relatedDbProducts = await db.product.findMany({
        where: {
          subCategoryId: product.subCategoryId,
          id: { not: product.id },
        },
        include: {
          subCategory: true,
          brand: true,
          variants: true,
        },
        take: 6,
        orderBy: { createdAt: "desc" },
      });

      if (relatedDbProducts.length < 4) {
        const existingIds = [product.id, ...relatedDbProducts.map((p) => p.id)];
        const moreProducts = await db.product.findMany({
          where: {
            subCategory: { category: product.subCategory.category },
            id: { notIn: existingIds },
          },
          include: {
            subCategory: true,
            brand: true,
            variants: true,
          },
          take: 6 - relatedDbProducts.length,
          orderBy: { createdAt: "desc" },
        });
        relatedDbProducts = [...relatedDbProducts, ...moreProducts];
      }

      if (relatedDbProducts.length < 4) {
        const existingIds = [product.id, ...relatedDbProducts.map((p) => p.id)];
        const generalProducts = await db.product.findMany({
          where: {
            id: { notIn: existingIds },
          },
          include: {
            subCategory: true,
            brand: true,
            variants: true,
          },
          take: 6 - relatedDbProducts.length,
          orderBy: { createdAt: "desc" },
        });
        relatedDbProducts = [...relatedDbProducts, ...generalProducts];
      }

      const relatedProducts: RelatedProductItem[] = await Promise.all(
        relatedDbProducts.map(async (rp) => {
          const rpImg = await safeGetImageBase64(rp.image);
          let rpPrice = "0 tk";
          let rpOrigPrice: string | undefined = undefined;
          let rpNumPrice = 0;
          let rpNumOrig: number | undefined = undefined;

          if (rp.isVariable && rp.variants.length > 0) {
            const fv = rp.variants[0];
            const hasSale = fv.salePrice && fv.salePrice !== fv.regularPrice;
            if (hasSale) {
              rpPrice = `${fv.salePrice} tk`;
              rpOrigPrice = `${fv.regularPrice} tk`;
              rpNumPrice = parseFloat(fv.salePrice || "0");
              rpNumOrig = parseFloat(fv.regularPrice || "0");
            } else {
              rpPrice = `${fv.regularPrice} tk`;
              rpNumPrice = parseFloat(fv.regularPrice || "0");
            }
          } else {
            const hasSale = rp.salePrice && rp.salePrice !== rp.regularPrice;
            if (hasSale) {
              rpPrice = `${rp.salePrice} tk`;
              rpOrigPrice = `${rp.regularPrice} tk`;
              rpNumPrice = parseFloat(rp.salePrice || "0");
              rpNumOrig = parseFloat(rp.regularPrice || "0");
            } else {
              rpPrice = `${rp.regularPrice || 0} tk`;
              rpNumPrice = parseFloat(rp.regularPrice || "0");
            }
          }

          const rpDiscount =
            rpNumOrig && rpNumOrig > rpNumPrice
              ? Math.round(((rpNumOrig - rpNumPrice) / rpNumOrig) * 100)
              : undefined;

          const rpBadge = matchProductCampaign(
            rp.id,
            rp.variants.map((v) => v.id),
            activeCampaigns,
            {
              categoryEnum: rp.subCategory.category,
              subCategoryId: rp.subCategoryId,
              brandId: rp.brandId,
            },
          );

          return {
            id: rp.id,
            name: rp.name,
            slug: rp.slug,
            code: rp.code,
            sku: rp.sku,
            price: rpPrice,
            originalPrice: rpOrigPrice,
            numericPrice: rpNumPrice,
            numericOriginalPrice: rpNumOrig,
            discountPercent: rpDiscount,
            campaignBadge: rpBadge,
            image: rpImg,
            isVariable: rp.isVariable,
            stock: rp.isVariable
              ? rp.variants.reduce((s, v) => s + (v.stock || 0), 0)
              : (rp.stock ?? 0),
            brandName: rp.brand?.name,
            subCategoryName: rp.subCategory.name,
          };
        }),
      );

      const categorySlug = formatCategoryToSlug(product.subCategory.category);
      const categoryTitle = formatCategorySlugToTitle(categorySlug);

      return {
        success: true,
        product: {
          id: product.id,
          itemType: "PRODUCT",
          name: product.name,
          code: product.code,
          slug: product.slug,
          sku: product.sku,
          shortDescription: product.shortDescription,
          longDescription: product.longDescription,
          image: mainImage,
          gallery: allGallery,
          isVariable: product.isVariable,
          price,
          originalPrice,
          numericPrice,
          numericOriginalPrice,
          priceRange,
          discountPercent,
          stock: totalStock,
          isOutOfStock: totalStock <= 0,
          campaignBadge,
          categoryEnum: product.subCategory.category,
          categoryTitle,
          categorySlug,
          subCategoryName: product.subCategory.name,
          subCategorySlug: product.subCategory.slug,
          brandName: product.brand?.name,
          brandSlug: product.brand?.slug,
          variants: processedVariants,
          attributeGroups,
          relatedProducts,
        },
      };
    }

    // 2. Try finding Combo Product
    const combo = await db.comboProduct.findUnique({
      where: { slug },
      include: {
        products: {
          include: {
            subCategory: true,
            brand: true,
          },
        },
        variants: {
          include: {
            product: {
              include: {
                subCategory: true,
                brand: true,
              },
            },
            attributes: true,
          },
        },
      },
    });

    if (combo) {
      const [mainImage, ...galleryImages] = await Promise.all([
        safeGetImageBase64(combo.image),
        ...(combo.gallery || []).map((g) => safeGetImageBase64(g)),
      ]);

      const allGallery = [
        mainImage,
        ...galleryImages.filter((g) => g && g !== "/fallback-product.png"),
      ];

      const reg = parseFloat(combo.regularPrice || "0");
      const sale =
        combo.salePrice && combo.salePrice !== combo.regularPrice
          ? parseFloat(combo.salePrice)
          : undefined;
      const numericPrice = sale && sale > 0 ? sale : reg;
      const price = `${numericPrice} tk`;
      const originalPrice = sale && sale < reg ? `${reg} tk` : undefined;
      const numericOriginalPrice = sale && sale < reg ? reg : undefined;
      const discountPercent =
        numericOriginalPrice && numericOriginalPrice > numericPrice
          ? Math.round(
              ((numericOriginalPrice - numericPrice) / numericOriginalPrice) *
                100,
            )
          : undefined;

      const campaignBadge = matchComboCampaign(combo.id, activeCampaigns);

      // Process bundled items (both standalone products and specific variants)
      const bundledProducts: ComboBundleItem[] = await Promise.all(
        combo.products.map(async (cp) => ({
          id: cp.id,
          name: cp.name,
          slug: cp.slug,
          image: await safeGetImageBase64(cp.image),
          regularPrice: cp.regularPrice ? `${cp.regularPrice} tk` : null,
          salePrice: cp.salePrice ? `${cp.salePrice} tk` : null,
          stock: cp.stock ?? 0,
          isVariant: false,
        })),
      );

      const bundledVariants: ComboBundleItem[] = await Promise.all(
        combo.variants.map(async (cv) => {
          const varImage = cv.image
            ? await safeGetImageBase64(cv.image)
            : await safeGetImageBase64(cv.product.image);
          const attrLabel = cv.attributes.map((a) => a.name).join(" • ");
          return {
            id: cv.id,
            name: `${cv.product.name}${attrLabel ? ` (${attrLabel})` : ""}`,
            slug: cv.product.slug,
            image: varImage,
            regularPrice: cv.regularPrice ? `${cv.regularPrice} tk` : null,
            salePrice: cv.salePrice ? `${cv.salePrice} tk` : null,
            variantTitle: attrLabel || undefined,
            stock: cv.stock ?? 0,
            isVariant: true,
          };
        }),
      );

      const allBundledItems = [...bundledProducts, ...bundledVariants];

      // True combo stock is bottlenecked by the minimum stock of all bundled products/variants
      const comboStock =
        allBundledItems.length > 0
          ? Math.min(...allBundledItems.map((item) => item.stock))
          : 0;

      const isComboOutOfStock = comboStock <= 0;

      // Fetch Related Combos / Products
      const relatedCombos = await db.comboProduct.findMany({
        where: { id: { not: combo.id } },
        take: 4,
      });

      const relatedComboItems: RelatedProductItem[] = await Promise.all(
        relatedCombos.map(async (rc) => {
          const rcImg = await safeGetImageBase64(rc.image);
          const rcReg = parseFloat(rc.regularPrice || "0");
          const rcSale = rc.salePrice ? parseFloat(rc.salePrice) : undefined;
          const rcNum = rcSale || rcReg;
          return {
            id: rc.id,
            name: rc.name,
            slug: rc.slug,
            code: rc.code,
            sku: rc.sku,
            price: `${rcNum} tk`,
            originalPrice: rcSale ? `${rcReg} tk` : undefined,
            numericPrice: rcNum,
            numericOriginalPrice: rcSale ? rcReg : undefined,
            discountPercent: rcSale
              ? Math.round(((rcReg - rcSale) / rcReg) * 100)
              : undefined,
            image: rcImg,
            isVariable: false,
            stock: 99,
          };
        }),
      );

      let relatedProducts = relatedComboItems;
      if (relatedProducts.length < 4) {
        const extraProducts = await db.product.findMany({
          include: {
            subCategory: true,
            brand: true,
            variants: true,
          },
          take: 4 - relatedProducts.length,
          orderBy: { createdAt: "desc" },
        });

        const extraItems: RelatedProductItem[] = await Promise.all(
          extraProducts.map(async (ep) => {
            const epImg = await safeGetImageBase64(ep.image);
            const epReg = parseFloat(ep.regularPrice || "0");
            const epSale = ep.salePrice ? parseFloat(ep.salePrice) : undefined;
            const epNum = epSale || epReg;
            return {
              id: ep.id,
              name: ep.name,
              slug: ep.slug,
              code: ep.code,
              sku: ep.sku,
              price: `${epNum} tk`,
              originalPrice: epSale ? `${epReg} tk` : undefined,
              numericPrice: epNum,
              numericOriginalPrice: epSale ? epReg : undefined,
              discountPercent: epSale
                ? Math.round(((epReg - epSale) / epReg) * 100)
                : undefined,
              image: epImg,
              isVariable: ep.isVariable,
              stock: ep.stock ?? 0,
              brandName: ep.brand?.name,
              subCategoryName: ep.subCategory?.name,
            };
          }),
        );
        relatedProducts = [...relatedProducts, ...extraItems];
      }

      return {
        success: true,
        product: {
          id: combo.id,
          itemType: "COMBO",
          name: combo.name,
          code: combo.code,
          slug: combo.slug,
          sku: combo.sku,
          shortDescription: combo.shortDescription,
          longDescription: combo.longDescription,
          image: mainImage,
          gallery: allGallery,
          isVariable: false,
          price,
          originalPrice,
          numericPrice,
          numericOriginalPrice,
          discountPercent,
          stock: comboStock,
          isOutOfStock: isComboOutOfStock,
          campaignBadge,
          variants: [],
          attributeGroups: [],
          comboProducts: allBundledItems,
          relatedProducts,
        },
      };
    }

    return {
      success: false,
      notFound: true,
      message: "Product not found.",
    };
  } catch (error) {
    console.error("[Action.Store.GetProductDetails] Error:", error);
    return {
      success: false,
      message: "Failed to load product details.",
    };
  }
}
