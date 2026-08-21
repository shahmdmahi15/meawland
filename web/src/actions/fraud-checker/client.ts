import { env } from "@/env";

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  statusCode?: number;
  raw?: unknown;
}

/**
 * FraudSpy API client wrapper.
 * Handles Bearer token authentication, origin headers, timeout, and response normalization.
 */
export async function fraudSpyRequest<T>(
  endpoint: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  try {
    const baseUrl = (
      env.FRAUD_CHECKER_BASE_URL || "https://fraudspy.com.bd"
    ).replace(/\/$/, "");
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = `${baseUrl}${cleanEndpoint}`;

    const apiKey = env.FRAUD_CHECKER_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        message:
          "Fraud Checker API key is not configured in server environment.",
      };
    }

    const appOrigin = (
      env.NEXT_PUBLIC_APP_URL || "https://meawland.com"
    ).replace(/\/$/, "");

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      options.timeoutMs || 15000,
    );

    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      Origin: appOrigin,
      ...options.headers,
    };

    const fetchOptions: RequestInit = {
      method: options.method || (options.body ? "POST" : "GET"),
      headers,
      signal: controller.signal,
      cache: "no-store",
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    clearTimeout(timeout);

    const statusCode = response.status;
    const responseText = await response.text();

    let json: Record<string, unknown> | null = null;
    try {
      json = responseText ? JSON.parse(responseText) : null;
    } catch {
      // Non-JSON response
    }

    if (!response.ok) {
      let errorMessage = "Fraud Checker service returned an error.";

      if (statusCode === 401) {
        errorMessage = "Invalid or expired Fraud Checker API key.";
      } else if (statusCode === 403) {
        errorMessage = "Fraud Checker subscription inactive or expired.";
      } else if (statusCode === 422) {
        errorMessage =
          (json?.message as string) ||
          (json?.error as string) ||
          "Validation failed for phone number or report parameters.";
      } else if (statusCode === 429) {
        errorMessage =
          "Fraud Checker daily quota or rate limit exceeded. Please try again later.";
      } else if (json?.message) {
        errorMessage = String(json.message);
      } else if (json?.error) {
        errorMessage = String(json.error);
      }

      return {
        success: false,
        statusCode,
        message: errorMessage,
        raw: json || responseText,
      };
    }

    if (!json) {
      return {
        success: false,
        statusCode,
        message: "Empty response received from Fraud Checker API.",
      };
    }

    return {
      success: true,
      statusCode,
      data: json as unknown as T,
      message: (json.message as string) || "Success",
      raw: json,
    };
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        message:
          "Fraud Checker request timed out. The provider took too long to respond.",
      };
    }

    console.error("[FraudSpy.Client.Error]:", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while communicating with Fraud Checker.",
    };
  }
}
