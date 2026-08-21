import { z } from "zod";
import type { AdminOrder } from "@/actions/admin/management/orders/get-orders";
import { steadfastMerchantId } from "@/actions/steadfast";

export const courierStickerDataSchema = z.object({
  orderId: z.string(),
  orderCode: z.string(),
  date: z.string(),
  merchantId: z.string(),
  invoiceId: z.string(),
  courierName: z.string(),
  parcelId: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  consignmentId: z.string(),
  codAmount: z.string(),
});

export type CourierStickerData = z.infer<typeof courierStickerDataSchema>;

// Exact 2 inch width x 3 inch height thermal label dimensions
export const COURIER_STICKER_DIMENSIONS = {
  widthInches: 2,
  heightInches: 3,
  widthMm: 50.8,
  heightMm: 76.2,
  label: '2" × 3" (50.8mm × 76.2mm)',
} as const;

/**
 * Checks if an order has been sent to courier (Steadfast) with a valid consignment/tracking ID.
 */
export function isOrderSentToCourier(order: AdminOrder): boolean {
  return Boolean(
    order.shipment &&
    (order.shipment.consignmentId ||
      order.shipment.trackingCode ||
      order.shipment.status),
  );
}

/**
 * Extracts courier sticker data for an order if sent to courier.
 */
export function extractCourierStickerData(
  order: AdminOrder,
): CourierStickerData | null {
  if (!isOrderSentToCourier(order) || !order.shipment) {
    return null;
  }

  const d = new Date(order.createdAt);
  const formattedDate = `${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`;

  const consignmentId =
    order.shipment.consignmentId?.toString() ||
    order.shipment.trackingCode ||
    order.code;

  const parcelId =
    order.shipment.consignmentId?.toString() ||
    order.shipment.trackingCode ||
    "N/A";

  const courierName = order.shipment.provider?.toLowerCase() || "steadfast";

  const cod =
    order.shipment.codAmount && parseFloat(order.shipment.codAmount) >= 0
      ? parseFloat(order.shipment.codAmount).toFixed(0)
      : parseFloat(order.finalCost || "0").toFixed(0);

  return {
    orderId: order.id,
    orderCode: order.code,
    date: formattedDate,
    merchantId: steadfastMerchantId || "GZWYYDNA",
    invoiceId: order.code,
    courierName,
    parcelId,
    customerName: order.name || "Customer",
    customerPhone: order.phone || "",
    consignmentId,
    codAmount: cod,
  };
}

/**
 * Extracts courier sticker data for multiple orders, filtering only those sent to courier.
 */
export function extractCourierStickersFromOrders(
  orders: AdminOrder[],
  copiesPerItem: number = 1,
): CourierStickerData[] {
  const stickers: CourierStickerData[] = [];

  for (const order of orders) {
    const sticker = extractCourierStickerData(order);
    if (sticker) {
      for (let i = 0; i < copiesPerItem; i++) {
        stickers.push(sticker);
      }
    }
  }

  return stickers;
}
