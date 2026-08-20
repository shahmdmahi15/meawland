"use server";

import db from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getMeAction } from "@/actions/auth/get-me";
import { Role, EmailDeliveryStatus } from "@/generated/prisma/enums";
import { sendEmail } from "@/lib/mail";
import { wrapEmailHtml } from "@/lib/email-templates";

export interface SendQuickDirectEmailInput {
  recipients: string;
  subject: string;
  previewText?: string;
  message: string;
}

/**
 * Dispatches an immediate direct email to one or multiple recipients.
 */
export async function sendQuickDirectEmailAction(
  input: SendQuickDirectEmailInput,
): Promise<{
  success: boolean;
  message: string;
  sentCount?: number;
  failedCount?: number;
}> {
  try {
    const session = await getMeAction();
    if (session?.role !== Role.ADMIN && session?.role !== Role.OWNER) {
      return { success: false, message: "Unauthorized." };
    }

    if (!input.recipients?.trim() || !input.subject?.trim() || !input.message?.trim()) {
      return { success: false, message: "Recipients, Subject, and Message are required." };
    }

    const emailList = input.recipients
      .split(/[\n,;]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e && e.includes("@"));

    if (emailList.length === 0) {
      return { success: false, message: "No valid email addresses provided." };
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const email of emailList) {
      const formattedParagraphs = input.message
        .split("\n\n")
        .map(
          (p) =>
            `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #374151;">${p.replace(
              /\n/g,
              "<br/>",
            )}</p>`,
        )
        .join("");

      const html = wrapEmailHtml({
        title: input.subject.trim(),
        previewText: input.previewText?.trim(),
        bodyContent: `
          <h1 style="margin: 0 0 18px; font-size: 20px; font-weight: 800; color: #111827;">
            ${input.subject.trim()}
          </h1>
          ${formattedParagraphs}
          <div style="margin-top: 28px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com"}" style="display: inline-block; background-color: #56C8D8; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 12px 30px; border-radius: 12px;">
              Visit Meawland Store 🛍️
            </a>
          </div>
        `,
        recipientEmail: email,
        showUnsubscribe: true,
      });

      const res = await sendEmail({
        to: email,
        subject: input.subject.trim(),
        htmlContent: html,
        textContent: `${input.subject}\n\n${input.message}\n\nVisit: ${process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com"}`,
      });

      if (res.success) {
        sentCount++;
        await db.emailLog.create({
          data: {
            recipientEmail: email,
            subject: input.subject.trim(),
            status: EmailDeliveryStatus.SENT,
            messageId: res.messageId || null,
          },
        });
      } else {
        failedCount++;
        await db.emailLog.create({
          data: {
            recipientEmail: email,
            subject: input.subject.trim(),
            status: EmailDeliveryStatus.FAILED,
            errorMessage: res.error || "Email delivery failed",
          },
        });
      }
    }

    revalidatePath("/admin/support-marketing/marketing/email");

    return {
      success: sentCount > 0,
      message: `Direct dispatch completed: ${sentCount} sent, ${failedCount} failed.`,
      sentCount,
      failedCount,
    };
  } catch (error) {
    console.error("[Action.Email.QuickSend] Error:", error);
    return { success: false, message: "Failed to dispatch direct email." };
  }
}
