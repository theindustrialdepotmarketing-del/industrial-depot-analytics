import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  getOverviewMetrics,
  getAcquisitionMetrics,
  getPagesMetrics,
  getAudienceMetrics,
  type PeriodKey,
} from "@/lib/services/analytics";
import {
  ANALYTICS_THRESHOLDS,
  type DiagnosticFinding,
} from "@/lib/analytics/thresholds";

export interface CampaignClassification {
  campaignName: string;
  channel: string;
  source: string;
  medium: string;
  users: number;
  sessions: number;
  engagedSessions: number;
  engagementRate: number;
  keyEvents: number;
  conversionRate: number;
  revenue: number;
  classification: "CONTINUAR" | "OPTIMIZAR" | "VIGILAR" | "REVISAR/DETENER";
  recommendationText: string;
  hasErrors: boolean;
  errorDetails?: string[];
}

export interface HealthScoreBreakdown {
  trafficScore: number;     // max 20
  engagementScore: number;  // max 20
  conversionScore: number;  // max 25
  campaignQualityScore: number; // max 20
  measurementScore: number; // max 15
  totalScore: number;      // max 100
  status: "Saludable" | "Requiere atención" | "Crítico";
  color: string;
}

export interface PersistenceStats {
  findingsGenerated: number;
  alertsAttempted: number;
  alertsCreated: number;
  alertsUpdated: number;
  alertsFailed: number;
  recommendationsCreated: number;
  tasksCreated: number;
}

export type LandingPageType =
  | "homepage"
  | "category"
  | "product"
  | "campaign_landing"
  | "checkout"
  | "informational"
  | "other";

/**
 * Classifies landing page URL path into logical e-commerce categories.
 */
export function classifyLandingPagePath(landingPage: string): LandingPageType {
  const path = landingPage.toLowerCase().trim();

  if (
    path === "/" ||
    path === "/home" ||
    path === "" ||
    path.includes("(not set)")
  ) {
    return "homepage";
  }
  if (
    path.includes("/product/") ||
    path.includes("/producto/") ||
    path.includes("/p/") ||
    path.includes("-p-") ||
    path.includes("/item/")
  ) {
    return "product";
  }
  if (
    path.includes("/category/") ||
    path.includes("/categoria/") ||
    path.includes("/collections/") ||
    path.includes("/collection/") ||
    path.includes("/catalog/") ||
    path.includes("/catalogo/")
  ) {
    return "category";
  }
  if (
    path.includes("/lp/") ||
    path.includes("/landing/") ||
    path.includes("/promo/") ||
    path.includes("/oferta/") ||
    path.includes("/campaign/")
  ) {
    return "campaign_landing";
  }
  if (
    path.includes("/cart") ||
    path.includes("/checkout") ||
    path.includes("/carrito") ||
    path.includes("/pago")
  ) {
    return "checkout";
  }
  if (
    path.includes("/about") ||
    path.includes("/contacto") ||
    path.includes("/contact") ||
    path.includes("/blog") ||
    path.includes("/faq") ||
    path.includes("/politica") ||
    path.includes("/terminos")
  ) {
    return "informational";
  }
  return "other";
}

/**
 * Formats rate values (0.0 to 1.0) into human readable percentages with max 2 decimals.
 * E.g.: 0.8263 -> "82.63%", 0.1141 -> "11.41%"
 */
function formatPercentRate(rate: number): string {
  if (rate === undefined || rate === null) return "0.00%";
  if (Math.abs(rate) > 1.0) {
    return `${rate.toFixed(2)}%`;
  }
  return `${(rate * 100).toFixed(2)}%`;
}

/**
 * Formats delta percentages (e.g. +15.42 or -30.12).
 */
function formatDeltaPercent(val: number): string {
  if (val === undefined || val === null) return "0.00%";
  const sign = val > 0 ? "+" : "";
  return `${sign}${val.toFixed(2)}%`;
}

/**
 * Formats numbers avoiding excessive decimals.
 */
function formatNum(val: number): string {
  if (val === undefined || val === null) return "0";
  if (Number.isInteger(val)) {
    return val.toLocaleString("es-ES");
  }
  return val.toFixed(2);
}

/**
 * Diagnostic Engine for Industrial Depot Analytics.
 * Deterministically evaluates traffic, engagement, conversions, attribution, page & device performance.
 */
export async function runDiagnosticEngine(period: PeriodKey = "30d") {
  const [overview, acquisition, pagesData, audience] = await Promise.all([
    getOverviewMetrics(period),
    getAcquisitionMetrics(period),
    getPagesMetrics(period),
    getAudienceMetrics(period),
  ]);

  const findings: DiagnosticFinding[] = [];

  // Global Key Metric Variables
  const trafficPercent = overview.kpis.sessions.percentChange;
  const trafficSessions = overview.kpis.sessions.value;
  const prevTrafficSessions = overview.kpis.sessions.prevValue;
  const eventsPercent = overview.kpis.keyEvents.percentChange;
  const totalKeyEvents = overview.kpis.keyEvents.value;
  const prevKeyEvents = overview.kpis.keyEvents.prevValue;
  const eventsChange = overview.kpis.keyEvents.percentChange;
  const convRatePercent = overview.kpis.sessionKeyEventRate.percentChange;
  const engagementChange = overview.kpis.engagementRate.percentChange;
  const avgEngagementRate = overview.kpis.engagementRate.value;
  const prevEngagementRate = overview.kpis.engagementRate.prevValue;

  // ─── 1. TRAFFIC RULES & DILUTION ───
  if (trafficPercent <= ANALYTICS_THRESHOLDS.TRAFFIC.CRITICAL_DROP) {
    findings.push({
      id: "traffic-critical-drop",
      fingerprint: "traffic:critical-drop:all",
      category: "traffic",
      severity: "critical",
      title: "Caída Crítica de Tráfico Total",
      description: `Hecho: El volumen de sesiones cayó un ${Math.abs(trafficPercent).toFixed(2)}% respecto al periodo anterior (${formatNum(prevTrafficSessions)} -> ${formatNum(trafficSessions)}).`,
      evidence: `Sesiones periodo actual: ${formatNum(trafficSessions)}, previo: ${formatNum(prevTrafficSessions)} (${formatDeltaPercent(trafficPercent)}).`,
      currentValue: Number(trafficSessions.toFixed(2)),
      previousValue: Number(prevTrafficSessions.toFixed(2)),
      percentageChange: Number(trafficPercent.toFixed(2)),
      affectedEntity: "Sitio Web Completo",
      proposedAction: "Verificar disponibilidad del sitio web, registros DNS, campañas activas y posibles bloqueos de indexación en buscadores.",
      targetMetric: "sessions",
    });
  } else if (trafficPercent <= ANALYTICS_THRESHOLDS.TRAFFIC.HIGH_DROP) {
    findings.push({
      id: "traffic-high-drop",
      fingerprint: "traffic:high-drop:all",
      category: "traffic",
      severity: "high",
      title: "Caída Severa de Tráfico",
      description: `Hecho: Las sesiones disminuyeron un ${Math.abs(trafficPercent).toFixed(2)}% respecto al periodo anterior (${formatNum(prevTrafficSessions)} -> ${formatNum(trafficSessions)}).`,
      evidence: `Variación de sesiones: ${formatDeltaPercent(trafficPercent)}.`,
      currentValue: Number(trafficSessions.toFixed(2)),
      previousValue: Number(prevTrafficSessions.toFixed(2)),
      percentageChange: Number(trafficPercent.toFixed(2)),
      affectedEntity: "Sitio Web Completo",
      proposedAction: "Auditar canales de adquisición principales para identificar la fuente de la pérdida de usuarios.",
      targetMetric: "sessions",
    });
  } else if (trafficPercent <= ANALYTICS_THRESHOLDS.TRAFFIC.MODERATE_DROP) {
    findings.push({
      id: "traffic-moderate-drop",
      fingerprint: "traffic:moderate-drop:all",
      category: "traffic",
      severity: "medium",
      title: "Caída Moderada de Tráfico",
      description: `Hecho: Se observa un descenso del ${Math.abs(trafficPercent).toFixed(2)}% en las sesiones globales (${formatNum(prevTrafficSessions)} -> ${formatNum(trafficSessions)}).`,
      evidence: `Sesiones: ${formatNum(trafficSessions)} vs ${formatNum(prevTrafficSessions)} anteriores.`,
      currentValue: Number(trafficSessions.toFixed(2)),
      previousValue: Number(prevTrafficSessions.toFixed(2)),
      percentageChange: Number(trafficPercent.toFixed(2)),
      affectedEntity: "Sitio Web Completo",
      proposedAction: "Monitorear palabras clave orgánicas y campañas pagadas en los próximos días.",
      targetMetric: "sessions",
    });
  } else if (trafficPercent >= ANALYTICS_THRESHOLDS.TRAFFIC.SIGNIFICANT_GROWTH) {
    const keyEventsProportional = eventsPercent >= trafficPercent * 0.8;
    const convRateImproved = convRatePercent >= 0;
    const engagementImproved = engagementChange >= 0;

    const contextSummary = `Contexto de calidad: Key Events ${eventsPercent >= 0 ? "+" : ""}${eventsPercent.toFixed(2)}% (${keyEventsProportional ? "crecimiento proporcional" : "crecimiento por debajo del ritmo de tráfico"}), Tasa de conversión ${convRateImproved ? "mejoró (" + formatDeltaPercent(convRatePercent) + ")" : "empeoró (" + formatDeltaPercent(convRatePercent) + ")"}, Engagement ${engagementImproved ? "mejoró (" + formatDeltaPercent(engagementChange) + ")" : "empeoró (" + formatDeltaPercent(engagementChange) + ")"}.`;

    findings.push({
      id: "traffic-growth",
      fingerprint: "traffic:growth:all",
      category: "traffic",
      severity: "info",
      title: "Fortaleza: Crecimiento Significativo de Tráfico",
      description: `Hecho: Las sesiones aumentaron un ${formatDeltaPercent(trafficPercent)} respecto al periodo anterior (${formatNum(prevTrafficSessions)} -> ${formatNum(trafficSessions)}). ${contextSummary}`,
      evidence: `Incremento de +${formatNum(trafficSessions - prevTrafficSessions)} sesiones. ${contextSummary}`,
      currentValue: Number(trafficSessions.toFixed(2)),
      previousValue: Number(prevTrafficSessions.toFixed(2)),
      percentageChange: Number(trafficPercent.toFixed(2)),
      affectedEntity: "Sitio Web Completo",
      proposedAction: "Capitalizar el incremento de usuarios optimizando los embudos de conversión y refinando las audiencias con mejor retorno.",
      targetMetric: "sessions",
    });
  }

  // Requisito 10: Nueva Alerta Adicional si Sesiones > 20% Y (Key Events NO aumentan proporcionalmente O Engagement cae > 15%)
  if (
    trafficPercent > 20 &&
    (eventsPercent < trafficPercent * 0.5 || engagementChange < -15)
  ) {
    const isConvLagging = eventsPercent < trafficPercent * 0.5;
    const isEngagementDropping = engagementChange < -15;

    let dilutionReason = "";
    if (isConvLagging && isEngagementDropping) {
      dilutionReason = `las conversiones crecieron solo ${formatDeltaPercent(eventsPercent)} y la tasa de engagement cayó un ${Math.abs(engagementChange).toFixed(2)}%`;
    } else if (isConvLagging) {
      dilutionReason = `las conversiones crecieron solo ${formatDeltaPercent(eventsPercent)} (ritmo insuficiente respecto al +${trafficPercent.toFixed(2)}% de tráfico)`;
    } else {
      dilutionReason = `la tasa de engagement cayó un ${Math.abs(engagementChange).toFixed(2)}%`;
    }

    findings.push({
      id: "traffic-dilution-warning",
      fingerprint: "traffic:dilution:all",
      category: "traffic",
      severity: isEngagementDropping ? "high" : "medium",
      title: "Dilución de Calidad de Tráfico",
      description: `Hecho: Las sesiones registraron un fuerte aumento del ${formatDeltaPercent(trafficPercent)}, pero ${dilutionReason}. Hipótesis: Las nuevas fuentes de volumen atraen usuarios con baja intención comercial o problemas de relevancia en la landing.`,
      evidence: `Tráfico: ${formatDeltaPercent(trafficPercent)}, Key Events: ${formatDeltaPercent(eventsPercent)}, Engagement: ${formatDeltaPercent(engagementChange)}.`,
      currentValue: Number(trafficSessions.toFixed(2)),
      previousValue: Number(prevTrafficSessions.toFixed(2)),
      percentageChange: Number(trafficPercent.toFixed(2)),
      affectedEntity: "Calidad de Audiencia",
      proposedAction: "Auditar los canales y campañas que explicaron el volumen de tráfico reciente y optimizar la segmentación para atraer usuarios calificados.",
      targetMetric: "sessions",
    });
  }

  // ─── 2. ENGAGEMENT RULES WITH AUTOMATIC BREAKDOWN ───
  if (engagementChange < ANALYTICS_THRESHOLDS.ENGAGEMENT.DROP_THRESHOLD) {
    let worstDevice = "Desktop";
    let worstDeviceConvRate = 1.0;
    for (const d of audience.devices) {
      if (d.conversionRate < worstDeviceConvRate && d.sessions > 10) {
        worstDeviceConvRate = d.conversionRate;
        worstDevice = d.device;
      }
    }

    let worstChannel = "Direct";
    let worstChannelRate = 1.0;
    for (const ch of acquisition.channels) {
      if (ch.engagementRate < worstChannelRate && ch.sessions > 10) {
        worstChannelRate = ch.engagementRate;
        worstChannel = ch.channel;
      }
    }

    let worstPage = "/";
    let worstPageRate = 1.0;
    for (const p of pagesData.pages) {
      if (p.engagementRate < worstPageRate && p.sessions > 10) {
        worstPageRate = p.engagementRate;
        worstPage = p.landingPage;
      }
    }

    const breakdownText = `Desglose por segmentos principales: ` +
      `Dispositivo crítico: ${worstDevice} (${formatPercentRate(worstDeviceConvRate)} conv. rate). ` +
      `Canal crítico: ${worstChannel} (${formatPercentRate(worstChannelRate)} engagement). ` +
      `Página crítica: ${worstPage} (${formatPercentRate(worstPageRate)} engagement). ` +
      `Segmento explicativo principal: Canal ${worstChannel} y experiencia en ${worstDevice}.`;

    findings.push({
      id: "engagement-drop",
      fingerprint: "engagement:drop:all",
      category: "engagement",
      severity: "medium",
      title: "Deterioro en la Tasa de Engagement",
      description: `Hecho: La tasa de engagement global disminuyó un ${Math.abs(engagementChange).toFixed(2)}% respecto al periodo anterior (${formatPercentRate(prevEngagementRate)} -> ${formatPercentRate(avgEngagementRate)}). Hipótesis: Fricción en tiempos de carga o desalineación entre expectativas del anuncio y contenido. ${breakdownText}`,
      evidence: `Engagement actual: ${formatPercentRate(avgEngagementRate)}, previo: ${formatPercentRate(prevEngagementRate)}. ${breakdownText}`,
      currentValue: Number((avgEngagementRate * 100).toFixed(2)),
      previousValue: Number((prevEngagementRate * 100).toFixed(2)),
      percentageChange: Number(engagementChange.toFixed(2)),
      affectedEntity: `Segmento Crítico: ${worstChannel} / ${worstDevice}`,
      proposedAction: "Revisar tiempo de carga de páginas de destino y relevancia del contenido en el segmento crítico identificado.",
      targetMetric: "engagement_rate",
    });
  }

  // ─── 3. CONVERSION RULES ───
  if (trafficSessions >= ANALYTICS_THRESHOLDS.CONVERSIONS.MIN_SESSIONS_ZERO_EVENTS && totalKeyEvents === 0) {
    findings.push({
      id: "conversions-zero",
      fingerprint: "conversions:zero:all",
      category: "conversions",
      severity: "critical",
      title: "Cero Conversiones Registradas",
      description: `Hecho: Se han registrado ${formatNum(trafficSessions)} sesiones en el periodo pero 0 Key Events (conversiones). Hipótesis: Foco en falla técnica de etiquetado o ruptura en el flujo del checkout.`,
      evidence: `Sesiones: ${formatNum(trafficSessions)}, Key Events: 0.`,
      currentValue: 0,
      previousValue: Number(prevKeyEvents.toFixed(2)),
      percentageChange: -100,
      affectedEntity: "Medición de Conversiones GA4",
      proposedAction: "Auditar inmediatamente los activadores de eventos en Google Tag Manager y verificar la configuración de Key Events en GA4.",
      targetMetric: "key_events",
    });
  }

  if (eventsChange <= ANALYTICS_THRESHOLDS.CONVERSIONS.KEY_EVENTS_DROP && totalKeyEvents > 0) {
    findings.push({
      id: "conversions-drop",
      fingerprint: "conversions:drop:all",
      category: "conversions",
      severity: "high",
      title: "Caída Significativa de Conversiones",
      description: `Hecho: Los Key Events registraron una caída del ${Math.abs(eventsChange).toFixed(2)}% (${formatNum(prevKeyEvents)} -> ${formatNum(totalKeyEvents)}). Hipótesis: Problemas en la pasarela de pago, botones CTA inaccesibles o cambios de precio.`,
      evidence: `Key events actual: ${formatNum(totalKeyEvents)}, previo: ${formatNum(prevKeyEvents)}.`,
      currentValue: Number(totalKeyEvents.toFixed(2)),
      previousValue: Number(prevKeyEvents.toFixed(2)),
      percentageChange: Number(eventsChange.toFixed(2)),
      affectedEntity: "Embudo de Conversión",
      proposedAction: "Verificar formularios de contacto, proceso de checkout y botones de llamadas a la acción principales.",
      targetMetric: "key_events",
    });
  }

  if (trafficPercent > 10 && eventsChange < 0) {
    findings.push({
      id: "conversions-divergence",
      fingerprint: "conversions:divergence:all",
      category: "conversions",
      severity: "high",
      title: "Divergencia: Tráfico Sube pero Conversiones Caen",
      description: `Hecho: Las sesiones aumentaron un ${formatDeltaPercent(trafficPercent)} pero los Key Events cayeron un ${Math.abs(eventsChange).toFixed(2)}%. Hipótesis: Tráfico atraído de fuentes no calificadas sin intención de compra.`,
      evidence: `Tráfico: ${formatDeltaPercent(trafficPercent)}, Conversiones: ${formatDeltaPercent(eventsChange)}.`,
      currentValue: Number(totalKeyEvents.toFixed(2)),
      previousValue: Number(prevKeyEvents.toFixed(2)),
      percentageChange: Number(eventsChange.toFixed(2)),
      affectedEntity: "Calidad de Tráfico",
      proposedAction: "Revisar si las fuentes de nuevo tráfico atraen usuarios sin intención comercial real.",
      targetMetric: "session_key_event_rate",
    });
  }

  // ─── 3.1. E-COMMERCE FUNNEL MEASUREMENT RULE ───
  findings.push({
    id: "ecommerce-funnel-incomplete",
    fingerprint: "measurement:ecommerce-funnel-incomplete:all",
    category: "measurement",
    severity: "critical",
    title: "Implementación Incompleta del Embudo de Comercio Electrónico",
    description: "Hecho: GA4 recibe eventos de 'purchase', pero NO recibe 'view_item', 'add_to_cart', 'view_cart', 'begin_checkout', 'add_shipping_info' ni 'add_payment_info'. Hipótesis: La capa de datos (dataLayer) o las etiquetas e-commerce en Google Tag Manager no han sido configuradas para las etapas previas a la compra.",
    evidence: "GA4 recibe purchase, pero no recibe view_item, add_to_cart, view_cart ni begin_checkout. Eventos detectados: click, first_visit, form_start, form_submit, page_view, purchase, scroll, session_start, user_engagement, view_search_results.",
    currentValue: 1,
    previousValue: 7,
    percentageChange: -85.71,
    affectedEntity: "Medición E-Commerce GA4",
    proposedAction: "1) Revisar la configuración de Google Tag Manager o gtag.js. 2) Implementar los eventos recomendados de e-commerce en la dataLayer. 3) Incluir parámetros obligatorios: currency, value, transaction_id e items. 4) Validar cada evento mediante GA4 DebugView. 5) Probar el flujo completo en desktop y dispositivos móviles.",
    targetMetric: "ecommerce_funnel_coverage",
  });


  // ─── 4. ATTRIBUTION & UTM RULES ───
  let totalSessionsAcquisition = 0;
  let directSessions = 0;
  let unassignedSessions = 0;
  let notSetSessions = 0;

  for (const ch of acquisition.channels) {
    totalSessionsAcquisition += ch.sessions;
    if (ch.channel.toLowerCase().includes("direct")) directSessions += ch.sessions;
    if (ch.channel.toLowerCase().includes("unassigned")) unassignedSessions += ch.sessions;
    if (ch.channel.includes("(not set)")) notSetSessions += ch.sessions;
  }

  const directRatio = totalSessionsAcquisition > 0 ? directSessions / totalSessionsAcquisition : 0;
  const unassignedRatio = totalSessionsAcquisition > 0 ? unassignedSessions / totalSessionsAcquisition : 0;
  const notSetRatio = totalSessionsAcquisition > 0 ? notSetSessions / totalSessionsAcquisition : 0;

  if (directRatio > ANALYTICS_THRESHOLDS.ATTRIBUTION.MAX_DIRECT_RATIO) {
    const directAction = "Realizar una auditoría prioritaria de atribución que incluya: 1) UTMs en campañas de Email Marketing. 2) UTMs en catálogos digitales y PDFs. 3) Enlaces compartidos en WhatsApp y mensajería. 4) Enlaces de proveedores y socios comerciales. 5) Redirecciones HTTP que borran UTMs. 6) Tracking entre dominios (Cross-domain). 7) Banner de Consentimiento (Consent Mode). 8) Auto-tagging (gclid) de Google Ads.";

    findings.push({
      id: "attribution-excessive-direct",
      fingerprint: "attribution:excessive-direct:all",
      category: "attribution",
      severity: "high",
      title: "Tráfico Direct Excesivo",
      description: `Hecho: El canal Direct representa el ${formatPercentRate(directRatio)} del tráfico total (${formatNum(directSessions)} de ${formatNum(totalSessionsAcquisition)} sesiones). Hipótesis: Falta de etiquetado UTM en campañas offline/email/social, redirecciones que pierden parámetros o problemas de Consent Mode.`,
      evidence: `Sesiones Direct: ${formatNum(directSessions)} de ${formatNum(totalSessionsAcquisition)} totales (${formatPercentRate(directRatio)}).`,
      currentValue: Number((directRatio * 100).toFixed(2)),
      percentageChange: Number(((directRatio - 0.4) * 100).toFixed(2)),
      affectedEntity: "Atribución de Canales",
      proposedAction: directAction,
      targetMetric: "direct_ratio",
    });
  }

  if (unassignedRatio > ANALYTICS_THRESHOLDS.ATTRIBUTION.MAX_UNASSIGNED_RATIO) {
    findings.push({
      id: "attribution-unassigned",
      fingerprint: "attribution:unassigned:all",
      category: "attribution",
      severity: "medium",
      title: "Tráfico Unassigned Elevado",
      description: `Hecho: El ${formatPercentRate(unassignedRatio)} del tráfico no está categorizado en ningún canal reconocido por GA4 (${formatNum(unassignedSessions)} sesiones). Hipótesis: Nomenclatura no estándar en utm_source y utm_medium.`,
      evidence: `Sesiones Unassigned: ${formatNum(unassignedSessions)} (${formatPercentRate(unassignedRatio)}).`,
      currentValue: Number((unassignedRatio * 100).toFixed(2)),
      affectedEntity: "Reglas de Grupo de Canales GA4",
      proposedAction: "Estandarizar utm_source y utm_medium de acuerdo a las convenciones de nomenclatura predeterminadas de GA4.",
      targetMetric: "unassigned_ratio",
    });
  }

  if (notSetRatio > ANALYTICS_THRESHOLDS.ATTRIBUTION.MAX_NOT_SET_RATIO) {
    findings.push({
      id: "attribution-not-set",
      fingerprint: "attribution:not-set:all",
      category: "attribution",
      severity: "medium",
      title: "Valores (not set) en Fuentes o Campañas",
      description: `Hecho: El ${formatPercentRate(notSetRatio)} del tráfico registra parámetros de atribución sin definir (${formatNum(notSetSessions)} sesiones). Hipótesis: Enlaces rotos o incompletos en anuncios y redes sociales.`,
      evidence: `Sesiones (not set): ${formatNum(notSetSessions)}.`,
      currentValue: Number((notSetRatio * 100).toFixed(2)),
      affectedEntity: "Etiquetado de Campañas",
      proposedAction: "Auditar enlaces de anuncios pagados y publicaciones en redes sociales para asegurar que incluyan UTMs válidas.",
      targetMetric: "not_set_ratio",
    });
  }

  // ─── 5. PAGE & LANDING RULES ───
  for (const page of pagesData.pages) {
    if (page.sessions >= 50 && page.keyEvents === 0) {
      const pageType = classifyLandingPagePath(page.landingPage);
      let pageTitle = "";
      let pageAction = "";
      let pageHypothesis = "";

      if (pageType === "homepage") {
        pageTitle = "Página Principal con Alto Tráfico y Cero Conversiones Directas";
        pageHypothesis = "Es usual que la portada sirva como vía de tránsito hacia el catálogo o categorías.";
        pageAction = "Revisar el embudo posterior desde la página principal y verificar navegación hacia categorías, productos, carrito y checkout.";
      } else if (
        (pageType === "product" || pageType === "category") &&
        page.sessions >= 100
      ) {
        const entityKind = pageType === "product" ? "producto" : "categoría";
        pageTitle = `Página de ${entityKind.toUpperCase()} con ${formatNum(page.sessions)} Sesiones y Cero Conversiones`;
        pageHypothesis = "Falla de medición de eventos, baja visibilidad de CTA, objeciones de precio/envío, o velocidad móvil deficiente.";
        pageAction = "1) Verificar medición de add_to_cart, begin_checkout y purchase. 2) Revisar visibilidad de botones CTA. 3) Revisar precio, disponibilidad y costo de envío. 4) Revisar velocidad y experiencia móvil. 5) Auditar la calidad del tráfico entrante.";
      } else if (pageType === "campaign_landing") {
        pageTitle = `Landing de Campaña sin Conversiones (${page.landingPage})`;
        pageHypothesis = "Desalineación entre el anuncio y la oferta de la página o ausencia de CTA claro.";
        pageAction = "Auditar la coincidencia entre la promesa del anuncio y el contenido de la landing page, e incorporar un CTA principal visible.";
      } else if (pageType === "checkout") {
        pageTitle = `Embudo de Checkout / Carrito con Cero Conversiones (${page.landingPage})`;
        pageHypothesis = "Falla técnica en la pasarela de pago o fricción extrema en los datos requeridos.";
        pageAction = "Auditar de inmediato la pasarela de pago, métodos de envío y campos requeridos del formulario de pago.";
      } else {
        pageTitle = `Página con Alto Tráfico y Cero Conversiones (${page.landingPage})`;
        pageHypothesis = "Falta de llamados a la acción contextuales hacia páginas comerciales.";
        pageAction = "Añadir llamadas a la acción (CTA) visibles y formularios de captura rápida en esta página.";
      }

      const descriptionText = `Hecho: ${formatNum(page.sessions)} sesiones acumuladas en '${page.landingPage}' y 0 Key Events registrados. Hipótesis: ${pageHypothesis}`;

      findings.push({
        id: `page-zero-events-${page.landingPage}`,
        fingerprint: `pages:zero-events:${page.landingPage}`,
        category: "pages",
        severity: page.sessions >= 100 ? "high" : "medium",
        title: pageTitle,
        description: descriptionText,
        evidence: `Hecho: Página ${page.landingPage}, Sesiones: ${formatNum(page.sessions)}, Key Events: 0.`,
        currentValue: Number(page.sessions.toFixed(2)),
        previousValue: 0,
        affectedEntity: page.landingPage,
        proposedAction: pageAction,
        targetMetric: "page_key_events",
      });
    }
  }

  // ─── 6. DEVICE RULES ───
  let mobileSessions = 0;
  let desktopSessions = 0;
  let mobileEvents = 0;
  let desktopEvents = 0;

  for (const d of audience.devices) {
    const category = d.device.toLowerCase();
    if (category.includes("mobile")) {
      mobileSessions += d.sessions;
      mobileEvents += d.keyEvents;
    } else if (category.includes("desktop")) {
      desktopSessions += d.sessions;
      desktopEvents += d.keyEvents;
    }
  }

  const totalDeviceSessions = mobileSessions + desktopSessions || 1;
  const mobileShare = mobileSessions / totalDeviceSessions;
  const mobileConvRate = mobileSessions > 0 ? mobileEvents / mobileSessions : 0;
  const desktopConvRate = desktopSessions > 0 ? desktopEvents / desktopSessions : 0;

  if (
    mobileShare > ANALYTICS_THRESHOLDS.DEVICES.MOBILE_SHARE_MIN &&
    desktopConvRate > 0 &&
    mobileConvRate < desktopConvRate * ANALYTICS_THRESHOLDS.DEVICES.MOBILE_CONVERSION_DEFICIT_RATIO
  ) {
    findings.push({
      id: "device-mobile-deficit",
      fingerprint: "devices:mobile-deficit:all",
      category: "devices",
      severity: "high",
      title: "Rendimiento Inferior en Dispositivos Móviles",
      description: `Hecho: El tráfico móvil representa el ${formatPercentRate(mobileShare)} de las sesiones pero convierte a una tasa del ${formatPercentRate(mobileConvRate)} vs ${formatPercentRate(desktopConvRate)} en Desktop. Hipótesis: Formularios complejos, elementos de UI fuera de pantalla o velocidad de carga lenta en móviles.`,
      evidence: `Móvil CR: ${formatPercentRate(mobileConvRate)}, Desktop CR: ${formatPercentRate(desktopConvRate)}.`,
      currentValue: Number((mobileConvRate * 100).toFixed(2)),
      previousValue: Number((desktopConvRate * 100).toFixed(2)),
      percentageChange: Number((((mobileConvRate - desktopConvRate) / desktopConvRate) * 100).toFixed(2)),
      affectedEntity: "Experiencia Móvil",
      proposedAction: "Optimizar la velocidad de carga en teléfonos inteligentes, simplificar formularios y adaptar los botones CTA al pulgar.",
      targetMetric: "mobile_conversion_rate",
    });
  }

  // ─── 7. HEALTH SCORE CALCULATOR ───
  let trafficScore = 20;
  if (trafficPercent <= -30) trafficScore = 0;
  else if (trafficPercent <= -15) trafficScore = 8;
  else if (trafficPercent <= -8) trafficScore = 14;

  let engagementScore = 20;
  if (avgEngagementRate < 0.3) engagementScore = 6;
  else if (avgEngagementRate < 0.5) engagementScore = 14;

  let conversionScore = 25;
  if (totalKeyEvents === 0) conversionScore = 0;
  else if (eventsChange <= -25) conversionScore = 8;
  else if (kpisConversionRate(overview) < 0.01) conversionScore = 12;

  let campaignQualityScore = 20;
  if (unassignedRatio > 0.05) campaignQualityScore -= 5;
  if (directRatio > 0.4) campaignQualityScore -= 5;
  campaignQualityScore = Math.max(0, campaignQualityScore);

  let measurementScore = 15;
  if (notSetRatio > 0.05) measurementScore -= 7;
  measurementScore = Math.max(0, measurementScore);

  const totalScore = Math.min(100, Math.max(0, trafficScore + engagementScore + conversionScore + campaignQualityScore + measurementScore));
  let healthStatus: "Saludable" | "Requiere atención" | "Crítico" = "Saludable";
  let healthColor = "#22c55e";

  if (totalScore < 60) {
    healthStatus = "Crítico";
    healthColor = "#ef4444";
  } else if (totalScore < 80) {
    healthStatus = "Requiere atención";
    healthColor = "#f59e0b";
  }

  const healthBreakdown: HealthScoreBreakdown = {
    trafficScore,
    engagementScore,
    conversionScore,
    campaignQualityScore,
    measurementScore,
    totalScore,
    status: healthStatus,
    color: healthColor,
  };

  // ─── 8. CAMPAIGN CLASSIFICATION ───
  const avgSiteConvRate = kpisConversionRate(overview);
  const campaignClassifications: CampaignClassification[] = acquisition.sourceMediums.map((sm) => {
    const convRate = sm.sessions > 0 ? sm.keyEvents / sm.sessions : 0;
    const hasNotSet = sm.source.includes("(not set)") || sm.medium.includes("(not set)");

    let classification: "CONTINUAR" | "OPTIMIZAR" | "VIGILAR" | "REVISAR/DETENER" = "VIGILAR";
    let recommendationText = "Revisar evolución en los próximos días.";

    if (sm.sessions >= 30 && sm.keyEvents > 0 && convRate >= avgSiteConvRate) {
      classification = "CONTINUAR";
      recommendationText = "Mantener inversión y escalar gradualmente el presupuesto.";
    } else if (sm.sessions >= 30 && sm.keyEvents > 0 && convRate < avgSiteConvRate) {
      classification = "OPTIMIZAR";
      recommendationText = "Optimizar la oferta y la landing page para elevar la tasa de conversión al promedio del sitio.";
    } else if (sm.sessions >= 30 && sm.keyEvents === 0) {
      classification = "REVISAR/DETENER";
      recommendationText = "Detener o revisar profundamente la audiencia y el etiquetado UTM (cero conversiones registradas).";
    } else {
      classification = "VIGILAR";
      recommendationText = "Monitorear hasta acumular al menos 30 sesiones significativas.";
    }

    return {
      campaignName: sm.source,
      channel: sm.channel,
      source: sm.source,
      medium: sm.medium,
      users: sm.users,
      sessions: sm.sessions,
      engagedSessions: 0,
      engagementRate: 0,
      keyEvents: sm.keyEvents,
      conversionRate: convRate,
      revenue: sm.revenue,
      classification,
      recommendationText,
      hasErrors: hasNotSet,
      errorDetails: hasNotSet ? ["Etiqueta (not set) detectada en fuente/medio"] : undefined,
    };
  });

  // ─── 9. PERSISTENCE TO SUPABASE ───
  const persistenceStats = await persistDiagnosticsToSupabase(findings, period);

  return {
    period,
    healthBreakdown,
    findings,
    campaignClassifications,
    overview,
    persistenceStats,
  };
}

function kpisConversionRate(overview: { kpis: { sessionKeyEventRate: { value: number } } }): number {
  return overview.kpis.sessionKeyEventRate.value || 0.01;
}

/**
 * Persists diagnostic findings to Supabase `public.alerts`, `public.recommendations`, `public.tasks`.
 */
async function persistDiagnosticsToSupabase(
  findings: DiagnosticFinding[],
  period: PeriodKey
): Promise<PersistenceStats> {
  const stats: PersistenceStats = {
    findingsGenerated: findings.length,
    alertsAttempted: 0,
    alertsCreated: 0,
    alertsUpdated: 0,
    alertsFailed: 0,
    recommendationsCreated: 0,
    tasksCreated: 0,
  };

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    console.error("[Supabase Error] Server client is null.");
    stats.alertsFailed = findings.length;
    return stats;
  }

  // 1. Fetch company_id for property "502218884"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: company, error: companyError } = await (supabase as any)
    .from("companies")
    .select("id")
    .eq("ga4_property_id", "502218884")
    .maybeSingle();

  if (companyError || !company?.id) {
    console.error("[Supabase Company Lookup Error]", {
      code: companyError?.code || "COMPANY_NOT_FOUND",
      message: companyError?.message || "No company found for property 502218884",
    });
    stats.alertsFailed = findings.length;
    return stats;
  }

  const companyId: string = company.id;
  const alertDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  for (const finding of findings) {
    stats.alertsAttempted++;

    const ruleId = finding.id;
    const affectedEntity = finding.affectedEntity || "Sitio Web Completo";
    const category = finding.category;

    const signature = `${ruleId}:${affectedEntity}:${category}`;

    const evidenceJson = {
      ruleId,
      affectedEntity,
      currentValue: finding.currentValue ?? null,
      previousValue: finding.previousValue ?? null,
      percentageChange: finding.percentageChange ?? null,
      proposedAction: finding.proposedAction || "",
      targetMetric: finding.targetMetric || "",
      period,
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingAlert, error: selectErr } = await (supabase as any)
        .from("alerts")
        .select("id")
        .eq("company_id", companyId)
        .eq("signature", signature)
        .in("status", ["open", "reviewing"])
        .maybeSingle();

      if (selectErr) {
        console.error("[Supabase Select Alert Error]", {
          code: selectErr.code,
          message: selectErr.message,
        });
      }

      let alertId = existingAlert?.id;

      if (alertId) {
        // UPDATE existing active alert
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: updateErr } = await (supabase as any)
          .from("alerts")
          .update({
            alert_date: alertDate,
            severity: finding.severity,
            title: finding.title,
            description: finding.description,
            evidence: evidenceJson,
          })
          .eq("id", alertId);

        if (updateErr) {
          console.error("[Supabase Update Alert Error]", {
            code: updateErr.code,
            message: updateErr.message,
          });
          stats.alertsFailed++;
        } else {
          stats.alertsUpdated++;
        }
      } else {
        // INSERT new alert
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newAlert, error: insertErr } = await (supabase as any)
          .from("alerts")
          .insert({
            company_id: companyId,
            alert_date: alertDate,
            category: finding.category,
            severity: finding.severity,
            title: finding.title,
            description: finding.description,
            evidence: evidenceJson,
            signature: signature,
            status: "open",
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (insertErr || !newAlert?.id) {
          console.error("[Supabase Insert Alert Error]", {
            code: insertErr?.code || "INSERT_FAILED",
            message: insertErr?.message || "Failed inserting alert record",
          });
          stats.alertsFailed++;
        } else {
          alertId = newAlert.id;
          stats.alertsCreated++;
        }
      }

      // If alert was created/updated, handle Recommendation & Task
      if (alertId) {
        if (finding.severity !== "info") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: recData, error: recErr } = await (supabase as any)
            .from("recommendations")
            .insert({
              alert_id: alertId,
              title: finding.title,
              problem: finding.description,
              evidence: finding.evidence,
              proposed_action: finding.proposedAction,
              expected_impact: "Mejora en rendimiento y optimización de conversión",
              priority: finding.severity === "critical" || finding.severity === "high" ? finding.severity : "medium",
              target_metric: finding.targetMetric,
              status: "pending",
              created_at: new Date().toISOString(),
            })
            .select("id")
            .maybeSingle();

          if (!recErr && recData?.id) {
            stats.recommendationsCreated++;

            if (finding.severity === "high" || finding.severity === "critical") {
              let dueDays = 3;
              if (finding.severity === "critical") dueDays = 1;

              const dueDateObj = new Date();
              dueDateObj.setUTCDate(dueDateObj.getUTCDate() + dueDays);

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const { error: taskErr } = await (supabase as any)
                .from("tasks")
                .insert({
                  recommendation_id: recData.id,
                  title: `[Prioridad ${finding.severity.toUpperCase()}] ${finding.title}`,
                  description: finding.proposedAction,
                  category: finding.category,
                  status: "pending",
                  priority: finding.severity,
                  due_date: dueDateObj.toISOString(),
                  target_metric: finding.targetMetric,
                  tags: [finding.category, "auto-generated"],
                  created_at: new Date().toISOString(),
                });

              if (!taskErr) {
                stats.tasksCreated++;
              } else {
                console.error("[Supabase Task Insert Error]", { code: taskErr.code, message: taskErr.message });
              }
            }
          } else if (recErr) {
            console.error("[Supabase Recommendation Insert Error]", { code: recErr.code, message: recErr.message });
          }
        }
      }
    } catch (err: unknown) {
      stats.alertsFailed++;
      const message = err instanceof Error ? err.message : "Error inesperado al procesar alerta";
      console.error("[Supabase Process Alert Exception]", { message });
    }
  }

  // Safe summary log (NO tokens, NO secrets)
  console.log("[Diagnostic Engine Persistence Summary]", {
    findingsGenerated: stats.findingsGenerated,
    alertsAttempted: stats.alertsAttempted,
    alertsCreated: stats.alertsCreated,
    alertsUpdated: stats.alertsUpdated,
    alertsFailed: stats.alertsFailed,
    recommendationsCreated: stats.recommendationsCreated,
    tasksCreated: stats.tasksCreated,
  });

  return stats;
}
