import { z } from "zod";
import type { FullProduct } from "@/actions/admin/management/inventory/get-all-products";

export const productStickerItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().optional(),
  title: z.string(),
  subtitle: z.string().optional(),
  price: z.string(),
  sku: z.string(),
  barcodeValue: z.string(),
  isVariable: z.boolean().default(false),
});

export type ProductStickerItem = z.infer<typeof productStickerItemSchema>;

// Exact 2 inch width x 1 inch height standard thermal label dimensions
export const STICKER_DIMENSIONS = {
  widthInches: 2,
  heightInches: 1,
  widthMm: 50.8,
  heightMm: 25.4,
  label: '2" × 1" (50.8mm × 25.4mm)',
} as const;

function formatAttribute(attr: {
  type?: string;
  name: string;
  value?: string;
}): string {
  if (attr.type) {
    const formattedType =
      attr.type.charAt(0).toUpperCase() + attr.type.slice(1).toLowerCase();
    return `${formattedType}: ${attr.name}`;
  }
  return attr.name;
}

/**
 * Extracts sticker items from a list of products according to the rule:
 * - Simple products -> 1 sticker with product title, price & SKU
 * - Variable products -> 1 sticker PER VARIANT with variant attributes (e.g. Color: Pink), variant price & variant SKU
 */
export function extractStickersFromProducts(
  products: FullProduct[],
  copiesPerItem: number = 1,
): ProductStickerItem[] {
  const stickers: ProductStickerItem[] = [];

  for (const product of products) {
    if (product.isVariable && product.variants && product.variants.length > 0) {
      // For variable products: create 1 sticker per variant
      for (const variant of product.variants) {
        const attrStr = variant.attributes?.length
          ? variant.attributes.map(formatAttribute).join(", ")
          : "";

        const price =
          variant.salePrice && parseFloat(variant.salePrice) > 0
            ? variant.salePrice
            : variant.regularPrice ||
              product.salePrice ||
              product.regularPrice ||
              "0";

        const sku = variant.sku || product.sku || product.code;

        for (let i = 0; i < copiesPerItem; i++) {
          stickers.push({
            id: `${variant.id}-${i}`,
            productId: product.id,
            variantId: variant.id,
            title: product.name,
            subtitle: attrStr || undefined,
            price: parseFloat(price).toFixed(2),
            sku,
            barcodeValue: sku,
            isVariable: true,
          });
        }
      }
    } else {
      // Simple product
      const price =
        product.salePrice && parseFloat(product.salePrice) > 0
          ? product.salePrice
          : product.regularPrice || "0";

      const sku = product.sku || product.code;
      const subtitle = product.brand?.name || undefined;

      for (let i = 0; i < copiesPerItem; i++) {
        stickers.push({
          id: `${product.id}-${i}`,
          productId: product.id,
          title: product.name,
          subtitle,
          price: parseFloat(price).toFixed(2),
          sku,
          barcodeValue: sku,
          isVariable: false,
        });
      }
    }
  }

  return stickers;
}
