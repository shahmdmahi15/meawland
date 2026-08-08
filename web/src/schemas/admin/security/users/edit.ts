import { Role } from "@/generated/prisma/enums";
import { BANGLADESH_DISTRICTS } from "@/lib/bangladesh-districts";
import { z } from "zod";

export const userEditSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email(),
  phone: z.string(),
  district: z.enum(BANGLADESH_DISTRICTS),
  address: z.string(),
  role: z.enum(Role),
});

export type UserEditInput = z.infer<typeof userEditSchema>;
