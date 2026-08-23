import { z } from "zod";

export const comboSortOptions = [
  "NEWEST",
  "PRICE_ASC",
  "PRICE_DESC",
  "NAME_ASC",
  "NAME_DESC",
  "DISCOUNT_DESC",
  "SAVINGS_DESC",
] as const;

export type ComboSortOption = (typeof comboSortOptions)[number];

export const getStoreComboProductsFilterSchema = z.object({
  search: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  inStockOnly: z.coerce.boolean().optional(),
  minDiscount: z.coerce.number().optional(),
  sortBy: z.enum(comboSortOptions).optional().default("NEWEST"),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type GetStoreComboProductsFilterInput = z.infer<
  typeof getStoreComboProductsFilterSchema
>;
