"use server";

import { getMeAction } from "@/actions/auth/get-me";
import { Role } from "@/generated/prisma/enums";
import db from "@/lib/db";
import {
  userEditSchema,
  type UserEditInput,
} from "@/schemas/admin/security/users/edit";
import { revalidatePath } from "next/cache";

export async function editUserAction(id: string, input: UserEditInput) {
  try {
    const current = await getMeAction();
    if (current?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized" };
    }

    const validation = await userEditSchema.safeParseAsync(input);
    if (!validation.success) {
      return {
        success: false,
        message: "Please correct the highlighted fields.",
        errors: validation.error.flatten(),
      };
    }

    const user = await db.user.update({
      where: { id },
      data: validation.data,
    });

    revalidatePath("/admin/security/users");
    revalidatePath(`/admin/security/users/${user.code}`);
    revalidatePath("/admin");

    return {
      success: true,
      message: `${user.name} was updated successfully.`,
    };
  } catch (error) {
    console.error("[Action.Admin.Security.Users.Edit]:", error);
    return {
      success: false,
      message: "Unable to update user. The email may already be in use.",
    };
  }
}
