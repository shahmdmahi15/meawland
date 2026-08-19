import { z } from "zod";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-districts";
import { Role } from "@/generated/prisma/enums";

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  phone: z
    .string()
    .trim()
    .regex(
      /^(\+88)?01[3-9]\d{8}$/,
      "Please enter a valid 11-digit Bangladesh phone number",
    )
    .or(z.literal("")),
  district: z
    .enum(BANGLADESH_DISTRICTS as unknown as [string, ...string[]])
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(300, "Address cannot exceed 300 characters")
    .optional(),
  avatarBase64: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export interface UserProfileDetails {
  id: string;
  code: string;
  name: string;
  email: string;
  avatar: string | null;
  phone: string | null;
  district: string | null;
  address: string | null;
  role: Role;
  hasGoogleLinked: boolean;
  createdAt: Date;
}
