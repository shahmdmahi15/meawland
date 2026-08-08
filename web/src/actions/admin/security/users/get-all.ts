"use server";

import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import db from "@/lib/db";

export type GetAllUsersType = {
  code: string;
  id: string;
  role: Role;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: Date;
  updatedAt: Date;
}[];

export async function getAllUsers(): Promise<{
  success: boolean;
  message: string;
  users?: GetAllUsersType;
}> {
  try {
    const current = await getMeAction();
    if (current?.role !== Role.OWNER) {
      return {
        success: false,
        message: "Unautorized",
      };
    }

    const users = await db.user.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        code: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      message: "User Fetched Successfully",
      users: users,
    };
  } catch (error) {
    console.error("[Action.Admin.Security.Users.GetAll:", error);
    return {
      success: false,
      message: "Error when fetching users",
    };
  }
}
