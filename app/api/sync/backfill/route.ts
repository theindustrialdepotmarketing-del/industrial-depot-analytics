import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { runBackfillStep } from "@/lib/sync/backfill-sync";
import { BackfillRequestSchema } from "@/lib/types/database";

export const runtime = "nodejs";

/**
 * GET /api/sync/backfill
 * Returns the current status of any active or last historical backfill process.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED",
        message: "Se requiere sesión administrativa válida.",
      },
      { status: 401 }
    );
  }

  try {
    const result = await runBackfillStep(90, "status");
    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error consultando estado del backfill";
    return NextResponse.json(
      {
        success: false,
        error: "BACKFILL_STATUS_FAILED",
        message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync/backfill
 * Protected administrative route to start or continue chunked historical backfill.
 * Accepts body: { days: 30 | 60 | 90 | 180, action: "start" | "continue" | "status" }
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED",
        message: "Se requiere sesión administrativa válida para ejecutar la carga histórica.",
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const parseResult = BackfillRequestSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_REQUEST",
          message: "Parámetros inválidos. 'days' debe ser 30, 60, 90 o 180.",
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const days = parseResult.data.days as 30 | 60 | 90 | 180;
    const action = parseResult.data.action as "start" | "continue" | "status";

    const result = await runBackfillStep(days, action);

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error ejecutando carga histórica";
    return NextResponse.json(
      {
        success: false,
        error: "BACKFILL_FAILED",
        message: `Error en la carga histórica: ${message}`,
      },
      { status: 500 }
    );
  }
}
