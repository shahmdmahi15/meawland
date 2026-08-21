import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import crypto from "crypto";
import db from "@/lib/db";
import { Role } from "./generated/prisma/enums";

async function isSessionValid(
  sessionToken: string | undefined,
): Promise<{ isValid: boolean; role?: Role }> {
  if (!sessionToken) {
    return { isValid: false };
  }
  const sessionTokenHash = crypto
    .createHash("sha256")
    .update(sessionToken)
    .digest("hex");
  const session = await db.session.findUnique({
    where: { tokenHash: sessionTokenHash },
    include: {
      user: {
        select: { role: true },
      },
    },
  });
  if (!session) {
    return { isValid: false };
  }
  return { isValid: true, role: session.user.role };
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionToken = request.cookies.get("__Host-SESSION_TOKEN")?.value;
  const { isValid, role } = await isSessionValid(sessionToken);
  const isLoginPath = path === "/login";
  const isAccountPath = path.startsWith("/account");
  const isAdminPath = path.startsWith("/admin");
  const isSecurityPath = path.startsWith("/admin/security");

  if (!isValid && isAccountPath && !isLoginPath) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  if (isValid && isLoginPath) {
    return NextResponse.redirect(new URL("/account", request.nextUrl));
  }

  if (isValid && isAdminPath && role !== Role.OWNER && role !== Role.ADMIN) {
    return NextResponse.redirect(new URL("/account", request.nextUrl));
  }

  if (isValid && isSecurityPath && role !== Role.OWNER) {
    if (role === Role.ADMIN) {
      return NextResponse.redirect(new URL("/admin", request.nextUrl));
    }
    return NextResponse.redirect(new URL("/account", request.nextUrl));
  }

  if (!isValid && isAdminPath) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude API routes, static files, image optimizations, .png and .gif files
    "/((?!api|_next/static|_next/image|.*\\.png$|.*\\.gif$).*)",
  ],
};
