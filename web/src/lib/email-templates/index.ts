/**
 * Meawland Brand HTML Email Engine
 * Premium, mobile-responsive, and accessible HTML templates for all marketing and transactional lifecycle emails.
 */

const STORE_NAME = "Meawland";
const BRAND_COLOR = "#56C8D8";
const BRAND_BG = "#EDF5FA";
const BRAND_BORDER = "#D4EEFC";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://meawland.com";

interface BaseEmailWrapperParams {
  title: string;
  previewText?: string;
  headerSubtitle?: string;
  bodyContent: string;
  recipientEmail?: string;
  showUnsubscribe?: boolean;
}

export function wrapEmailHtml({
  title,
  previewText,
  headerSubtitle = "Pet Happiness, Delivered 🐾",
  bodyContent,
  recipientEmail,
  showUnsubscribe = true,
}: BaseEmailWrapperParams): string {
  const unsubscribeUrl = recipientEmail
    ? `${APP_URL}/unsubscribe?email=${encodeURIComponent(recipientEmail)}`
    : `${APP_URL}/unsubscribe`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  ${
    previewText
      ? `<div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">${previewText}</div>`
      : ""
  }
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; margin: auto !important; border-radius: 0 !important; }
      .email-padding { padding: 20px 16px !important; }
      .responsive-table { width: 100% !important; }
      .button-full { width: 100% !important; text-align: center !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f3f4f6; padding: 24px 0;">
    <tr>
      <td align="center">
        <!-- Main Email Container -->
        <table class="email-container" width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e5e7eb;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background-color: ${BRAND_BG}; padding: 32px 28px; text-align: center; border-bottom: 2px solid ${BRAND_BORDER};">
              <a href="${APP_URL}" style="text-decoration: none;">
                <span style="font-size: 28px; font-weight: 900; color: ${BRAND_COLOR}; letter-spacing: -0.5px; display: inline-block;">MEAWLAND 🐾</span>
              </a>
              <p style="margin: 6px 0 0; font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1.5px;">${headerSubtitle}</p>
            </td>
          </tr>

          <!-- Email Body Content -->
          <tr>
            <td class="email-padding" style="padding: 36px 32px; background-color: #ffffff;">
              ${bodyContent}
            </td>
          </tr>

          <!-- Footer Section -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #f3f4f6; font-size: 12px; color: #9ca3af; line-height: 1.6;">
              <p style="margin: 0 0 10px; font-weight: 600; color: #6b7280;">
                🐾 ${STORE_NAME} Bangladesh • Premium Pet Care, Nutrition &amp; Accessories
              </p>
              <p style="margin: 0 0 10px;">
                Need help? Contact support at <a href="mailto:support@meawland.com" style="color: ${BRAND_COLOR}; text-decoration: none; font-weight: 600;">support@meawland.com</a> or message on WhatsApp.
              </p>
              ${
                showUnsubscribe
                  ? `<p style="margin: 0; font-size: 11px;">
                      Don't want to receive these emails? <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe here</a>
                    </p>`
                  : ""
              }
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 1. Order Confirmation / Receipt Email
 */
export function buildOrderPlacedEmailHtml(params: {
  orderCode: string;
  customerName: string;
  recipientEmail: string;
  items?: Array<{ name: string; quantity: number; price: string }>;
  subtotal?: string;
  deliveryFee?: string;
  discount?: string;
  grandTotal: string;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress: string;
  trackingUrl?: string;
}): string {
  const trackingUrl =
    params.trackingUrl || `${APP_URL}/account/tracking?orderCode=${params.orderCode}`;

  const itemsRows =
    params.items && params.items.length > 0
      ? params.items
          .map(
            (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #374151; font-weight: 600;">
          ${item.name} <span style="color: #9ca3af; font-weight: normal;">(x${item.quantity})</span>
        </td>
        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 13px; color: #111827; font-weight: 700;">
          ৳${item.price}
        </td>
      </tr>
    `,
          )
          .join("")
      : `
      <tr>
        <td colspan="2" style="padding: 10px 0; font-size: 13px; color: #374151;">
          Pet Essentials Order
        </td>
      </tr>
    `;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #ecfdf5; color: #059669; font-size: 28px; margin-bottom: 12px;">✓</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #111827;">Order Confirmed! 🐾</h1>
      <p style="margin: 6px 0 0; font-size: 14px; color: #6b7280;">
        Order Code: <strong style="color: ${BRAND_COLOR};">#${params.orderCode}</strong>
      </p>
    </div>

    <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 20px;">
      Hi <strong>${params.customerName}</strong>,<br/>
      Thank you for shopping at Meawland! We have received your order and our pet care specialists are now preparing your items with love.
    </p>

    <!-- Order Items Box -->
    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; color: #111827; text-transform: uppercase; letter-spacing: 0.5px;">
        Order Summary
      </h2>
      <table width="100%" border="0" cellspacing="0" cellpadding="0">
        ${itemsRows}
        ${
          params.subtotal
            ? `
          <tr>
            <td style="padding: 8px 0 4px; font-size: 13px; color: #6b7280;">Subtotal:</td>
            <td align="right" style="padding: 8px 0 4px; font-size: 13px; color: #374151; font-weight: 600;">৳${params.subtotal}</td>
          </tr>`
            : ""
        }
        ${
          params.deliveryFee
            ? `
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #6b7280;">Delivery Charge:</td>
            <td align="right" style="padding: 4px 0; font-size: 13px; color: #374151; font-weight: 600;">৳${params.deliveryFee}</td>
          </tr>`
            : ""
        }
        ${
          params.discount && parseFloat(params.discount) > 0
            ? `
          <tr>
            <td style="padding: 4px 0; font-size: 13px; color: #059669;">Discount Applied:</td>
            <td align="right" style="padding: 4px 0; font-size: 13px; color: #059669; font-weight: 700;">-৳${params.discount}</td>
          </tr>`
            : ""
        }
        <tr>
          <td style="padding: 12px 0 0; font-size: 15px; font-weight: 800; color: #111827; border-top: 2px solid #e5e7eb;">Grand Total:</td>
          <td align="right" style="padding: 12px 0 0; font-size: 18px; font-weight: 900; color: ${BRAND_COLOR}; border-top: 2px solid #e5e7eb;">৳${params.grandTotal}</td>
        </tr>
      </table>
    </div>

    <!-- Shipping & Payment Details Grid -->
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 18px; margin-bottom: 28px; font-size: 13px; color: #4b5563; line-height: 1.5;">
      <p style="margin: 0 0 8px;"><strong>📍 Delivery Address:</strong> ${params.shippingAddress}</p>
      <p style="margin: 0;"><strong>💳 Payment Method:</strong> ${params.paymentMethod} (${params.paymentStatus})</p>
    </div>

    <!-- Track Order Button -->
    <div style="text-align: center;">
      <a href="${trackingUrl}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 12px rgba(86, 200, 216, 0.35);">
        Track Live Order Status 🚚
      </a>
    </div>
  `;

  return wrapEmailHtml({
    title: `Order Confirmed #${params.orderCode} | Meawland`,
    previewText: `Your order #${params.orderCode} (৳${params.grandTotal}) is confirmed and being prepared!`,
    bodyContent,
    recipientEmail: params.recipientEmail,
    showUnsubscribe: false,
  });
}

/**
 * 2. Order Dispatched Email
 */
export function buildOrderDispatchedEmailHtml(params: {
  orderCode: string;
  customerName: string;
  recipientEmail: string;
  courierName?: string;
  trackingCode?: string;
  trackingUrl?: string;
}): string {
  const courier = params.courierName || "Steadfast Courier";
  const trackingCode = params.trackingCode || "N/A";
  const trackingUrl =
    params.trackingUrl || `${APP_URL}/account/tracking?orderCode=${params.orderCode}`;

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #eff6ff; color: #2563eb; font-size: 28px; margin-bottom: 12px;">📦</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #111827;">Your Order is on the Way! 🚚</h1>
      <p style="margin: 6px 0 0; font-size: 14px; color: #6b7280;">
        Order Code: <strong style="color: ${BRAND_COLOR};">#${params.orderCode}</strong>
      </p>
    </div>

    <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 20px;">
      Hi <strong>${params.customerName}</strong>,<br/>
      Great news! Your package has been handed over to <strong>${courier}</strong> and is currently en route to your doorstep.
    </p>

    <!-- Courier Box -->
    <div style="background-color: #EDF5FA; border: 1px solid ${BRAND_BORDER}; border-radius: 16px; padding: 20px; margin-bottom: 28px; text-align: center;">
      <p style="margin: 0 0 6px; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Consignment Tracking Code</p>
      <p style="margin: 0; font-size: 20px; font-weight: 900; color: #0e7490; letter-spacing: 1px;">${trackingCode}</p>
      <p style="margin: 8px 0 0; font-size: 12px; color: #64748b;">Carrier: <strong>${courier}</strong></p>
    </div>

    <div style="text-align: center;">
      <a href="${trackingUrl}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 14px; box-shadow: 0 4px 12px rgba(86, 200, 216, 0.35);">
        Track Shipment Live 🔎
      </a>
    </div>
  `;

  return wrapEmailHtml({
    title: `Order #${params.orderCode} Dispatched | Meawland`,
    previewText: `Your Meawland order #${params.orderCode} has been shipped via ${courier}!`,
    bodyContent,
    recipientEmail: params.recipientEmail,
    showUnsubscribe: false,
  });
}

/**
 * 3. Order Delivered Email
 */
export function buildOrderDeliveredEmailHtml(params: {
  orderCode: string;
  customerName: string;
  recipientEmail: string;
}): string {
  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #ecfdf5; color: #059669; font-size: 28px; margin-bottom: 12px;">🎉</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #111827;">Delivered Successfully! 🐾</h1>
      <p style="margin: 6px 0 0; font-size: 14px; color: #6b7280;">
        Order Code: <strong style="color: ${BRAND_COLOR};">#${params.orderCode}</strong>
      </p>
    </div>

    <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 20px;">
      Hi <strong>${params.customerName}</strong>,<br/>
      Your order #${params.orderCode} has been delivered! We hope your furry companion loves their new treats and essentials.
    </p>

    <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px; text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #111827;">How was your experience?</p>
      <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280;">
        Your feedback helps us continue providing the best quality pet supplies in Bangladesh.
      </p>
      <a href="${APP_URL}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; font-weight: 800; font-size: 13px; text-decoration: none; padding: 12px 28px; border-radius: 12px;">
        Explore More Pet Essentials 🛍️
      </a>
    </div>
  `;

  return wrapEmailHtml({
    title: `Order #${params.orderCode} Delivered | Meawland`,
    previewText: `Your Meawland order #${params.orderCode} has been delivered successfully!`,
    bodyContent,
    recipientEmail: params.recipientEmail,
    showUnsubscribe: false,
  });
}

/**
 * 4. bKash Payment Verified Email
 */
export function buildBkashPaymentEmailHtml(params: {
  orderCode: string;
  customerName: string;
  recipientEmail: string;
  amount: string;
  trxID: string;
}): string {
  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #fdf2f8; color: #db2777; font-size: 28px; margin-bottom: 12px;">💳</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #111827;">bKash Payment Verified!</h1>
      <p style="margin: 6px 0 0; font-size: 14px; color: #6b7280;">
        Order: <strong style="color: ${BRAND_COLOR};">#${params.orderCode}</strong>
      </p>
    </div>

    <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 20px;">
      Hi <strong>${params.customerName}</strong>,<br/>
      We have received your payment of <strong>৳${params.amount}</strong> via bKash. Your transaction has been verified successfully.
    </p>

    <div style="background-color: #fdf2f8; border: 1px solid #fbcfe8; border-radius: 16px; padding: 20px; margin-bottom: 28px; text-align: center;">
      <p style="margin: 0 0 4px; font-size: 12px; font-weight: 700; color: #9d174d; text-transform: uppercase;">bKash Transaction ID (TrxID)</p>
      <p style="margin: 0; font-size: 18px; font-weight: 900; color: #be185d; letter-spacing: 1.5px;">${params.trxID}</p>
      <p style="margin: 8px 0 0; font-size: 13px; color: #9d174d; font-weight: 700;">Amount Paid: ৳${params.amount}</p>
    </div>

    <div style="text-align: center;">
      <a href="${APP_URL}/checkout/success/${params.orderCode}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 32px; border-radius: 14px;">
        View Order Receipt 📄
      </a>
    </div>
  `;

  return wrapEmailHtml({
    title: `Payment Received for Order #${params.orderCode} | Meawland`,
    previewText: `bKash payment of ৳${params.amount} (TrxID: ${params.trxID}) verified!`,
    bodyContent,
    recipientEmail: params.recipientEmail,
    showUnsubscribe: false,
  });
}

/**
 * 5. Welcome VIP Customer Email
 */
export function buildWelcomeUserEmailHtml(params: {
  customerName: string;
  recipientEmail: string;
  couponCode?: string;
}): string {
  const coupon = params.couponCode || "WELCOME10";

  const bodyContent = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 28px; background-color: #EDF5FA; color: #0891b2; font-size: 28px; margin-bottom: 12px;">🐾</div>
      <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #111827;">Welcome to the Meawland Family!</h1>
      <p style="margin: 6px 0 0; font-size: 14px; color: #6b7280;">Your Pet's Favorite Shopping Destination</p>
    </div>

    <p style="font-size: 14px; color: #374151; line-height: 1.6; margin: 0 0 20px;">
      Hi <strong>${params.customerName}</strong>,<br/>
      We're thrilled to welcome you and your beloved pets! At Meawland, we offer the freshest imported pet foods, veterinary supplements, accessories, and toys across Bangladesh.
    </p>

    <!-- Welcome Voucher Card -->
    <div style="background: linear-gradient(135deg, #EDF5FA 0%, #D4EEFC 100%); border: 2px dashed ${BRAND_COLOR}; border-radius: 18px; padding: 24px; text-align: center; margin-bottom: 28px;">
      <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: #0e7490; text-transform: uppercase; letter-spacing: 1px;">Special Welcome Gift 🎁</p>
      <p style="margin: 0 0 12px; font-size: 18px; font-weight: 800; color: #111827;">Enjoy 10% OFF Your First Order</p>
      <div style="display: inline-block; background-color: #ffffff; padding: 8px 24px; border-radius: 12px; font-size: 20px; font-weight: 900; color: ${BRAND_COLOR}; letter-spacing: 2px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        ${coupon}
      </div>
      <p style="margin: 10px 0 0; font-size: 11px; color: #64748b;">Use code at checkout. Valid on all collections.</p>
    </div>

    <div style="text-align: center;">
      <a href="${APP_URL}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; font-weight: 800; font-size: 14px; text-decoration: none; padding: 14px 36px; border-radius: 14px; box-shadow: 0 4px 12px rgba(86, 200, 216, 0.35);">
        Start Shopping Now 🛍️
      </a>
    </div>
  `;

  return wrapEmailHtml({
    title: "Welcome to Meawland! 🐾 Enjoy 10% OFF",
    previewText: `Welcome ${params.customerName}! Here is your exclusive welcome coupon: ${coupon}`,
    bodyContent,
    recipientEmail: params.recipientEmail,
    showUnsubscribe: true,
  });
}

/**
 * 6. Marketing Broadcast / Promotional Campaign Email
 */
export function buildMarketingCampaignEmailHtml(params: {
  subject: string;
  previewText?: string;
  headline?: string;
  bodyText: string;
  ctaText?: string;
  ctaUrl?: string;
  recipientEmail: string;
}): string {
  const headline = params.headline || params.subject;
  const ctaText = params.ctaText || "Explore Offers Now 🐾";
  const ctaUrl = params.ctaUrl || APP_URL;

  const formattedParagraphs = params.bodyText
    .split("\n\n")
    .map(
      (p) =>
        `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.65; color: #374151;">${p.replace(
          /\n/g,
          "<br/>",
        )}</p>`,
    )
    .join("");

  const bodyContent = `
    <h1 style="margin: 0 0 18px; font-size: 22px; font-weight: 800; color: #111827; line-height: 1.35;">
      ${headline}
    </h1>

    ${formattedParagraphs}

    <div style="margin-top: 32px; text-align: center;">
      <a href="${ctaUrl}" style="display: inline-block; background-color: ${BRAND_COLOR}; color: #ffffff; font-weight: 800; font-size: 15px; text-decoration: none; padding: 14px 36px; border-radius: 14px; box-shadow: 0 4px 14px rgba(86, 200, 216, 0.4);">
        ${ctaText}
      </a>
    </div>
  `;

  return wrapEmailHtml({
    title: params.subject,
    previewText: params.previewText || params.subject,
    bodyContent,
    recipientEmail: params.recipientEmail,
    showUnsubscribe: true,
  });
}
