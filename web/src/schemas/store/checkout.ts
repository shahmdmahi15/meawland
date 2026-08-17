import { z } from "zod";
import { PaymentMethod } from "@/generated/prisma/enums";

export const placeOrderSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address")
    .toLowerCase(),
  phone: z
    .string()
    .trim()
    .min(11, "Phone number must be at least 11 digits")
    .max(15, "Phone number is too long")
    .regex(/^[0-9+\s-]+$/, "Please enter a valid phone number"),
  district: z.string().trim().min(1, "Please select a district"),
  address: z
    .string()
    .trim()
    .min(5, "Delivery address must be at least 5 characters"),
  note: z
    .string()
    .trim()
    .max(500, "Note cannot exceed 500 characters")
    .optional()
    .nullable(),
  paymentMethod: z.nativeEnum(PaymentMethod, {
    message: "Please select a valid payment method (Cash on Delivery or bKash)",
  }),
  couponCode: z.string().trim().max(50).optional().nullable(),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;
