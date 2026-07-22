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
    const stats = report.persistenceStats;

    const isSuccess =
      stats.alertsFailed === 0 &&
      stats.recommendationsFailed === 0 &&
      stats.tasksFailed === 0;

    return NextResponse.json(
      {
        success: isSuccess,
        period: report.period,
        findingsGenerated: stats.findingsGenerated,
        alertsAttempted: stats.alertsAttempted,
        alertsCreated: stats.alertsCreated,
        alertsUpdated: stats.alertsUpdated,
        alertsFailed: stats.alertsFailed,
        recommendationsAttempted: stats.recommendationsAttempted,
        recommendationsCreated: stats.recommendationsCreated,
        recommendationsUpdated: stats.recommendationsUpdated,
        recommendationsFailed: stats.recommendationsFailed,
        tasksAttempted: stats.tasksAttempted,
        tasksCreated: stats.tasksCreated,
        tasksUpdated: stats.tasksUpdated,
        tasksFailed: stats.tasksFailed,
        taskErrorCode: stats.taskErrorCode,
        healthScore: report.healthBreakdown,
        message: isSuccess
          ? "Análisis determinístico completado exitosamente y persistido en Supabase."
          : `Análisis completado con ${stats.alertsFailed + stats.recommendationsFailed + stats.tasksFailed} errores de persistencia en Supabase.`,
      },
      { status: isSuccess ? 200 : 207 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error ejecutando análisis de diagnóstico";
    console.error("[POST /api/analysis/run Error]", { message });

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
