"use server";

import { getMeAction } from "@/actions/auth/get-me";
import {
  Role,
  AuditAction,
  AuditEntity,
  AuditSeverity,
} from "@/generated/prisma/enums";
import db from "@/lib/db";
import { recordAuditLog } from "@/lib/audit-logger";
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

    const existingUser = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        district: true,
      },
    });

    const user = await db.user.update({
      where: { id },
      data: validation.data,
    });

    const isRoleChanged =
      existingUser && existingUser.role !== validation.data.role;

    await recordAuditLog({
      action: isRoleChanged ? AuditAction.ROLE_CHANGE : AuditAction.UPDATE,
      entity: AuditEntity.USER,
      entityId: user.id,
      entityName: user.name,
      summary: isRoleChanged
        ? `Role modified from ${existingUser?.role} to ${validation.data.role} for ${user.name}`
        : `Updated user profile details for ${user.name}`,
      severity: isRoleChanged ? AuditSeverity.SECURITY : AuditSeverity.INFO,
      previousState: existingUser as Record<string, unknown>,
      newState: validation.data as Record<string, unknown>,
      userId: current.id,
      path: "/admin/security/users",
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
