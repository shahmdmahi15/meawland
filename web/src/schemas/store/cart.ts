import { z } from "zod";

export const addToCartSchema = z
  .object({
    productId: z.string().optional(),
    variantId: z.string().optional(),
    comboProductId: z.string().optional(),
    quantity: z.coerce.number().int().min(1).default(1),
  })
  .refine((data) => data.productId || data.variantId || data.comboProductId, {
    message:
      "At least one of productId, variantId, or comboProductId must be provided.",
    path: ["productId"],
  });

export type AddToCartInput = z.infer<typeof addToCartSchema>;

export const updateCartItemQuantitySchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1"),
});

export type UpdateCartItemQuantityInput = z.infer<
  typeof updateCartItemQuantitySchema
>;

export const removeCartItemSchema = z.object({
  cartItemId: z.string().min(1, "Cart item ID is required"),
});

export type RemoveCartItemInput = z.infer<typeof removeCartItemSchema>;
