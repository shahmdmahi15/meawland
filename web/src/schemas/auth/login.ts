import { z } from "zod";

export const loginSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Invalid email address"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type LoginError = z.inferFlattenedErrors<typeof loginSchema>;
