import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Health check endpoint for Docker container, load balancers, and monitoring.
 */
export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      service: "meawland-web",
    },
    { status: 200 },
  );
}
