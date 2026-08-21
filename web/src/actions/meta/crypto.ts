import crypto from "crypto";
import { headers, cookies } from "next/headers";
import { MetaUserData, RawClientContext } from "./types";

/**
 * Generates a SHA-256 hash string for Meta CAPI compliance.
 */
export function hashSha256(val: string | null | undefined): string | null {
  if (!val) return null;
  const clean = val.trim().toLowerCase();
  if (!clean) return null;
  return crypto.createHash("sha256").update(clean).digest("hex");
}

/**
 * Normalizes phone numbers according to Meta guidelines:
 * - Strip non-digits
 * - For Bangladesh: format with country code '8801XXXXXXXX'
 */
export function normalizeAndHashPhone(
  rawPhone: string | null | undefined,
): string | null {
  if (!rawPhone) return null;
  let digits = rawPhone.replace(/\D/g, "");
  if (!digits) return null;

  // Handle local Bangladesh numbers starting with 01
  if (digits.startsWith("01") && digits.length === 11) {
    digits = `88${digits}`;
  } else if (digits.startsWith("8801") && digits.length === 13) {
    // already 8801...
  }

  return hashSha256(digits);
}

/**
 * Extracts network headers (IP, User-Agent) and Meta cookies (_fbp, _fbc) from Next.js Request.
 */
export async function getClientContextFromHeaders(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
  fbp: string | null;
  fbc: string | null;
  referer: string | null;
}> {
  try {
    const h = await headers();
    const c = await cookies();

    const forwardedFor = h.get("x-forwarded-for");
    const realIp = h.get("x-real-ip");
    const ipAddress = forwardedFor
      ? forwardedFor.split(",")[0]?.trim() || null
      : realIp || null;

    const userAgent = h.get("user-agent") || null;
    const referer = h.get("referer") || null;

    const fbp = c.get("_fbp")?.value || null;
    const fbc = c.get("_fbc")?.value || null;

    return {
      ipAddress,
      userAgent,
      fbp,
      fbc,
      referer,
    };
  } catch {
    return {
      ipAddress: null,
      userAgent: null,
      fbp: null,
      fbc: null,
      referer: null,
    };
  }
}

/**
 * Prepares a fully normalized and hashed MetaUserData object.
 */
export function buildMetaUserData(
  ctx: RawClientContext,
  headerContext: {
    ipAddress: string | null;
    userAgent: string | null;
    fbp: string | null;
    fbc: string | null;
  },
): MetaUserData {
  const userData: MetaUserData = {};

  // Email
  if (ctx.email) {
    const hashedEmail = hashSha256(ctx.email);
    if (hashedEmail) userData.em = [hashedEmail];
  }

  // Phone
  if (ctx.phone) {
    const hashedPhone = normalizeAndHashPhone(ctx.phone);
    if (hashedPhone) userData.ph = [hashedPhone];
  }

  // Name splitting
  if (ctx.firstName || ctx.lastName) {
    if (ctx.firstName) {
      const hFn = hashSha256(ctx.firstName);
      if (hFn) userData.fn = [hFn];
    }
    if (ctx.lastName) {
      const hLn = hashSha256(ctx.lastName);
      if (hLn) userData.ln = [hLn];
    }
  } else if (ctx.name) {
    const parts = ctx.name.trim().split(" ");
    const fn = parts[0];
    const ln = parts.slice(1).join(" ");
    if (fn) {
      const hFn = hashSha256(fn);
      if (hFn) userData.fn = [hFn];
    }
    if (ln) {
      const hLn = hashSha256(ln);
      if (hLn) userData.ln = [hLn];
    }
  }

  // Location / District
  if (ctx.district || ctx.city) {
    const city = ctx.city || ctx.district;
    const hCt = hashSha256(city);
    if (hCt) {
      userData.ct = [hCt];
      userData.st = [hCt];
    }
  }

  if (ctx.zipCode) {
    const hZp = hashSha256(ctx.zipCode);
    if (hZp) userData.zp = [hZp];
  }

  // Default Country: Bangladesh (bd)
  const hCountry = hashSha256("bd");
  if (hCountry) userData.country = [hCountry];

  // User external id
  if (ctx.userId) {
    const hExt = hashSha256(ctx.userId);
    if (hExt) userData.external_id = [hExt];
  }

  // Client IP & User Agent (unhashed)
  const resolvedIp = ctx.clientIp || headerContext.ipAddress;
  if (resolvedIp) userData.client_ip_address = resolvedIp;

  const resolvedUa = ctx.userAgent || headerContext.userAgent;
  if (resolvedUa) userData.client_user_agent = resolvedUa;

  // Browser Cookies (unhashed)
  const resolvedFbp = ctx.fbp || headerContext.fbp;
  if (resolvedFbp) userData.fbp = resolvedFbp;

  const resolvedFbc = ctx.fbc || headerContext.fbc;
  if (resolvedFbc) userData.fbc = resolvedFbc;

  return userData;
}

/**
 * Generates an event ID for cross-layer deduplication.
 */
export function generateMetaEventId(prefix = "evt"): string {
  const ts = Date.now();
  const rnd = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${ts}_${rnd}`;
}
