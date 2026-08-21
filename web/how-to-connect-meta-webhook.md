# Connecting Meta (Facebook) Messenger Webhook to Meawland

A comprehensive, production-ready guide to integrating the **Meta Messenger Webhook API** with the Meawland Next.js application.

---

## 1. What Facilities & Benefits the Webhook Provides

Connecting Meta Webhooks turns your Facebook Page Messenger into an automated, synchronized extension of your Meawland admin dashboard:

1. **Instant Support Ticket Linking (`?ref=ticket_MEAWTKT...`)**:
   - When a customer clicks **Messenger** on their support ticket (`/account/support`), Meta automatically passes the referral tag `ticket_MEAWTKT00001` to your webhook.
   - The system immediately fetches the ticket subject, priority, and attached order from the database and sends a personalized acknowledgment in chat.
2. **Order Status Tracking on Chat (`?ref=order_MEAW...`)**:
   - Customers can click a Messenger link on their tracking page to receive live delivery updates, Steadfast courier tracking codes, and status changes directly in their Messenger inbox.
3. **24/7 Automated Customer Support**:
   - Instant automated replies for common inquiries (operating hours, delivery timeline across 64 districts, return policy, payment options via COD and bKash).
4. **Live Human-Agent Handover**:
   - Automatically notify admin staff via dashboard toast or email when a customer asks a complex question, allowing admins to take over the conversation smoothly.
5. **Security & Data Privacy**:
   - All incoming events are cryptographically verified using SHA-256 HMAC signatures (`X-Hub-Signature-256`).

---

## 2. Codebase Implementation (Next.js App Router)

### 2.1 Webhook Endpoint Route

Create the route handler at `src/app/api/webhooks/messenger/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";

const VERIFY_TOKEN =
  process.env.META_WEBHOOK_VERIFY_TOKEN || "meawland_webhook_verify_token_2026";
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN;
const APP_SECRET = process.env.META_APP_SECRET;

/**
 * 1. GET Handler: Meta Webhook Verification Challenge
 * Meta calls this when you click "Verify and Save" in the Meta App Dashboard.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("[Meta Webhook] Successfully verified webhook subscription.");
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse("Forbidden: Verification token mismatch", {
    status: 403,
  });
}

/**
 * 2. POST Handler: Incoming Messenger Events Intake
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Optional: Validate Meta Signature if META_APP_SECRET is set
    if (APP_SECRET) {
      const signature = req.headers.get("x-hub-signature-256");
      if (!isValidSignature(rawBody, signature, APP_SECRET)) {
        return new NextResponse("Unauthorized: Invalid signature", {
          status: 401,
        });
      }
    }

    const body = JSON.parse(rawBody);

    if (body.object === "page") {
      for (const entry of body.entry) {
        for (const webhookEvent of entry.messaging || []) {
          const senderPsid = webhookEvent.sender?.id;
          if (!senderPsid) continue;

          // A. Handle Referral (?ref=ticket_... or ?ref=order_...)
          const referralRef =
            webhookEvent.referral?.ref || webhookEvent.postback?.referral?.ref;

          if (referralRef) {
            await handleReferralEvent(senderPsid, referralRef);
            continue;
          }

          // B. Handle User Text Messages
          if (webhookEvent.message && !webhookEvent.message.is_echo) {
            await handleUserMessage(
              senderPsid,
              webhookEvent.message.text || "",
            );
          }
        }
      }

      return NextResponse.json({ status: "EVENT_RECEIVED" }, { status: 200 });
    }

    return new NextResponse("Not Found", { status: 404 });
  } catch (error) {
    console.error("[Meta Webhook POST Error]:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

/**
 * Processes referrals when customer arrives via m.me/meawland1?ref=...
 */
async function handleReferralEvent(senderPsid: string, ref: string) {
  if (ref.startsWith("ticket_")) {
    const ticketCode = ref.replace("ticket_", "");

    // Look up ticket in database
    const ticket = await db.supportTicket.findFirst({
      where: { code: ticketCode },
      include: { user: true, order: true },
    });

    if (ticket) {
      await sendMessengerMessage(
        senderPsid,
        `👋 Hello ${ticket.user.name || "there"}!\n\nWe have received your message regarding Support Ticket #${ticket.code} ("${ticket.subject}").\n\n📌 Priority: ${ticket.priority}\n📂 Category: ${ticket.category}${
          ticket.order ? `\n📦 Order: #${ticket.order.code}` : ""
        }\n\nA support specialist is reviewing your inquiry and will assist you here shortly! 🐾`,
      );
    } else {
      await sendMessengerMessage(
        senderPsid,
        `👋 Hello! We received your inquiry for Ticket #${ticketCode}. Our team is checking your request now.`,
      );
    }
  } else if (ref.startsWith("order_")) {
    const orderCode = ref.replace("order_", "");
    const order = await db.order.findUnique({
      where: { code: orderCode },
      select: { code: true, status: true, finalCost: true },
    });

    if (order) {
      await sendMessengerMessage(
        senderPsid,
        `📦 Order Update for #${order.code}:\nStatus: ${order.status}\nTotal Amount: ৳${parseFloat(order.finalCost).toLocaleString()}\n\nLet us know if you have any questions!`,
      );
    }
  }
}

/**
 * Processes general chat messages
 */
async function handleUserMessage(senderPsid: string, text: string) {
  const lower = text.toLowerCase();

  if (lower.includes("track") || lower.includes("order")) {
    await sendMessengerMessage(
      senderPsid,
      "📦 To track your parcel, please reply with your Order Code (e.g. MEAW...) or visit: https://meawland.com/account/tracking",
    );
  }
}

/**
 * Sends messages via Meta Graph Send API
 */
async function sendMessengerMessage(
  recipientPsid: string,
  messageText: string,
) {
  if (!PAGE_ACCESS_TOKEN) {
    console.warn("[Meta Webhook] META_PAGE_ACCESS_TOKEN is not configured.");
    return;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: recipientPsid },
          message: { text: messageText },
        }),
      },
    );

    const data = await response.json();
    if (data.error) {
      console.error("[Meta Send API Error]:", data.error);
    }
  } catch (err) {
    console.error("[Meta Send API Network Error]:", err);
  }
}

/**
 * Validates Meta SHA-256 HMAC Signature
 */
function isValidSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string,
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const signature = signatureHeader.slice(7);
  const expectedSignature = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}
```

---

## 3. Step-by-Step Meta Developer Portal Setup

### Step 1: Create a Meta Developer App

1. Go to **[developers.facebook.com](https://developers.facebook.com)** and sign in with your Facebook account.
2. Click **My Apps** (top right) → **Create App**.
3. Choose **Other** or **Business** as the use case → Click **Next**.
4. Set App Name to `Meawland Webhooks` and enter your business contact email → Click **Create App**.

---

### Step 2: Add the Messenger Product

1. On your App Dashboard, find **Messenger** under "Add products to your app" and click **Set up**.
2. In the left navigation menu, expand **Messenger** → click **Webhooks**.

---

### Step 3: Configure Callback URL & Verification Token

1. Under the **Webhooks** section, click **Add Callback URL**.
2. Fill in:
   - **Callback URL**: `https://yourdomain.com/api/webhooks/messenger` _(must be HTTPS)_.
   - **Verify Token**: Enter your verification string (e.g. `meawland_webhook_verify_token_2026`).
3. Click **Verify and Save**. Meta will send a `GET` request with `hub.mode=subscribe` and `hub.challenge`. Your Next.js route returns `challenge`, and Meta will show a green checkmark.

> **Testing on Localhost?**
> Meta requires a public HTTPS URL. Run `ngrok http 3000` or Cloudflare Tunnel, then use your tunnel URL:
> `https://xxxx.ngrok-free.app/api/webhooks/messenger`

---

### Step 4: Subscribe to Webhook Fields

Under **Webhook Subscriptions** on the Messenger Webhooks page, click **Edit** and enable:

- [x] `messages` (incoming chat messages)
- [x] `messaging_postbacks` (button clicks & get started)
- [x] `messaging_referrals` (captures `?ref=ticket_...` links)

Click **Save**.

---

### Step 5: Link Your Facebook Page & Generate Page Access Token

1. In the left menu, go to **Messenger** → **Instagram & Facebook Accounts** (or **Settings**).
2. Under **Access Tokens**, click **Add or Remove Pages** and select your **Meawland** Facebook page.
3. Click **Generate Token** next to your Page.
4. Copy the token and store it securely in your `.env` file.

---

## 4. Environment Variables Configuration

Add the following keys to your `.env` (or `.env.local`) file:

```env
# Meta (Facebook) Messenger Webhook Configuration
META_WEBHOOK_VERIFY_TOKEN="meawland_webhook_verify_token_2026"
META_PAGE_ACCESS_TOKEN="EAA..."
META_APP_SECRET="your_meta_app_secret_here"
```

---

## 5. Testing the Integration

1. In the customer dashboard at `/account/support`, submit or view a support ticket.
2. Click **Messenger** on any ticket (`https://m.me/meawland1?ref=ticket_MEAWTKT00001`).
3. Send a message on Messenger.
4. Check your server logs:
   ```
   [Meta Webhook] Received Ticket Referral: ticket_MEAWTKT00001 from PSID: 123456789
   ```
5. The customer immediately receives an automated confirmation with their ticket code and priority!
