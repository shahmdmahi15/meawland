import { z } from "zod";
import { StockEventType } from "@/generated/prisma/enums";

export const modifyStockSchema = z.object({
  targetType: z.enum(["PRODUCT", "VARIANT"]),
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().optional().nullable(),
  type: z.enum(StockEventType, {
    message: "Valid stock event type is required",
  }),
  adjustmentMode: z.enum(["DELTA", "SET_TOTAL"]).default("DELTA"),
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number")
    .min(0, "Quantity cannot be negative"),
  reason: z.string().min(1, "Reason is required"),
  note: z.string().optional().nullable(),
});

export type ModifyStockInput = z.infer<typeof modifyStockSchema>;
