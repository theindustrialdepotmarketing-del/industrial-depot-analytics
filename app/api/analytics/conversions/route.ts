import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import {
  getOverviewMetrics,
  getAcquisitionMetrics,
  getPagesMetrics,
  getAudienceMetrics,
  type PeriodKey,
} from "@/lib/services/analytics";

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
    const [overview, acquisition, pagesData, audience] = await Promise.all([
      getOverviewMetrics(period),
      getAcquisitionMetrics(period),
      getPagesMetrics(period),
      getAudienceMetrics(period),
    ]);

    return NextResponse.json(
      {
        success: true,
        period,
        ranges: overview.ranges,
        keyEventsKpi: overview.kpis.keyEvents,
        keyEventRateKpi: overview.kpis.sessionKeyEventRate,
        dailyTrends: overview.dailyTrends,
        channels: acquisition.channels,
        sourceMediums: acquisition.sourceMediums,
        pages: pagesData.pages,
        devices: audience.devices,
        countries: audience.countries,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error obteniendo datos de conversiones";
    return NextResponse.json(
      { success: false, error: "CONVERSIONS_FETCH_FAILED", message },
      { status: 500 }
    );
  }
}
