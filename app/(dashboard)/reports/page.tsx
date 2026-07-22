"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Printer, Database } from "lucide-react";

interface OverviewData {
  healthScore: {
    totalScore: number;
    status: string;
    color: string;
    trafficScore: number;
    engagementScore: number;
    conversionScore: number;
    campaignQualityScore: number;
    measurementScore: number;
  };
  kpis: Record<string, { label: string; value: number; percentChange: number; isCurrency?: boolean; isPercent?: boolean }>;
  findings: { title: string; description: string; severity: string; proposedAction: string }[];
}

interface CampaignsData {
  campaigns: { campaignName: string; classification: string; recommendationText: string; sessions: number; keyEvents: number }[];
}

function ReportsContent() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const [resOverview, resCamp] = await Promise.all([
          fetch(`/api/analytics/overview?period=${period}`),
          fetch(`/api/analytics/campaigns?period=${period}`),
        ]);

        const jsonOverview = await resOverview.json();
        const jsonCamp = await resCamp.json();

        if (isMounted) {
          if (resOverview.ok && jsonOverview.success) setOverview(jsonOverview);
          if (resCamp.ok && jsonCamp.success) setCampaigns(jsonCamp);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error de red al generar reporte");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [period]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "1rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Generando reporte ejecutivo determinístico desde Supabase...</span>
      </div>
    );
  }

  if (error || !overview) {
    return (
      <EmptyState
        icon={Database}
        title="Sin datos para el reporte"
        description={error || "Verifica la sincronización de GA4 hacia Supabase."}
        variant="default"
      />
    );
  }

  const { healthScore, kpis, findings } = overview;
  const cList = campaigns?.campaigns || [];

  const continueList = cList.filter((c) => c.classification === "CONTINUAR");
  const optimizeList = cList.filter((c) => c.classification === "OPTIMIZAR");
  const reviewList = cList.filter((c) => c.classification === "REVISAR/DETENER");

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <SectionHeader
          title="Reporte Ejecutivo Determinístico"
          description={`Informe de rendimiento de marketing digital para Industrial Depot Analytics (Período: ${period})`}
        />
        <button
          onClick={handlePrint}
          className="btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
        >
          <Printer size={16} /> Imprimir / Exportar PDF
        </button>
      </div>

      {/* Report Paper Container */}
      <div
        id="executive-report"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
        }}
      >
        {/* Header Block */}
        <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>The Industrial Depot — Marketing Performance</h2>
            <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>
              Fuente de datos: Supabase | Fecha de emisión: {new Date().toLocaleDateString("es-ES")} | Zona Horaria: America/New_York
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b", textTransform: "uppercase" }}>Health Score</div>
            <div style={{ fontSize: "1.75rem", fontWeight: 800, color: healthScore.color }}>{healthScore.totalScore} / 100</div>
          </div>
        </div>

        {/* Executive Summary Narrative */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e9bd7", marginBottom: "0.5rem" }}>1. Resumen Ejecutivo</h3>
          <p style={{ fontSize: "0.85rem", color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>
            Durante el período evaluado ({period}), el sitio web registró <strong>{kpis.sessions?.value.toLocaleString()} sesiones</strong> y <strong>{kpis.activeUsers?.value.toLocaleString()} usuarios activos</strong>, acumulando un total de <strong>{kpis.keyEvents?.value.toLocaleString()} Key Events (conversiones)</strong> a una tasa de conversión promedio del <strong>{(kpis.sessionKeyEventRate?.value * 100).toFixed(2)}%</strong>. El estado de salud general del sitio se clasifica como <strong>{healthScore.status}</strong> ({healthScore.totalScore}/100 puntos).
          </p>
        </div>

        {/* Key Metrics Table */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e9bd7", marginBottom: "0.75rem" }}>2. Indicadores Clave de Rendimiento (KPIs)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.875rem" }}>
            {Object.values(kpis).map((kpi, idx) => (
              <div key={idx} style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-color)", padding: "0.75rem", borderRadius: "8px" }}>
                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{kpi.label}</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", marginTop: "0.2rem" }}>
                  {kpi.isCurrency ? `$${kpi.value.toLocaleString()}` : kpi.isPercent ? `${(kpi.value * 100).toFixed(1)}%` : kpi.value.toLocaleString()}
                </div>
                <div style={{ fontSize: "0.7rem", color: kpi.percentChange >= 0 ? "#22c55e" : "#ef4444", marginTop: "0.2rem", fontWeight: 600 }}>
                  {kpi.percentChange >= 0 ? `+${kpi.percentChange}%` : `${kpi.percentChange}%`} vs anterior
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Findings & Diagnostics */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e9bd7", marginBottom: "0.75rem" }}>3. Hallazgos del Motor de Diagnóstico</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {findings.map((f, idx) => (
              <div key={idx} style={{ background: "rgba(15, 23, 42, 0.4)", border: "1px solid var(--border-color)", padding: "0.85rem", borderRadius: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, color: f.severity === "critical" || f.severity === "high" ? "#ef4444" : f.severity === "medium" ? "#f59e0b" : "#22c55e", fontSize: "0.85rem" }}>
                  <span>[{f.severity.toUpperCase()}]</span> {f.title}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#cbd5e1", marginTop: "0.25rem", lineHeight: 1.5 }}>{f.description}</div>
                <div style={{ fontSize: "0.78rem", color: "#1e9bd7", marginTop: "0.35rem", fontWeight: 600 }}>Acción: {f.proposedAction}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Campaign Action Plan */}
        <div>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#1e9bd7", marginBottom: "0.75rem" }}>4. Plan de Acción para Campañas</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
            <div style={{ background: "rgba(34, 197, 94, 0.06)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ fontWeight: 700, color: "#22c55e", fontSize: "0.85rem" }}>CONTINUAR ({continueList.length})</div>
              <ul style={{ fontSize: "0.78rem", color: "#94a3b8", paddingLeft: "1.2rem", marginTop: "0.5rem", margin: "0.5rem 0 0" }}>
                {continueList.slice(0, 5).map((c, i) => <li key={i}>{c.campaignName} ({c.keyEvents} conversiones)</li>)}
              </ul>
            </div>

            <div style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.85rem" }}>OPTIMIZAR ({optimizeList.length})</div>
              <ul style={{ fontSize: "0.78rem", color: "#94a3b8", paddingLeft: "1.2rem", marginTop: "0.5rem", margin: "0.5rem 0 0" }}>
                {optimizeList.slice(0, 5).map((c, i) => <li key={i}>{c.campaignName} ({c.sessions} sesiones)</li>)}
              </ul>
            </div>

            <div style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: "8px", padding: "1rem" }}>
              <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.85rem" }}>REVISAR / DETENER ({reviewList.length})</div>
              <ul style={{ fontSize: "0.78rem", color: "#94a3b8", paddingLeft: "1.2rem", marginTop: "0.5rem", margin: "0.5rem 0 0" }}>
                {reviewList.slice(0, 5).map((c, i) => <li key={i}>{c.campaignName} (0 conversiones)</li>)}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
      </div>
    }>
      <ReportsContent />
    </Suspense>
  );
}
