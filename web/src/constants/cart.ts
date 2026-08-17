export const FREE_DELIVERY_THRESHOLD = 2000; // Free delivery for orders >= 2,000 BDT
export const CART_COOKIE_NAME = "meawland_cart_id";
export const CART_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export const DELIVERY_FEE_INSIDE_DHAKA = 80; // Standard delivery fee in BDT inside Dhaka district
export const DELIVERY_FEE_OUTSIDE_DHAKA = 120; // Standard delivery fee in BDT outside Dhaka district

/**
 * Checks whether a given district name represents Dhaka.
 */
export function isDhakaDistrict(district?: string | null): boolean {
  if (!district) return false;
  return district.trim().toLowerCase().includes("dhaka");
}

/**
 * Computes the shipping fee based on destination district and free delivery status.
 */
export function getDeliveryFee(
  district?: string | null,
  isFreeDelivery = false,
): number {
  if (isFreeDelivery) return 0;
  if (!district) return DELIVERY_FEE_INSIDE_DHAKA;
  return isDhakaDistrict(district)
    ? DELIVERY_FEE_INSIDE_DHAKA
    : DELIVERY_FEE_OUTSIDE_DHAKA;
}
