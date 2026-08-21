"use server";

import { env } from "@/env";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────

export type BkashGrantTokenResponse = {
  statusCode: string;
  statusMessage: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
};

type BkashTokenErrorResponse = {
  statusCode?: string;
  statusMessage?: string;
  errorCode?: string;
  errorMessage?: string;
};

// ────────────────────────────────────────────────────────────────────────────────
// In-Memory Token Cache
// ────────────────────────────────────────────────────────────────────────────────

type TokenCache = {
  idToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in ms
};

const globalForBkash = global as unknown as {
  bkashTokenCache: TokenCache | undefined;
};

function getCache(): TokenCache | null {
  return globalForBkash.bkashTokenCache ?? null;
}

function setCache(cache: TokenCache): void {
  globalForBkash.bkashTokenCache = cache;
}

function clearCache(): void {
  globalForBkash.bkashTokenCache = undefined;
}

// ────────────────────────────────────────────────────────────────────────────────
// Grant Token — Direct API Call
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Calls the bKash Grant Token API to obtain a fresh access token.
 * This is the raw API call — prefer using `getBkashToken()` which
 * handles caching and automatic refresh.
 */
export async function grantBkashTokenAction(): Promise<{
  success: boolean;
  message?: string;
  data?: BkashGrantTokenResponse;
}> {
  try {
    const response = await fetch(
      `${env.BKASH_BASE_URL}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: env.BKASH_USERNAME,
          password: env.BKASH_PASSWORD,
        },
        body: JSON.stringify({
          app_key: env.BKASH_APP_KEY,
          app_secret: env.BKASH_APP_SECRET,
        }),
        cache: "no-store",
      },
    );

    const data = (await response.json()) as
      BkashGrantTokenResponse | BkashTokenErrorResponse;

    if (!response.ok || !("id_token" in data) || !data.id_token) {
      const errorData = data as BkashTokenErrorResponse;
      console.error("[Actions.Bkash.GrantToken] API error:", errorData);
      return {
        success: false,
        message:
          errorData.statusMessage ||
          errorData.errorMessage ||
          "Failed to grant bKash token.",
      };
    }

    const tokenData = data as BkashGrantTokenResponse;

    // Cache the token with a 60-second safety margin
    const expiresInMs = (tokenData.expires_in - 60) * 1000;
    setCache({
      idToken: tokenData.id_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + expiresInMs,
    });

    return {
      success: true,
      data: tokenData,
    };
  } catch (error) {
    console.error("[Actions.Bkash.GrantToken]:", error);
    return {
      success: false,
      message: "Failed to grant bKash token. Please try again.",
    };
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// Refresh Token — Direct API Call
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Calls the bKash Refresh Token API to obtain a new access token
 * using an existing refresh token (valid for up to 28 days).
 */
async function refreshBkashToken(
  refreshToken: string,
): Promise<BkashGrantTokenResponse | null> {
  try {
    const response = await fetch(
      `${env.BKASH_BASE_URL}/tokenized/checkout/token/refresh`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: env.BKASH_USERNAME,
          password: env.BKASH_PASSWORD,
        },
        body: JSON.stringify({
          app_key: env.BKASH_APP_KEY,
          app_secret: env.BKASH_APP_SECRET,
          refresh_token: refreshToken,
        }),
        cache: "no-store",
      },
    );

    const data = (await response.json()) as
      BkashGrantTokenResponse | BkashTokenErrorResponse;

    if (!response.ok || !("id_token" in data) || !data.id_token) {
      console.error("[Actions.Bkash.RefreshToken] API error:", data);
      return null;
    }

    const tokenData = data as BkashGrantTokenResponse;

    // Update cache with the new token
    const expiresInMs = (tokenData.expires_in - 60) * 1000;
    setCache({
      idToken: tokenData.id_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + expiresInMs,
    });

    return tokenData;
  } catch (error) {
    console.error("[Actions.Bkash.RefreshToken]:", error);
    return null;
  }
}

// ────────────────────────────────────────────────────────────────────────────────
// getBkashToken — Smart Token Resolution
// ────────────────────────────────────────────────────────────────────────────────

/**
 * Returns a valid bKash `id_token` by checking the in-memory cache first,
 * attempting a refresh if the token is expired, and falling back to a
 * full grant if refresh fails or no cached token exists.
 *
 * This is the primary entry point for all bKash API actions.
 */
export async function getBkashToken(): Promise<string | null> {
  const cached = getCache();

  // 1. Cache hit and still valid
  if (cached && Date.now() < cached.expiresAt) {
    return cached.idToken;
  }

  // 2. Cache exists but expired — try refresh
  if (cached) {
    const refreshed = await refreshBkashToken(cached.refreshToken);
    if (refreshed) {
      return refreshed.id_token;
    }
    // Refresh failed — clear stale cache and fall through to grant
    clearCache();
  }

  // 3. No cache or refresh failed — do a fresh grant
  const result = await grantBkashTokenAction();
  if (result.success && result.data) {
    return result.data.id_token;
  }

  console.error(
    "[Actions.Bkash.GetToken] Unable to obtain bKash token:",
    result.message,
  );
  return null;
}
