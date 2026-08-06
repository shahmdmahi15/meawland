import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import * as nodemailer from "nodemailer";
import { env } from "@/env";
import "server-only";

// 1. Maintain a global structure definition to handle Next.js local HMR reloads
const globalForMail = global as unknown as {
  sesv2Client: SESv2Client | undefined;
  nodemailerTransporter: nodemailer.Transporter | undefined;
};

// 2. Initialize or reuse the SESv2 Client matching your env pattern
const sesv2Client =
  globalForMail.sesv2Client ||
  new SESv2Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

// 3. Initialize or reuse the Nodemailer Transporter
const transporter =
  globalForMail.nodemailerTransporter ||
  nodemailer.createTransport({
    name: "aws-sesv2",
    version: "1.0.0",
    send: (mail, callback) => {
      const input = mail.message.createReadStream();
      const chunks: Buffer[] = [];

      input.on("data", (chunk: Buffer) => chunks.push(chunk));

      input.on("end", async () => {
        const rawMessage = Buffer.concat(chunks);
        const command = new SendEmailCommand({
          Content: {
            Raw: {
              Data: rawMessage,
            },
          },
        });

        try {
          const response = await sesv2Client.send(command);
          const envelope = mail.data.envelope || mail.message.getEnvelope();

          const normalizedTo = Array.isArray(envelope.to)
            ? envelope.to
            : typeof envelope.to === "string"
              ? [envelope.to]
              : [];

          // FIXES: Type 2739 error by casting the object to SentMessageInfo
          callback(null, {
            messageId: response.MessageId || `ses-${Date.now()}`,
            envelope: {
              from: envelope.from || "no-reply@meawland.com",
              to: normalizedTo,
            },
            accepted: normalizedTo,
            rejected: [],
            pending: [],
            response: "250 OK",
          } as nodemailer.SentMessageInfo);
        } catch (error) {
          callback(
            error as Error,
            {
              messageId: "",
              envelope: { from: "", to: [] },
              accepted: [],
              rejected: [],
              pending: [],
              response: "ERROR",
            } as nodemailer.SentMessageInfo,
          );
        }
      });

      input.on("error", (err) => {
        callback(err, {
          messageId: "",
          envelope: { from: "", to: [] },
          accepted: [],
          rejected: [],
          pending: [],
          response: "ERROR",
        } as nodemailer.SentMessageInfo);
      });
    },
  });

// 4. Cache instances globally if we are working outside of production environments
if (process.env.NODE_ENV !== "production") {
  globalForMail.sesv2Client = sesv2Client;
  globalForMail.nodemailerTransporter = transporter;
}

// 5. Interface for explicit strict parameters
interface SendUserEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

/**
 * Clean exported delivery action leveraging the global email pipeline context
 */
export async function sendEmail({
  to,
  subject,
  htmlContent,
  textContent,
}: SendUserEmailOptions) {
  try {
    const mailOptions = {
      from: `"Meawland" <no-reply@meawland.com>`,
      to,
      subject,
      html: htmlContent,
      text: textContent,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("[Mail System Failure]:", error);
    return { success: false, error: (error as Error).message };
  }
}
