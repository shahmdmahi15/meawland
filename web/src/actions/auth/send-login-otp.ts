"use server";

import db from "@/lib/db";
import { generateId } from "@/lib/generate-code";
import { sendEmail } from "@/lib/mail";
import { LoginError, LoginInput, loginSchema } from "@/schemas/auth/login";
import crypto from "crypto";

export async function sendLoginOtpAction(input: LoginInput): Promise<{
  success: boolean;
  message?: string;
  errors?: LoginError;
  userId?: string;
}> {
  try {
    const validate = await loginSchema.safeParseAsync(input);
    if (!validate.success) {
      return {
        success: false,
        message: "Invalid input",
        errors: validate.error.flatten(),
      };
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(otp).digest("hex");

    const userExists = await db.user.findUnique({
      where: { email: validate.data.email },
    });

    if (!userExists) {
      const user = await db.$transaction(async (tx) => {
        const code = await generateId("CUSTOMER", tx);
        return await tx.user.create({
          data: {
            code: code,
            name: validate.data.name,
            email: validate.data.email,
            otpHash: otpHash,
            otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
          },
        });
      });

      await sendEmail({
        to: user.email,
        subject: "Your Login OTP",
        htmlContent: `<p>Hello ${user.name},</p><p>Your OTP for login is: <strong>${otp}</strong></p><p>This OTP will expire in 5 minutes.</p>`,
      });

      return {
        success: true,
        message: "OTP sent to your email",
        userId: user.id,
      };
    }

    const user = await db.user.update({
      where: { email: validate.data.email },
      data: {
        name: validate.data.name,
        otpHash: otpHash,
        otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await sendEmail({
      to: user.email,
      subject: "Your Login OTP",
      htmlContent: `<p>Hello ${user.name},</p><p>Your OTP for login is: <strong>${otp}</strong></p><p>This OTP will expire in 5 minutes.</p>`,
    });

    return {
      success: true,
      message: "OTP sent to your email",
      userId: user.id,
    };
  } catch (error) {
    console.error("[Actions.Auth.SendLoginOTP]:", error);
    return {
      success: false,
      message: "Failed to send login OTP",
    };
  }
}
