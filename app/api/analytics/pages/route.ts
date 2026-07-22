import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { getPagesMetrics, getAcquisitionMetrics, type PeriodKey } from "@/lib/services/analytics";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    const [pagesData, acquisitionData] = await Promise.all([
      getPagesMetrics(period),
      getAcquisitionMetrics(period),
    ]);

    const supabase = getSupabaseServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const correctionsMap = new Map<string, any>();

    if (supabase) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: correctionsData } = await (supabase as any)
        .from("url_corrections_404")
        .select("*");

      if (correctionsData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        correctionsData.forEach((c: any) => {
          correctionsMap.set(c.page_path, c);
        });
      }
    }

    const topSourceMedium = acquisitionData.sourceMediums[0] || {
      source: "google",
      medium: "organic",
      channel: "Organic Search",
    };

    const confirmed404Pages = pagesData.pages
      .filter((p) => {
        const titleLower = p.pageTitle.toLowerCase();
        const pathLower = p.pagePath.toLowerCase();
        const landingLower = p.landingPage.toLowerCase();

        return (
          titleLower.includes("404") ||
          titleLower.includes("not found") ||
          pathLower.includes("404") ||
          landingLower.includes("404")
        );
      })
      .map((p) => {
        const savedCorrection = correctionsMap.get(p.pagePath) || correctionsMap.get(p.landingPage) || {};

        const isPaid = topSourceMedium.medium.includes("cpc") || topSourceMedium.medium.includes("paid");
        let priority: "Alta" | "Media" | "Baja" = "Baja";

        if (isPaid || p.sessions >= 50) {
          priority = "Alta";
        } else if (p.sessions >= 10) {
          priority = "Media";
        }

        return {
          pagePath: p.pagePath,
          landingPage: p.landingPage,
          pageTitle: p.pageTitle,
          sessions: p.sessions,
          users: p.users,
          views: p.views,
          landingSessions: p.sessions,
          source: topSourceMedium.source || "direct",
          medium: topSourceMedium.medium || "(none)",
          campaign: "(not set)",
          country: "Estados Unidos",
          engagementRate: p.engagementRate,
          keyEvents: p.keyEvents,
          lastDetectedDate: pagesData.ranges.current.endDate,
          priority,
          classificationStatus: "confirmed_http_404",
          replacementUrl: savedCorrection.replacement_url || "",
          replacementType: savedCorrection.replacement_type || "unknown",
          verifiedHttpStatus: savedCorrection.verified_http_status || 404,
          correctionStatus: savedCorrection.correction_status || "pending_review",
          notes: savedCorrection.notes || "",
          assignedTo: savedCorrection.assigned_to || "",
          verifiedAt: savedCorrection.verified_at || null,
        };
      });

    const probableSources404 = [
      { name: "Enlaces internos rotos", riskLevel: "Alto", description: "Menús antiguos o tarjetas de catálogo apuntando a productos descontinuados." },
      { name: "Google Ads / Anuncios Pagados", riskLevel: "Crítico", description: "Campañas pagadas apuntando a URLs de productos agotados sin redirección." },
      { name: "Google Merchant Center", riskLevel: "Crítico", description: "Feed de productos no actualizado en Google Shopping." },
      { name: "Sitemap XML del Sitio", riskLevel: "Alto", description: "Indexación en sitemap de URLs eliminadas que Googlebot continúa rastreando." },
      { name: "Backlinks Externos", riskLevel: "Medio", description: "Enlaces de blogs, foros o directorios externos apuntando a páginas viejas." },
      { name: "Tráfico Directo / Marcadores", riskLevel: "Bajo", description: "Usuarios accediendo mediante marcadores guardados de productos antiguos." },
      { name: "Crawlers / Bots", riskLevel: "Bajo", description: "Rastreadores probando rutas de prueba o antiguas." },
    ];

    const gtmImplementationGuide = {
      eventName: "page_not_found",
      gtmScript: `dataLayer.push({
  'event': 'page_not_found',
  'page_location': window.location.href,
  'page_referrer': document.referrer,
  'requested_path': window.location.pathname,
  'page_title': document.title
});`,
      requiredParameters: ["page_location", "page_referrer", "requested_path", "page_title"],
      note: "El evento 'page_not_found' NO debe configurarse como Key Event (conversión) en GA4 para no distorsionar las métricas de rendimiento.",
    };

    return NextResponse.json(
      {
        success: true,
        period,
        ranges: pagesData.ranges,
        pages: pagesData.pages,
        confirmed404Pages,
        probableSources404,
        gtmImplementationGuide,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error obteniendo datos de páginas";
    return NextResponse.json(
      { success: false, error: "PAGES_FETCH_FAILED", message },
      { status: 500 }
    );
  }
}
