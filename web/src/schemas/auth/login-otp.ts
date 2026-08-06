import { z } from "zod";

export const loginOtpSchema = z.object({
  otp: z.string().min(6, "OTP must be at least 6 characters long"),
});

export type LoginOtpInput = z.infer<typeof loginOtpSchema>;
export type LoginOtpError = z.inferFlattenedErrors<typeof loginOtpSchema>;
