import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runDailySync } from "@/lib/sync/daily-sync";

export const runtime = "nodejs";

/**
 * POST /api/analytics/sync
 * Protected administrative route to manually trigger GA4 -> Supabase synchronization.
 * Requires an authenticated admin session.
 * Exclusively executes server-side on Node.js runtime.
 */
export async function POST() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED",
        message: "Se requiere sesión administrativa para ejecutar la sincronización manual.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await runDailySync("manual");
    return NextResponse.json(
      {
        ...result,
        message: "Sincronización manual completada exitosamente.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error durante la sincronización manual";
    return NextResponse.json(
      {
        success: false,
        error: "MANUAL_SYNC_FAILED",
        message: `Error ejecutando sincronización manual: ${message}`,
      },
      { status: 500 }
    );
  }
}
