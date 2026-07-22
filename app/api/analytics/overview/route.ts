import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { getOverviewMetrics, type PeriodKey } from "@/lib/services/analytics";
import { runDiagnosticEngine } from "@/lib/analytics/diagnostic-engine";

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
    const metrics = await getOverviewMetrics(period);
    const diagnostics = await runDiagnosticEngine(period);

    return NextResponse.json(
      {
        success: true,
        period,
        ranges: metrics.ranges,
        kpis: metrics.kpis,
        dailyTrends: metrics.dailyTrends,
        healthScore: diagnostics.healthBreakdown,
        findings: diagnostics.findings,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error obteniendo resumen analítico";
    return NextResponse.json(
      { success: false, error: "OVERVIEW_FETCH_FAILED", message },
      { status: 500 }
    );
  }
}
