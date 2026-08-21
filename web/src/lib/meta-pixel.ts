"use client";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: (...args: any[]) => void;
  }
}

/**
 * Generate unique event ID for deduplicating browser and server events.
 */
export function generateBrowserEventId(prefix = "evt"): string {
  const ts = Date.now();
  const rnd = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${ts}_${rnd}`;
}

/**
 * Dispatches a standard or custom event to the browser Meta Pixel with deduplication eventID.
 */
export function trackMetaPixelEvent(
  eventName: string,
  customData?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.fbq === "function") {
      if (eventId) {
        window.fbq("track", eventName, customData || {}, { eventID: eventId });
      } else {
        window.fbq("track", eventName, customData || {});
      }
    }
  } catch (error) {
    console.warn("[MetaPixel.Browser] Error sending pixel event:", error);
  }
}

/**
 * Dispatches custom events to the browser Meta Pixel.
 */
export function trackMetaPixelCustomEvent(
  customEventName: string,
  customData?: Record<string, unknown>,
  eventId?: string,
): void {
  if (typeof window === "undefined") return;

  try {
    if (typeof window.fbq === "function") {
      if (eventId) {
        window.fbq("trackCustom", customEventName, customData || {}, {
          eventID: eventId,
        });
      } else {
        window.fbq("trackCustom", customEventName, customData || {});
      }
    }
  } catch (error) {
    console.warn(
      "[MetaPixel.Browser] Error sending custom pixel event:",
      error,
    );
  }
}
