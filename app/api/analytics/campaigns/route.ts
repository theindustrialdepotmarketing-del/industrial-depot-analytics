import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { runDiagnosticEngine } from "@/lib/analytics/diagnostic-engine";
import type { PeriodKey } from "@/lib/services/analytics";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Se requiere sesión activa." },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const period = (searchParams.get("period") as PeriodKey) || "30d";

  try {
    const report = await runDiagnosticEngine(period);

    return NextResponse.json(
      {
        success: true,
        period,
        campaigns: report.campaignClassifications,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error obteniendo datos de campañas";
    return NextResponse.json(
      { success: false, error: "CAMPAIGNS_FETCH_FAILED", message },
      { status: 500 }
    );
  }
}
