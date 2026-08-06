import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";
import { generateId } from "@/lib/generate-code";
import { env } from "@/env";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const oauthCode = url.searchParams.get("code");

  if (!oauthCode) {
    return NextResponse.redirect(new URL("/?error=NoCode", req.url));
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

    // 5. Set HTTP-only cookie with the RAW token and redirect
    const response = NextResponse.redirect(new URL("/account", req.url));
    response.cookies.set("__Host-SESSION_TOKEN", rawSessionToken, {
      expires: expiresAt,
      sameSite: "lax",
      secure: true,
      httpOnly: true,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Database OAuth error:", error);
    return NextResponse.redirect(new URL("/?error=OAuthFailed", req.url));
  }
}
