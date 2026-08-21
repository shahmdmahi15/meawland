import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";
import { generateId } from "@/lib/generate-code";
import { env } from "@/env";
import { buildMetaUserData } from "@/actions/meta/crypto";
import { sendMetaConversionApiEvents } from "@/actions/meta/client";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const oauthCode = url.searchParams.get("code");

  if (!oauthCode) {
    return NextResponse.redirect(
      new URL("/?error=NoCode", env.NEXT_PUBLIC_APP_URL || "https://meawland.com"),
    );
  }

  try {
    // 1. Exchange OAuth code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: oauthCode,
        client_id: env.GOOGLE_CLIENT_ID!,
        client_secret: env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error("Token exchange failed");

    // 2. Fetch user details from Google
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v3/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    const googleUser = await userRes.json();
    if (!userRes.ok) throw new Error("Failed to fetch user profile");

    const googleId = googleUser.sub;
    const email = googleUser.email;
    const name = googleUser.name;
    const avatar = googleUser.picture;

    // 3. Find or create the user in database
    let user = await db.user.findFirst({
      where: {
        OR: [{ googleId }, { email }],
      },
    });

    if (!user) {
      user = await db.$transaction(async (tx) => {
        const code = await generateId("CUSTOMER", tx);
        return await tx.user.create({
          data: {
            code: code,
            email,
            name,
            googleId,
            avatar,
          },
        });
      });
    } else if (!user.googleId) {
      // Link Google ID if user already existed via email
      user = await db.user.update({
        where: { id: user.id },
        data: { googleId, avatar: user.avatar || avatar },
      });
    }

    // 4. Create a secure session token and hash it for database storage
    const rawSessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto
      .createHash("sha256")
      .update(rawSessionToken)
      .digest("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 1 week

    await db.session.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt,
      },
    });

    // 5. Merge guest cart if present
    const guestCartId = req.cookies.get("meawland_cart_id")?.value;
    if (guestCartId) {
      try {
        const guestCart = await db.cart.findUnique({
          where: { id: guestCartId },
          include: { cartItems: true },
        });

        if (guestCart && guestCart.cartItems.length > 0) {
          let userCart = await db.cart.findFirst({
            where: { userId: user.id },
            include: { cartItems: true },
          });

          if (!userCart) {
            userCart = await db.cart.create({
              data: { userId: user.id, isTemporary: false },
              include: { cartItems: true },
            });
          }

          for (const item of guestCart.cartItems) {
            const existing = userCart.cartItems.find(
              (ci) =>
                ci.productId === item.productId &&
                ci.variantId === item.variantId &&
                ci.comboProductId === item.comboProductId,
            );

            if (existing) {
              await db.cartItem.update({
                where: { id: existing.id },
                data: { quanitity: existing.quanitity + item.quanitity },
              });
            } else {
              await db.cartItem.create({
                data: {
                  cartId: userCart.id,
                  productId: item.productId,
                  variantId: item.variantId,
                  comboProductId: item.comboProductId,
                  quanitity: item.quanitity,
                },
              });
            }
          }

          await db.cart.delete({ where: { id: guestCartId } }).catch(() => {});
        }
      } catch (err) {
        console.error("[OAuth.Google] Cart merge failed:", err);
      }
    }

    // 5.1 Send Meta CAPI CompleteRegistration safely
    try {
      const clientIp =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
      const userAgent = req.headers.get("user-agent") || null;
      const fbp = req.cookies.get("_fbp")?.value || null;
      const fbc = req.cookies.get("_fbc")?.value || null;

      const userData = buildMetaUserData(
        {
          userId: user.id,
          email: user.email,
          name: user.name,
          clientIp,
          userAgent,
          fbp,
          fbc,
        },
        { ipAddress: clientIp, userAgent, fbp, fbc },
      );

      sendMetaConversionApiEvents([
        {
          event_name: "CompleteRegistration",
          event_time: Math.floor(Date.now() / 1000),
          event_id: `reg_${user.id}`,
          action_source: "website",
          user_data: userData,
          custom_data: {
            status: "GOOGLE",
            content_name: "Customer Account Created",
          },
        },
      ]).catch((err) => {
        console.error("[OAuth.Google] Meta CAPI error:", err);
      });
    } catch {
      // Ignored
    }

    // 5.2 Forensic Audit Log
    await db.auditLog
      .create({
        data: {
          action: "LOGIN",
          entity: "AUTH",
          userId: user.id,
          entityName: user.name,
          summary: `User "${user.name}" (${user.email}) logged in via Google OAuth`,
          severity: "INFO",
          ipAddress:
            req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          userAgent: req.headers.get("user-agent") || null,
          path: "/api/auth/callback/google",
        },
      })
      .catch(() => {});

    // 6. Set HTTP-only cookie with the RAW token and redirect
    const appUrl = env.NEXT_PUBLIC_APP_URL || "https://meawland.com";
    const response = NextResponse.redirect(new URL("/account", appUrl));
    response.cookies.set("__Host-SESSION_TOKEN", rawSessionToken, {
      expires: expiresAt,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
      path: "/",
    });
    response.cookies.delete("meawland_cart_id");

    return response;
  } catch (error) {
    console.error("Database OAuth error:", error);
    const appUrl = env.NEXT_PUBLIC_APP_URL || "https://meawland.com";
    return NextResponse.redirect(new URL("/?error=OAuthFailed", appUrl));
  }
}
