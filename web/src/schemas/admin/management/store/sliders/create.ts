import { z } from "zod";

export const createSliderSchema = z.object({
  text: z
    .string()
    .min(1, "Text is required")
    .max(200, "Text must be less than 200 characters"),
  buttonText: z
    .string()
    .min(1, "Button text is required")
    .max(50, "Button text must be less than 50 characters"),
  buttonLink: z
    .string()
    .min(1, "Button link is required")
    .max(500, "Button link must be less than 500 characters"),
  image: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "Image must be less than 5MB",
    )
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp"].includes(file.type),
      "Image must be PNG, JPG, or WebP",
    ),
});

export type CreateSliderInput = z.infer<typeof createSliderSchema>;
export type CreateSliderError = z.inferFlattenedErrors<
  typeof createSliderSchema
>;
