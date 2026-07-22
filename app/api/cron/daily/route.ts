import { NextResponse, type NextRequest } from "next/server";
import { runDailySync } from "@/lib/sync/daily-sync";

export const runtime = "nodejs";

/**
 * GET /api/cron/daily
 * Vercel Cron Endpoint (Runs daily at 11:00 AM UTC via vercel.json).
 * Protected via Authorization: Bearer CRON_SECRET header.
 * Exclusively executes server-side on Node.js runtime.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      {
        success: false,
        error: "CRON_SECRET_NOT_CONFIGURED",
        message: "CRON_SECRET no está configurado en las variables de entorno.",
      },
      { status: 401 }
    );
  }

  const expectedAuth = `Bearer ${cronSecret}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED_CRON",
        message: "Acceso no autorizado al endpoint de Cron.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await runDailySync("daily");
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error durante la ejecución del cron";
    return NextResponse.json(
      {
        success: false,
        error: "CRON_SYNC_FAILED",
        message: `Error ejecutando sincronización automática: ${message}`,
      },
      { status: 500 }
    );
  }
}
