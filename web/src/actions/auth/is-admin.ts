"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import db from "@/lib/db";
import { Role } from "@/generated/prisma/enums";

export async function isAdminAction(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;
    if (!rawToken) return false;

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    const session = await db.session.findUnique({
      where: {
        tokenHash,
      },
      include: {
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    if (!session) return false;

    if (session.expiresAt < new Date()) {
      await db.session.delete({
        where: {
          id: session.id,
        },
      });
      return false;
    }

    return (
      session.user?.role === Role.ADMIN || session.user?.role === Role.OWNER
    );
  } catch (error) {
    console.error("[Actions.Auth.isAdmin]:", error);
    return false;
  }
}
