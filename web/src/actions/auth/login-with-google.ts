"use server";

import { env } from "@/env";
import { redirect } from "next/navigation";

export async function loginWithGoogleAction() {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";

  const options = {
    redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
    client_id: env.GOOGLE_CLIENT_ID!,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ].join(" "),
  };

  const qs = new URLSearchParams(options);

  redirect(`${rootUrl}?${qs.toString()}`);
}
