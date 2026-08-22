"use server";

import {
  MetaServerEventPayload,
  MetaCustomData,
  RawClientContext,
} from "./types";
import {
  buildMetaUserData,
  getClientContextFromHeaders,
  generateMetaEventId,
} from "./crypto";
import { sendMetaConversionApiEvents } from "./client";
import { getMeAction } from "@/actions/auth/get-me";

/**
 * Universal internal helper to build and send a single standard event.
 */
async function sendSingleStandardEvent(
  eventName: string,
  customData?: MetaCustomData,
  userContext?: RawClientContext,
  providedEventId?: string,
): Promise<{ success: boolean; eventId: string; message?: string }> {
  try {
    const eventId =
      providedEventId || generateMetaEventId(eventName.toLowerCase());
    const headerCtx = await getClientContextFromHeaders();

    // Enrich with session if available
    let sessionUser: {
      id: string;
      email?: string | null;
      name?: string | null;
      phone?: string | null;
      district?: string | null;
    } | null = null;
    try {
      sessionUser = await getMeAction();
    } catch {
      // Ignored
    }

    const mergedCtx: RawClientContext = {
      email: userContext?.email || sessionUser?.email,
      phone: userContext?.phone || sessionUser?.phone,
      name: userContext?.name || sessionUser?.name,
      district: userContext?.district || sessionUser?.district,
      userId: userContext?.userId || sessionUser?.id,
      eventSourceUrl:
        userContext?.eventSourceUrl ||
        headerCtx.referer ||
        "https://meawland.com",
      clientIp: userContext?.clientIp || headerCtx.ipAddress,
      userAgent: userContext?.userAgent || headerCtx.userAgent,
      fbp: userContext?.fbp || headerCtx.fbp,
      fbc: userContext?.fbc || headerCtx.fbc,
      ...userContext,
    };

    const userData = buildMetaUserData(mergedCtx, headerCtx);

    const eventPayload: MetaServerEventPayload = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      event_source_url: mergedCtx.eventSourceUrl || undefined,
      action_source: "website",
      user_data: userData,
      custom_data: customData,
    };

    const res = await sendMetaConversionApiEvents([eventPayload]);

    return {
      success: res.success,
      eventId,
      message: res.message,
    };
  } catch (error) {
    console.error(`[Meta.Events.${eventName}] Error:`, error);
    return {
      success: false,
      eventId: providedEventId || generateMetaEventId("err"),
      message: "Failed to dispatch Meta CAPI event.",
    };
  }
}

/**
 * 1. Track PageView Event (Server CAPI)
 */
export async function trackMetaPageViewAction(params: {
  url?: string;
  context?: RawClientContext;
  eventId?: string;
}) {
  return sendSingleStandardEvent(
    "PageView",
    undefined,
    { eventSourceUrl: params.url, ...params.context },
    params.eventId,
  );
}

/**
 * 2. Track ViewContent Event (Product Details Page)
 */
export async function trackMetaViewContentAction(params: {
  productId: string;
  productName: string;
  price: number;
  category?: string;
  sku?: string;
  context?: RawClientContext;
  eventId?: string;
}) {
  const customData: MetaCustomData = {
    content_name: params.productName,
    content_category: params.category || "Pet Supplies",
    content_ids: [params.sku || params.productId],
    content_type: "product",
    value: params.price,
    currency: "BDT",
    contents: [
      {
        id: params.sku || params.productId,
        quantity: 1,
        item_price: params.price,
        title: params.productName,
        category: params.category,
      },
    ],
  };

  return sendSingleStandardEvent(
    "ViewContent",
    customData,
    params.context,
    params.eventId,
  );
}

/**
 * 3. Track AddToCart Event
 */
export async function trackMetaAddToCartAction(params: {
  productId: string;
  productName: string;
  price: number;
  quantity?: number;
  category?: string;
  sku?: string;
  context?: RawClientContext;
  eventId?: string;
}) {
  const qty = params.quantity || 1;
  const totalValue = params.price * qty;

  const customData: MetaCustomData = {
    content_name: params.productName,
    content_category: params.category || "Pet Supplies",
    content_ids: [params.sku || params.productId],
    content_type: "product",
    value: totalValue,
    currency: "BDT",
    num_items: qty,
    contents: [
      {
        id: params.sku || params.productId,
        quantity: qty,
        item_price: params.price,
        title: params.productName,
      },
    ],
  };

  return sendSingleStandardEvent(
    "AddToCart",
    customData,
    params.context,
    params.eventId,
  );
}

/**
 * 4. Track AddToWishlist Event
 */
export async function trackMetaAddToWishlistAction(params: {
  productId: string;
  productName: string;
  price?: number;
  category?: string;
  sku?: string;
  context?: RawClientContext;
  eventId?: string;
}) {
  const customData: MetaCustomData = {
    content_name: params.productName,
    content_category: params.category || "Pet Supplies",
    content_ids: [params.sku || params.productId],
    content_type: "product",
    value: params.price || 0,
    currency: "BDT",
  };

  return sendSingleStandardEvent(
    "AddToWishlist",
    customData,
    params.context,
    params.eventId,
  );
}

/**
 * 5. Track InitiateCheckout Event
 */
export async function trackMetaInitiateCheckoutAction(params: {
  totalValue: number;
  numItems: number;
  items?: Array<{ id: string; name?: string; price: number; quantity: number }>;
  context?: RawClientContext;
  eventId?: string;
}) {
  const customData: MetaCustomData = {
    value: params.totalValue,
    currency: "BDT",
    num_items: params.numItems,
    content_type: "product",
    content_ids: params.items?.map((i) => i.id) || [],
    contents: params.items?.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      item_price: i.price,
      title: i.name,
    })),
  };

  return sendSingleStandardEvent(
    "InitiateCheckout",
    customData,
    params.context,
    params.eventId,
  );
}

/**
 * 6. Track AddPaymentInfo Event
 */
export async function trackMetaAddPaymentInfoAction(params: {
  paymentMethod: "COD" | "BKASH" | string;
  totalValue: number;
  context?: RawClientContext;
  eventId?: string;
}) {
  const customData: MetaCustomData = {
    value: params.totalValue,
    currency: "BDT",
    status: params.paymentMethod,
    content_category: "Payment",
  };

  return sendSingleStandardEvent(
    "AddPaymentInfo",
    customData,
    params.context,
    params.eventId,
  );
}

/**
 * 7. Track Purchase Event (High Priority Server CAPI with Deduplication)
 */
export async function trackMetaPurchaseAction(params: {
  orderCode: string;
  totalValue: number;
  currency?: string;
  numItems: number;
  deliveryFee?: number;
  discount?: number;
  items?: Array<{ id: string; name?: string; price: number; quantity: number }>;
  customer?: {
    email?: string | null;
    phone?: string | null;
    name?: string | null;
    district?: string | null;
    userId?: string | null;
  };
  context?: RawClientContext;
  eventId?: string;
}) {
  const eventId = params.eventId || `purch_${params.orderCode}`;

  const customData: MetaCustomData = {
    order_id: params.orderCode,
    value: params.totalValue,
    currency: params.currency || "BDT",
    num_items: params.numItems,
    content_type: "product",
    content_ids: params.items?.map((i) => i.id) || [],
    contents: params.items?.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      item_price: i.price,
      title: i.name,
    })),
  };

  const userContext: RawClientContext = {
    ...params.customer,
    ...params.context,
  };

  return sendSingleStandardEvent("Purchase", customData, userContext, eventId);
}

/**
 * 8. Track Search Event
 */
export async function trackMetaSearchAction(params: {
  query: string;
  resultsCount?: number;
  context?: RawClientContext;
  eventId?: string;
}) {
  const customData: MetaCustomData = {
    search_string: params.query,
    content_category: "Product Search",
    num_items: params.resultsCount,
  };

  return sendSingleStandardEvent(
    "Search",
    customData,
    params.context,
    params.eventId,
  );
}

/**
 * 9. Track Lead Event (Newsletter, Subscription, VIP signup)
 */
export async function trackMetaLeadAction(params: {
  leadType: "NEWSLETTER" | "VIP_SIGNUP" | "CONTACT_FORM" | string;
  email?: string;
  name?: string;
  phone?: string;
  context?: RawClientContext;
  eventId?: string;
}) {
  const customData: MetaCustomData = {
    content_name: params.leadType,
    content_category: "Lead Generation",
  };

  const userContext: RawClientContext = {
    email: params.email,
    name: params.name,
    phone: params.phone,
    ...params.context,
  };

  return sendSingleStandardEvent(
    "Lead",
    customData,
    userContext,
    params.eventId,
  );
}

/**
 * 10. Track CompleteRegistration Event
 */
export async function trackMetaCompleteRegistrationAction(params: {
  userId: string;
  method: "GOOGLE" | "OTP" | "EMAIL" | string;
  email?: string | null;
  phone?: string | null;
  name?: string | null;
  context?: RawClientContext;
  eventId?: string;
}) {
  const eventId = params.eventId || `reg_${params.userId}`;

  const customData: MetaCustomData = {
    status: params.method,
    content_name: "Customer Account Created",
  };

  const userContext: RawClientContext = {
    userId: params.userId,
    email: params.email,
    phone: params.phone,
    name: params.name,
    ...params.context,
  };

  return sendSingleStandardEvent(
    "CompleteRegistration",
    customData,
    userContext,
    eventId,
  );
}
