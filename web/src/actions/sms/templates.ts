"use server";

import { env } from "@/env";
import type {
  OtpSmsInput,
  OrderConfirmationSmsInput,
  OrderDispatchedSmsInput,
  OrderDeliveredSmsInput,
  SmsApiResponse,
} from "./types";
import { sendSingleSmsAction } from "./send-sms";

/**
 * Sends an OTP verification SMS adhering to the required gateway format:
 * "Your {Brand/Company Name} OTP is XXXX"
 */
export async function sendOtpSmsAction(
  input: OtpSmsInput,
): Promise<{
  success: boolean;
  message?: string;
  data?: SmsApiResponse;
}> {
  const brand = input.brandName || "Meawland";
  const message = `Your ${brand} OTP is ${input.otp}`;

  return await sendSingleSmsAction({
    recipient: input.phone,
    message,
    senderId: input.senderId,
  });
}

/**
 * Sends an Order Confirmation SMS when an order is placed
 */
export async function sendOrderConfirmationSmsAction(
  input: OrderConfirmationSmsInput,
): Promise<{
  success: boolean;
  message?: string;
  data?: SmsApiResponse;
}> {
  const trackingUrl = `${env.NEXT_PUBLIC_APP_URL}/account/tracking?order=${input.orderCode}`;
  const amountFormatted =
    typeof input.totalAmount === "number"
      ? input.totalAmount.toLocaleString()
      : parseFloat(input.totalAmount || "0").toLocaleString();

  const greeting = input.customerName ? `Dear ${input.customerName}, ` : "";
  const message = `${greeting}your Meawland order #${input.orderCode} (BDT ${amountFormatted}) is confirmed! Track live: ${trackingUrl}`;

  return await sendSingleSmsAction({
    recipient: input.phone,
    message,
    senderId: input.senderId,
  });
}

/**
 * Sends an Order Dispatched / Out-for-Delivery SMS with tracking info
 */
export async function sendOrderDispatchedSmsAction(
  input: OrderDispatchedSmsInput,
): Promise<{
  success: boolean;
  message?: string;
  data?: SmsApiResponse;
}> {
  const courier = input.courierName || "Steadfast Courier";
  const trackingSuffix = input.trackingCode
    ? ` Tracking: ${input.trackingCode}.`
    : "";
  const trackingUrl = `${env.NEXT_PUBLIC_APP_URL}/account/tracking?order=${input.orderCode}`;

  const message = `Your Meawland order #${input.orderCode} is on the way via ${courier}!${trackingSuffix} Track: ${trackingUrl}`;

  return await sendSingleSmsAction({
    recipient: input.phone,
    message,
    senderId: input.senderId,
  });
}

/**
 * Sends an Order Delivered celebration SMS
 */
export async function sendOrderDeliveredSmsAction(
  input: OrderDeliveredSmsInput,
): Promise<{
  success: boolean;
  message?: string;
  data?: SmsApiResponse;
}> {
  const greeting = input.customerName ? `Dear ${input.customerName}, ` : "";
  const message = `${greeting}your Meawland order #${input.orderCode} has been delivered! Thank you for trusting Meawland for your pet needs.`;

  return await sendSingleSmsAction({
    recipient: input.phone,
    message,
    senderId: input.senderId,
  });
}
