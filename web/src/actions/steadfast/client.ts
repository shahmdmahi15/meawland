import { env } from "@/env";

/**
 * Common Steadfast API request dispatcher.
 */
export async function steadfastRequest<T>(
  endpoint: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    body?: unknown;
    timeoutMs?: number;
  } = {},
): Promise<{
  success: boolean;
  status: number;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}> {
  const method = options.method || "GET";
  const timeoutMs = options.timeoutMs || 30000;
  const baseUrl = env.STEADFAST_BASE_URL.replace(/\/+$/, "");
  const normalizedEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;
  const url = `${baseUrl}${normalizedEndpoint}`;

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
      "Api-Key": env.STEADFAST_API_KEY,
      "Secret-Key": env.STEADFAST_SECRET_KEY,
    };

    const response = await fetch(url, {
      method,
      headers,
      ...(options.body !== undefined && {
        body: JSON.stringify(options.body),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

    type SteadfastRawJson = Record<string, unknown> & {
      message?: string;
      error?: string;
      status?: number;
      errors?: Record<string, string[]>;
    };

    const responseText = await response.text();
    let json: SteadfastRawJson | null = null;

    try {
      json = responseText ? (JSON.parse(responseText) as SteadfastRawJson) : {};
    } catch {
      json = { raw: responseText };
    }

    if (!response.ok) {
      console.error(
        `[Actions.Steadfast.Client] Error HTTP ${response.status} from ${endpoint}:`,
        json,
      );

      let errorMessage =
        json?.message ||
        json?.error ||
        `Steadfast API error (HTTP ${response.status})`;

      if (json?.errors && typeof json.errors === "object") {
        const fieldErrors = Object.entries(json.errors)
          .map(
            ([field, errs]) =>
              `${field}: ${Array.isArray(errs) ? errs.join(", ") : errs}`,
          )
          .join(" | ");
        errorMessage = `${errorMessage} - ${fieldErrors}`;
      }

      return {
        success: false,
        status: response.status,
        message: errorMessage,
        errors: json?.errors,
        data: json as T,
      };
    }

    // Some Steadfast endpoints return { status: 400/404, message: "..." } with HTTP 200
    if (typeof json === "object" && json !== null) {
      if (
        json.status &&
        typeof json.status === "number" &&
        json.status >= 400
      ) {
        return {
          success: false,
          status: json.status,
          message: json.message || "Steadfast reported an error.",
          errors: json.errors,
          data: json as T,
        };
      }
    }

    return {
      success: true,
      status: response.status,
      data: json as T,
      message: json?.message,
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      console.error(
        `[Actions.Steadfast.Client] Request to ${endpoint} timed out after ${timeoutMs}ms`,
      );
      return {
        success: false,
        status: 408,
        message: "Steadfast API request timed out. Please try again.",
      };
    }

    console.error(
      `[Actions.Steadfast.Client] Unexpected error on ${endpoint}:`,
      error,
    );
    return {
      success: false,
      status: 500,
      message:
        error instanceof Error
          ? error.message
          : "Failed to communicate with Steadfast Courier gateway.",
    };
  }
}
