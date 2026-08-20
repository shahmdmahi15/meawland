import { env } from "@/env";
import { SMS_ERROR_CODES } from "./types";

/**
 * Normalizes a phone number to standard Bangladeshi 13-digit format (8801XXXXXXXXX)
 */
export function sanitizeBangladeshiPhoneNumber(raw: string): string | null {
  if (!raw) return null;

  // Remove spaces, hyphens, plus signs, parentheses
  const cleaned = raw.trim().replace(/[\s\-+()]/g, "");

  // If starts with 8801 and has 13 digits
  if (/^8801[3-9]\d{8}$/.test(cleaned)) {
    return cleaned;
  }

  // If starts with 01 and has 11 digits (e.g. 01712345678)
  if (/^01[3-9]\d{8}$/.test(cleaned)) {
    return `88${cleaned}`;
  }

  // If only 10 digits starting with 1 (e.g. 1712345678)
  if (/^1[3-9]\d{8}$/.test(cleaned)) {
    return `880${cleaned}`;
  }

  return null;
}

/**
 * Normalizes an array of phone numbers and filters out invalid ones
 */
export function sanitizePhoneNumbers(numbers: string[]): string[] {
  const sanitizedList: string[] = [];
  for (const num of numbers) {
    const s = sanitizeBangladeshiPhoneNumber(num);
    if (s && !sanitizedList.includes(s)) {
      sanitizedList.push(s);
    }
  }
  return sanitizedList;
}

/**
 * Resolves human-readable error or success message from response code
 */
export function getSmsErrorMessage(code?: number | string): string {
  if (!code) return "Unknown SMS response status.";
  const key = String(code);
  return SMS_ERROR_CODES[key] || `SMS API Code: ${key}`;
}

/**
 * Returns the resolved SMS API Base URL
 */
export function getSmsBaseUrl(): string {
  const url = env.SMS_BASE_URL || "http://bulksmsbd.net/api";
  return url.endsWith("/") ? url.slice(0, -1) : url;
}
