import { z } from "zod";

export const subscribeNewsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address")
    .max(120, "Email cannot exceed 120 characters"),
  source: z.string().default("FOOTER"),
});

export const unsubscribeNewsletterSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email address is required")
    .email("Please enter a valid email address"),
});

export type SubscribeNewsletterInput = z.infer<
  typeof subscribeNewsletterSchema
>;
export type UnsubscribeNewsletterInput = z.infer<
  typeof unsubscribeNewsletterSchema
>;
