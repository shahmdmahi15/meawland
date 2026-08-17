import { z } from "zod";

export const ToggleWishlistSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export type ToggleWishlistInput = z.infer<typeof ToggleWishlistSchema>;
