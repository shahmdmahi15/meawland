"use server";

import db from "@/lib/db";
import { sendEmail } from "@/lib/mail";
import {
  LoginOtpError,
  LoginOtpInput,
  loginOtpSchema,
} from "@/schemas/auth/login-otp";
import crypto from "crypto";
import { cookies } from "next/headers";

export async function loginWithOtpAction(
  input: LoginOtpInput,
  userId: string,
): Promise<{ success: boolean; message?: string; errors?: LoginOtpError }> {
  try {
    const validate = await loginOtpSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: "Invalid input",
        errors: validate.error.flatten(),
      };
    }
    const otpHash = crypto
      .createHash("sha256")
      .update(validate.data.otp)
      .digest("hex");

    const userExists = await db.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      return {
        success: false,
        message: "Invalid OTP",
      };
    }

    if (userExists.otpHash !== otpHash) {
      return {
        success: false,
        message: "Invalid OTP",
      };
    }

    if (userExists.otpExpiresAt && userExists.otpExpiresAt < new Date()) {
      return {
        success: false,
        message: "OTP has expired",
      };
    }

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const sessionTokenHash = crypto
      .createHash("sha256")
      .update(sessionToken)
      .digest("hex");

    const session = await db.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userExists.id },
        data: {
          otpHash: null,
          otpExpiresAt: null,
        },
      });
      return await tx.session.create({
        data: {
          userId: user.id,
          tokenHash: sessionTokenHash,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
      });
    });

    const cookieStore = await cookies();

    cookieStore.set("__Host-SESSION_TOKEN", sessionToken, {
      expires: session.expiresAt,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
      path: "/",
    });

    const guestCartId = cookieStore.get("meawland_cart_id")?.value;
    if (guestCartId) {
      const { mergeGuestCartIntoUser } = await import("@/actions/store/cart");
      await mergeGuestCartIntoUser(userExists.id, guestCartId);
    }

    await sendEmail({
      to: userExists.email,
      subject: "New Device Login Alert",
      htmlContent: `<p>Hello ${userExists.name},</p><p>We noticed a new login to your account. If this was you, you can safely ignore this email. If not, please secure your account immediately.</p>`,
    }).catch((error) => {
      console.error("[Actions.Auth.LoginWithOtp]:", error);
    });

    return {
      success: true,
      message: "OTP verified successfully",
    };
  } catch (error) {
    console.error("[Actions.Auth.LoginWithOtp]:", error);
    return {
      success: false,
      message: "Failed to login with OTP",
    };
  }
}
