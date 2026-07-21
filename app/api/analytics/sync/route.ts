import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/analytics/sync
 * Private route to sync Google Analytics data to Supabase.
 * Protected by session authentication.
 * Returns 503 until GA4 connection is configured.
 */
export const POST = auth(async function (req) {
  if (!req.auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ga4PropertyId = process.env.GA4_PROPERTY_ID;

  if (!ga4PropertyId) {
    return NextResponse.json(
      {
        success: false,
        message: "GA4 not configured. Set GA4_PROPERTY_ID in environment variables.",
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }

  // TODO: Implement GA4 sync via Workload Identity Federation
  // This will be enabled in Phase 2 when GA4 credentials are configured.
  return NextResponse.json(
    {
      success: false,
      message: "GA4 sync not yet implemented. Configure Workload Identity Federation first.",
      timestamp: new Date().toISOString(),
    },
    { status: 503 }
  );
});
