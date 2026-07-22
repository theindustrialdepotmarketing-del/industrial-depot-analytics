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

    const funnelStages = [
      { id: "view_item", stageName: "Vista de producto", eventName: "view_item", status: "not_detected", isDetected: false, count: 0 },
      { id: "add_to_cart", stageName: "Agregar al carrito", eventName: "add_to_cart", status: "not_detected", isDetected: false, count: 0 },
      { id: "view_cart", stageName: "Ver carrito", eventName: "view_cart", status: "not_detected", isDetected: false, count: 0 },
      { id: "begin_checkout", stageName: "Iniciar checkout", eventName: "begin_checkout", status: "not_detected", isDetected: false, count: 0 },
      { id: "add_shipping_info", stageName: "Información de envío", eventName: "add_shipping_info", status: "not_detected", isDetected: false, count: 0 },
      { id: "add_payment_info", stageName: "Información de pago", eventName: "add_payment_info", status: "not_detected", isDetected: false, count: 0 },
      { id: "purchase", stageName: "Compra", eventName: "purchase", status: "detected", isDetected: true, count: overview.kpis.keyEvents.value },
    ];

    const detectedEvents = [
      "click",
      "first_visit",
      "form_start",
      "form_submit",
      "page_view",
      "purchase",
      "scroll",
      "session_start",
      "user_engagement",
      "view_search_results",
    ];

    const missingEcommerceEvents = [
      "view_item",
      "add_to_cart",
      "view_cart",
      "begin_checkout",
      "add_shipping_info",
      "add_payment_info",
    ];

    const funnelLimitationNotice =
      "El análisis detallado de abandono de carrito no está disponible actualmente debido a que las etapas intermedias (view_item, add_to_cart, view_cart, begin_checkout) no están siendo registradas en GA4. No es posible determinar exactamente dónde ocurre la pérdida de usuarios sin estos eventos previa a la compra.";

    const formClassificationNotice =
      "GA4 detecta el evento 'form_submit', pero este no debe marcarse automáticamente como Key Event principal. Se requiere una etapa previa de clasificación de formularios (ej. Contacto vs Cotizaciones) para evaluar si debe ser considerado una conversión secundaria.";

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
        ecommerceAudit: {
          primaryConversion: "purchase",
          funnelStages,
          detectedEvents,
          missingEcommerceEvents,
          funnelLimitationNotice,
          formClassificationNotice,
        },
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
