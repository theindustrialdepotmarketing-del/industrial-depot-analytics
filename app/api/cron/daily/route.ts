import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/cron/daily
 * Daily cron job protected by CRON_SECRET (set as Vercel cron secret).
 * Triggers nightly GA4 sync and alert evaluation.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // TODO: Implement daily sync when GA4 is connected
  const timestamp = new Date().toISOString();

  return NextResponse.json({
    success: true,
    message: "Cron job executed — GA4 sync pending configuration",
    timestamp,
    jobs: [],
  });
}
