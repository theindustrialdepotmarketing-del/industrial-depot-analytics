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
import type { Alert, Recommendation, Task } from "@/lib/types/database";

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

  // ─── 1. TRAFFIC RULES ───
  const trafficPercent = overview.kpis.sessions.percentChange;
  const trafficSessions = overview.kpis.sessions.value;

  if (trafficPercent <= ANALYTICS_THRESHOLDS.TRAFFIC.CRITICAL_DROP) {
    findings.push({
      id: "traffic-critical-drop",
      fingerprint: "traffic:critical-drop:all",
      category: "traffic",
      severity: "critical",
      title: "Caída Crítica de Tráfico Total",
      description: `El volumen de sesiones ha caído un ${Math.abs(trafficPercent)}% respecto al periodo anterior (${overview.kpis.sessions.prevValue.toLocaleString()} -> ${trafficSessions.toLocaleString()}).`,
      evidence: `Sesiones periodo actual: ${trafficSessions.toLocaleString()}, periodo previo: ${overview.kpis.sessions.prevValue.toLocaleString()} (${trafficPercent}%).`,
      currentValue: trafficSessions,
      previousValue: overview.kpis.sessions.prevValue,
      percentageChange: trafficPercent,
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
      description: `Las sesiones disminuyeron un ${Math.abs(trafficPercent)}% respecto al periodo anterior.`,
      evidence: `Variación de sesiones: ${trafficPercent}%.`,
      currentValue: trafficSessions,
      previousValue: overview.kpis.sessions.prevValue,
      percentageChange: trafficPercent,
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
      description: `Se observa un descenso del ${Math.abs(trafficPercent)}% en las sesiones globales.`,
      evidence: `Sesiones: ${trafficSessions.toLocaleString()} vs ${overview.kpis.sessions.prevValue.toLocaleString()} anteriores.`,
      currentValue: trafficSessions,
      previousValue: overview.kpis.sessions.prevValue,
      percentageChange: trafficPercent,
      affectedEntity: "Sitio Web Completo",
      proposedAction: "Monitorear palabras clave orgánicas y campañas pagadas en los próximos días.",
      targetMetric: "sessions",
    });
  } else if (trafficPercent >= ANALYTICS_THRESHOLDS.TRAFFIC.SIGNIFICANT_GROWTH) {
    findings.push({
      id: "traffic-growth",
      fingerprint: "traffic:growth:all",
      category: "traffic",
      severity: "info",
      title: "Crecimiento Significativo de Tráfico",
      description: `Las sesiones se incrementaron un +${trafficPercent}% respecto al periodo anterior.`,
      evidence: `Incremento de +${(trafficSessions - overview.kpis.sessions.prevValue).toLocaleString()} sesiones.`,
      currentValue: trafficSessions,
      previousValue: overview.kpis.sessions.prevValue,
      percentageChange: trafficPercent,
      affectedEntity: "Sitio Web Completo",
      proposedAction: "Capitalizar el incremento de usuarios optimizando los embudos de conversión.",
      targetMetric: "sessions",
    });
  }

  // ─── 2. ENGAGEMENT RULES ───
  const avgEngagementRate = overview.kpis.engagementRate.value;
  const prevEngagementRate = overview.kpis.engagementRate.prevValue;
  const engagementChange = overview.kpis.engagementRate.percentChange;

  if (engagementChange < ANALYTICS_THRESHOLDS.ENGAGEMENT.DROP_THRESHOLD) {
    findings.push({
      id: "engagement-drop",
      fingerprint: "engagement:drop:all",
      category: "engagement",
      severity: "medium",
      title: "Deterioro en la Tasa de Engagement",
      description: `La tasa de engagement disminuyó un ${Math.abs(engagementChange)}% respecto al periodo anterior (${(prevEngagementRate * 100).toFixed(1)}% -> ${(avgEngagementRate * 100).toFixed(1)}%).`,
      evidence: `Engagement actual: ${(avgEngagementRate * 100).toFixed(1)}%, previo: ${(prevEngagementRate * 100).toFixed(1)}%.`,
      currentValue: avgEngagementRate,
      previousValue: prevEngagementRate,
      percentageChange: engagementChange,
      affectedEntity: "Experiencia de Usuario",
      proposedAction: "Revisar tiempo de carga de páginas de destino y relevancia del contenido para los usuarios entrantes.",
      targetMetric: "engagement_rate",
    });
  }

  // ─── 3. CONVERSION RULES ───
  const totalKeyEvents = overview.kpis.keyEvents.value;
  const prevKeyEvents = overview.kpis.keyEvents.prevValue;
  const eventsChange = overview.kpis.keyEvents.percentChange;

  if (trafficSessions >= ANALYTICS_THRESHOLDS.CONVERSIONS.MIN_SESSIONS_ZERO_EVENTS && totalKeyEvents === 0) {
    findings.push({
      id: "conversions-zero",
      fingerprint: "conversions:zero:all",
      category: "conversions",
      severity: "critical",
      title: "Cero Conversiones Registradas",
      description: `Se han registrado ${trafficSessions.toLocaleString()} sesiones en el periodo pero 0 key events (conversiones).`,
      evidence: `Sesiones: ${trafficSessions}, Key Events: 0.`,
      currentValue: 0,
      previousValue: prevKeyEvents,
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
      description: `Los Key Events sufrieron una caída del ${Math.abs(eventsChange)}% (${prevKeyEvents} -> ${totalKeyEvents}).`,
      evidence: `Key events actual: ${totalKeyEvents}, previo: ${prevKeyEvents}.`,
      currentValue: totalKeyEvents,
      previousValue: prevKeyEvents,
      percentageChange: eventsChange,
      affectedEntity: "Embudo de Conversión",
      proposedAction: "Verificar formularios de contacto, checkout y botones de llamadas a la acción principales.",
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
      description: `Las sesiones aumentaron un +${trafficPercent}% pero los Key Events cayeron un ${Math.abs(eventsChange)}%.`,
      evidence: `Tráfico: +${trafficPercent}%, Conversiones: ${eventsChange}%.`,
      affectedEntity: "Calidad de Tráfico",
      proposedAction: "Revisar si las fuentes de nuevo tráfico atraen usuarios sin intención comercial real.",
      targetMetric: "session_key_event_rate",
    });
  }

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
    findings.push({
      id: "attribution-excessive-direct",
      fingerprint: "attribution:excessive-direct:all",
      category: "attribution",
      severity: "high",
      title: "Tráfico Direct Excesivo",
      description: `El canal Direct representa el ${(directRatio * 100).toFixed(1)}% del tráfico total (límite recomendado: 40%).`,
      evidence: `Sesiones Direct: ${directSessions.toLocaleString()} de ${totalSessionsAcquisition.toLocaleString()} totales (${(directRatio * 100).toFixed(1)}%).`,
      currentValue: directRatio,
      affectedEntity: "Atribución de Canales",
      proposedAction: "Implementar parámetros UTM estrictos en campañas de email marketing, PDF interactivos y enlaces externos.",
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
      description: `El ${(unassignedRatio * 100).toFixed(1)}% del tráfico no está categorizado en ningún canal reconocido por GA4.`,
      evidence: `Sesiones Unassigned: ${unassignedSessions.toLocaleString()} (${(unassignedRatio * 100).toFixed(1)}%).`,
      currentValue: unassignedRatio,
      affectedEntity: "Reglas de Grupo de Canales GA4",
      proposedAction: "Estandarizar utm_source y utm_medium de acuerdo a las convenciones de nomenclatura de GA4.",
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
      description: `El ${(notSetRatio * 100).toFixed(1)}% del tráfico registra parámetros de atribución sin definir.`,
      evidence: `Sesiones (not set): ${notSetSessions.toLocaleString()}.`,
      currentValue: notSetRatio,
      affectedEntity: "Etiquetado de Campañas",
      proposedAction: "Auditar enlaces de anuncios pagados y publicaciones en redes sociales para asegurar que incluyan UTMs válidas.",
      targetMetric: "not_set_ratio",
    });
  }

  // ─── 5. PAGE & LANDING RULES ───
  for (const page of pagesData.pages) {
    if (page.sessions >= ANALYTICS_THRESHOLDS.PAGES.MIN_SESSIONS_ZERO_EVENTS && page.keyEvents === 0) {
      findings.push({
        id: `page-zero-events-${page.landingPage}`,
        fingerprint: `pages:zero-events:${page.landingPage}`,
        category: "pages",
        severity: "high",
        title: `Página con Alto Tráfico y Cero Conversiones`,
        description: `La página '${page.landingPage}' acumula ${page.sessions.toLocaleString()} sesiones sin registrar ningún Key Event.`,
        evidence: `Página: ${page.landingPage}, Sesiones: ${page.sessions}, Conversiones: 0.`,
        currentValue: page.sessions,
        affectedEntity: page.landingPage,
        proposedAction: "Añadir llamadas a la acción (CTA) visibles y formularios de captura rápida en esta página.",
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

  if (mobileShare > ANALYTICS_THRESHOLDS.DEVICES.MOBILE_SHARE_MIN && desktopConvRate > 0 && mobileConvRate < desktopConvRate * ANALYTICS_THRESHOLDS.DEVICES.MOBILE_CONVERSION_DEFICIT_RATIO) {
    findings.push({
      id: "device-mobile-deficit",
      fingerprint: "devices:mobile-deficit:all",
      category: "devices",
      severity: "high",
      title: "Rendimiento Inferior en Dispositivos Móviles",
      description: `El tráfico móvil representa el ${(mobileShare * 100).toFixed(1)}% de las sesiones pero convierte a una tasa ${(mobileConvRate * 100).toFixed(2)}% vs ${(desktopConvRate * 100).toFixed(2)}% en Desktop.`,
      evidence: `Móvil CR: ${(mobileConvRate * 100).toFixed(2)}%, Desktop CR: ${(desktopConvRate * 100).toFixed(2)}%.`,
      currentValue: mobileConvRate,
      previousValue: desktopConvRate,
      affectedEntity: "Experiencia Móvil",
      proposedAction: "Optimizar la velocidad de carga en teléfonos y simplificar los formularios móviles.",
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
  await persistDiagnosticsToSupabase(findings);

  return {
    period,
    healthBreakdown,
    findings,
    campaignClassifications,
    overview,
  };
}

function kpisConversionRate(overview: { kpis: { sessionKeyEventRate: { value: number } } }): number {
  return overview.kpis.sessionKeyEventRate.value || 0.01;
}

/**
 * Persists diagnostic findings to Supabase (alerts, recommendations, tasks).
 * Idempotent via fingerprint deduplication.
 */
async function persistDiagnosticsToSupabase(findings: DiagnosticFinding[]) {
  const supabase = getSupabaseServerClient();
  if (!supabase) return;

  for (const finding of findings) {
    if (finding.severity === "info" || finding.severity === "low") continue;

    try {
      // 1. Check if alert with same fingerprint exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingAlert } = await (supabase as any)
        .from("alerts")
        .select("id")
        .eq("fingerprint", finding.fingerprint)
        .eq("is_resolved", false)
        .maybeSingle();

      let alertId = existingAlert?.id;

      if (!alertId) {
        // Insert new Alert
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newAlert } = await (supabase as any)
          .from("alerts")
          .insert({
            fingerprint: finding.fingerprint,
            category: finding.category,
            title: finding.title,
            description: finding.description,
            severity: finding.severity,
            metric: finding.targetMetric,
            current_value: finding.currentValue,
            previous_value: finding.previousValue,
            percentage_change: finding.percentageChange,
            affected_entity: finding.affectedEntity,
            proposed_action: finding.proposedAction,
            is_read: false,
            is_resolved: false,
            created_at: new Date().toISOString(),
          } as unknown as Partial<Alert>)
          .select("id")
          .single();

        alertId = newAlert?.id;
      }

      if (alertId) {
        // Insert or update Recommendation
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: recData } = await (supabase as any)
          .from("recommendations")
          .insert({
            alert_id: alertId,
            title: finding.title,
            problem: finding.description,
            evidence: finding.evidence,
            proposed_action: finding.proposedAction,
            expected_impact: "Mejora en rendimiento y recuperación de conversión",
            priority: finding.severity,
            target_metric: finding.targetMetric,
            status: "pending",
          } as unknown as Partial<Recommendation>)
          .select("id")
          .maybeSingle();

        const recId = recData?.id;

        // Auto-create Task for HIGH or CRITICAL severity
        if (finding.severity === "high" || finding.severity === "critical") {
          let dueDays = 3;
          if (finding.severity === "critical") dueDays = 1;

          const dueDateObj = new Date();
          dueDateObj.setUTCDate(dueDateObj.getUTCDate() + dueDays);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (supabase as any)
            .from("tasks")
            .insert({
              recommendation_id: recId,
              title: `[Prioridad ${finding.severity.toUpperCase()}] ${finding.title}`,
              description: finding.proposedAction,
              category: finding.category,
              status: "pending",
              priority: finding.severity,
              due_date: dueDateObj.toISOString(),
              target_metric: finding.targetMetric,
              tags: [finding.category, "auto-generated"],
            } as unknown as Partial<Task>);
        }
      }
    } catch (err) {
      console.error("[Diagnostic Engine Persistence Error]:", err);
    }
  }
}
