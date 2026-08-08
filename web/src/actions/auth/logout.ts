"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import db from "@/lib/db";

export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get("__Host-SESSION_TOKEN")?.value;
    if (!rawToken)
      return {
        success: false,
        message: "Session Token not Found",
      };

    const tokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    await db.session.delete({
      where: {
        tokenHash,
      },
    });

    cookieStore.delete("__Host-SESSION_TOKEN");

    return {
      success: true,
      message: "Logout Successfully",
    };
  } catch (error) {
    console.error("[Action.Auth.Logout:", error);
    return {
      success: false,
      message: "Failed to logout",
    };
  }
}
