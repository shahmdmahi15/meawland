"use server";

import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import db from "@/lib/db";

export type GetUserDetailsForEditingType = {
  address: string | null;
  code: string;
  district: string | null;
  email: string;
  id: string;
  name: string;
  phone: string | null;
  role: Role;
};

export async function getUserDetailsForEditing(id: string): Promise<{
  success: boolean;
  message: string;
  user?: GetUserDetailsForEditingType;
}> {
  try {
    const current = await getMeAction();
    if (current?.role !== Role.OWNER) {
      return {
        success: false,
        message: "Unautorized",
      };
    }

    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        email: true,
        phone: true,
        district: true,
        address: true,
        role: true,
      },
    });

    if (!user?.id) {
      return {
        success: false,
        message: "User not found",
      };
    }

    return {
      success: true,
      message: "User Fetched Successfully",
      user: user,
    };
  } catch (error) {
    console.error("[Action.Admin.Security.Users.GetAll:", error);
    return {
      success: false,
      message: "Error when fetching users",
    };
  }
}
