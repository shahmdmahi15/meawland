"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import db from "@/lib/db";
import { Role } from "@/generated/prisma/enums";

export type NavbarAccount = {
  avatar: string | null;
  email: string;
  id: string;
  name: string;
  role: Role;
  code: string;
};

export async function getMeAction(): Promise<NavbarAccount | null> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;
    if (!rawToken) return null;

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
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
            code: true,
          },
        },
      },
    });

    if (!session) return null;

    if (session.expiresAt < new Date()) {
      await db.session.delete({
        where: {
          id: session.id,
        },
      });
      return null;
    }

    return session.user || null;
  } catch (error) {
    console.error("[Actions.Auth.GetNavbarAccount]:", error);
    return null;
  }
}
