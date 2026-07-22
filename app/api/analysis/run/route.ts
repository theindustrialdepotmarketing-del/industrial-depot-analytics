import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { runDiagnosticEngine } from "@/lib/analytics/diagnostic-engine";
import type { PeriodKey } from "@/lib/services/analytics";

export const runtime = "nodejs";

/**
 * POST /api/analysis/run
 * Protected administrative route to manually trigger full diagnostic analysis.
 * Evaluates traffic, engagement, conversions, attribution, pages & devices,
 * calculates Health Score, and persists alerts, recommendations & tasks into Supabase.
 */
export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED",
        message: "Se requiere sesión administrativa para ejecutar el análisis de diagnóstico.",
      },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const period: PeriodKey = (body.period as PeriodKey) || "30d";

    const report = await runDiagnosticEngine(period);

    return NextResponse.json(
      {
        success: true,
        period: report.period,
        healthScore: report.healthBreakdown,
        findingsCount: report.findings.length,
        campaignsAnalyzed: report.campaignClassifications.length,
        findings: report.findings,
        timestamp: new Date().toISOString(),
        message: "Análisis determinístico completado exitosamente.",
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error ejecutando análisis de diagnóstico";
    return NextResponse.json(
      {
        success: false,
        error: "ANALYSIS_FAILED",
        message: `Error ejecutando análisis: ${message}`,
      },
      { status: 500 }
    );
  }
}
