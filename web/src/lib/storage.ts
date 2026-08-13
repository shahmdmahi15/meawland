import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "@/env";
import "server-only";

// 1. Maintain a global structure definition to handle Next.js local HMR reloads
const globalForStorage = global as unknown as {
  s3Client: S3Client | undefined;
};

// 2. Initialize or reuse the S3 Client matching your env pattern
const s3Client =
  globalForStorage.s3Client ||
  new S3Client({
    region: env.AWS_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    },
  });

// 3. Cache the instance globally if we are working outside of production environments
if (process.env.NODE_ENV !== "production") {
  globalForStorage.s3Client = s3Client;
}

// Name of your bucket from your IAM profile configuration
const BUCKET_NAME = env.AWS_S3_BUCKET;
const REGION = env.AWS_REGION;

// Explicit strictly-typed interfaces for your storage utilities
interface UploadFileOptions {
  key: string;
  body: Buffer | Uint8Array | Blob | string;
  contentType: string;
}

interface FileActionOptions {
  key: string;
}

/**
 * Helper to get the direct public asset URL
 */
export function getPublicUrl(key: string): string {
  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
}

/**
 * Upload a raw file buffer directly to your public meawland-bucket
 */
export async function uploadFile({
  key,
  body,
  contentType,
}: UploadFileOptions) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: contentType,
    });

    await s3Client.send(command);

    return {
      success: true,
      key,
      url: getPublicUrl(key),
    };
  } catch (error) {
    console.error("[Storage Upload Failure]:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Permanent removal of a file asset matching your IAM DeleteObject privilege
 */
export async function deleteFile({ key }: FileActionOptions) {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error("[Storage Delete Failure]:", error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Retrieves a file's buffer from S3
 */
export async function getFileBuffer(key: string): Promise<Buffer> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  const response = await s3Client.send(command);

  if (!response.Body) {
    throw new Error(`S3 GetObject returned empty body for key: ${key}`);
  }

  const byteArray = await response.Body.transformToByteArray();

  return Buffer.from(byteArray);
}

/**
 * Retrieves a image's base64 data URL from S3
 */
export async function getImageBase64(key: string): Promise<string> {
  const fileBuffer = await getFileBuffer(key);

  let mimeType = "image/png";

  if (
    fileBuffer.length >= 4 &&
    fileBuffer[0] === 0x89 &&
    fileBuffer[1] === 0x50 &&
    fileBuffer[2] === 0x4e &&
    fileBuffer[3] === 0x47
  ) {
    mimeType = "image/png";
  } else if (
    fileBuffer.length >= 2 &&
    fileBuffer[0] === 0xff &&
    fileBuffer[1] === 0xd8
  ) {
    mimeType = "image/jpeg";
  } else if (
    fileBuffer.length >= 12 &&
    fileBuffer.toString("ascii", 0, 4) === "RIFF" &&
    fileBuffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    mimeType = "image/webp";
  } else if (key.endsWith(".jpg") || key.endsWith(".jpeg")) {
    mimeType = "image/jpeg";
  } else if (key.endsWith(".webp")) {
    mimeType = "image/webp";
  }

  return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
}
