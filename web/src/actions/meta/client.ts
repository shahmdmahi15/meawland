"use server";

import { env } from "@/env";
import { MetaServerEventPayload, MetaCapiResponse } from "./types";

const META_GRAPH_VERSION = "v21.0";

/**
 * Sends one or multiple server-side events directly to Meta Graph Conversions API.
 * Docs: https://developers.facebook.com/docs/marketing-api/conversions-api/using-the-api
 */
export async function sendMetaConversionApiEvents(
  events: MetaServerEventPayload[],
): Promise<{
  success: boolean;
  eventsReceived?: number;
  fbtraceId?: string;
  message?: string;
  error?: unknown;
}> {
  try {
    const pixelId = env.NEXT_PUBLIC_META_PIXEL_ID;
    const accessToken = env.META_ACCESS_TOKEN;
    const testEventCode = env.META_TEST_EVENT_CODE;

    if (!pixelId || !accessToken) {
      console.warn(
        "[Meta.CAPI] Missing NEXT_PUBLIC_META_PIXEL_ID or META_ACCESS_TOKEN.",
      );
      return {
        success: false,
        message: "Meta Conversions API is not configured.",
      };
    }

    if (!events || events.length === 0) {
      return { success: true, eventsReceived: 0 };
    }

    const payload: {
      data: MetaServerEventPayload[];
      test_event_code?: string;
    } = {
      data: events,
    };

    if (testEventCode && testEventCode.trim()) {
      payload.test_event_code = testEventCode.trim();
    }

    const url = `https://graph.facebook.com/${META_GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(
      accessToken,
    )}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = (await response.json()) as MetaCapiResponse;

    if (!response.ok || data.error) {
      console.error(
        "[Meta.CAPI] Error from Meta Graph API:",
        data.error || data,
      );
      return {
        success: false,
        message:
          data.error?.message ||
          "Failed to dispatch events to Meta Conversions API.",
        fbtraceId: data.error?.fbtrace_id,
        error: data.error,
      };
    }

    return {
      success: true,
      eventsReceived: data.events_received ?? events.length,
      fbtraceId: data.fbtrace_id,
    };
  } catch (error) {
    console.error("[Meta.CAPI] Network/Exception Error:", error);
    return {
      success: false,
      message: "Exception connecting to Meta Conversions API gateway.",
      error,
    };
  }
}
