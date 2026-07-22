"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Users,
  UserPlus,
  Activity,
  Zap,
  Clock,
  Target,
  Minus,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Database,
  Flame,
  Award,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface KPIData {
  key: string;
  label: string;
  value: number;
  prevValue: number;
  change: number;
  percentChange: number;
  trend: "up" | "down" | "neutral";
  isCurrency?: boolean;
  isPercent?: boolean;
  isSeconds?: boolean;
}

interface OverviewResponse {
  success: boolean;
  period: string;
  ranges: {
    current: { startDate: string; endDate: string };
    previous: { startDate: string; endDate: string };
  };
  kpis: Record<string, KPIData>;
  dailyTrends: {
    date: string;
    activeUsers: number;
    sessions: number;
    keyEvents: number;
    engagementRate: number;
    revenue: number;
  }[];
  healthScore: {
    trafficScore: number;
    engagementScore: number;
    conversionScore: number;
    campaignQualityScore: number;
    measurementScore: number;
    totalScore: number;
    status: "Saludable" | "Requiere atención" | "Crítico";
    color: string;
  };
  findings: {
    id: string;
    category: string;
    severity: "info" | "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    evidence: string;
    proposedAction: string;
  }[];
}

function KPICard({ kpi, icon: Icon }: { kpi: KPIData; icon: React.ElementType }) {
  const isPositiveTrend = kpi.trend === "up";
  const isNegativeTrend = kpi.trend === "down";

  let displayVal = kpi.value.toLocaleString("es-ES");
  let displayPrev = kpi.prevValue.toLocaleString("es-ES");

  if (kpi.isCurrency) {
    displayVal = `$${kpi.value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    displayPrev = `$${kpi.prevValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  } else if (kpi.isPercent) {
    displayVal = `${(kpi.value * 100).toFixed(1)}%`;
    displayPrev = `${(kpi.prevValue * 100).toFixed(1)}%`;
  } else if (kpi.isSeconds) {
    const mins = Math.floor(kpi.value / 60);
    const secs = Math.round(kpi.value % 60);
    displayVal = `${mins}m ${secs}s`;
  }

  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        padding: "1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>{kpi.label}</span>
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "8px",
            background: "rgba(30, 155, 215, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={16} color="#1e9bd7" />
        </div>
      </div>

      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#f1f5f9" }}>{displayVal}</div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem", fontSize: "0.75rem" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.2rem",
            fontWeight: 700,
            color: isPositiveTrend ? "#22c55e" : isNegativeTrend ? "#ef4444" : "#94a3b8",
            background: isPositiveTrend
              ? "rgba(34, 197, 94, 0.1)"
              : isNegativeTrend
              ? "rgba(239, 68, 68, 0.1)"
              : "rgba(148, 163, 184, 0.1)",
            padding: "0.15rem 0.5rem",
            borderRadius: "4px",
          }}
        >
          {isPositiveTrend && <ArrowUpRight size={14} />}
          {isNegativeTrend && <ArrowDownRight size={14} />}
          {!isPositiveTrend && !isNegativeTrend && <Minus size={14} />}
          {Math.abs(kpi.percentChange)}%
        </div>
        <span style={{ color: "#475569" }}>vs {displayPrev} anterior</span>
      </div>
    </div>
  );
}

function OverviewContent() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/overview?period=${period}`);
        const json = await res.json();
        if (isMounted) {
          if (!res.ok || !json.success) {
            setError(json.message || "Error al cargar datos desde Supabase");
          } else {
            setData(json);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error de red al consultar el resumen");
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

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "1rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Consultando Supabase...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={Database}
        title="No se pudieron cargar los datos"
        description={error || "Asegúrate de haber ejecutado la sincronización o carga histórica."}
        variant="default"
      />
    );
  }

  const { kpis, dailyTrends, healthScore, findings, ranges } = data;

  const strengths = findings.filter((f) => f.severity === "info");
  const criticals = findings.filter((f) => f.severity === "critical" || f.severity === "high");
  const opportunities = findings.filter((f) => f.severity === "medium" || f.severity === "low");

  return (
    <>
      <SectionHeader
        title="Resumen Analítico"
        description={`Métricas consolidadas desde Supabase (${ranges.current.startDate} a ${ranges.current.endDate} vs periodo anterior ${ranges.previous.startDate} a ${ranges.previous.endDate})`}
      />

      {/* Health Score Summary Banner */}
      <div
        style={{
          background: "var(--bg-card)",
          border: `1px solid ${healthScore.color}40`,
          borderRadius: "12px",
          padding: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              border: `4px solid ${healthScore.color}`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(15, 23, 42, 0.8)",
            }}
          >
            <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#f1f5f9", lineHeight: 1 }}>
              {healthScore.totalScore}
            </span>
            <span style={{ fontSize: "0.6rem", color: "#64748b", textTransform: "uppercase" }}>/ 100</span>
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                Health Score del Sitio: {healthScore.status}
              </h2>
            </div>
            <p style={{ fontSize: "0.825rem", color: "#94a3b8", margin: "0.35rem 0 0", lineHeight: 1.5 }}>
              Evaluación determinística basada en tráfico, engagement, tasa de conversión, atribución de campañas y etiquetado UTM.
            </p>
          </div>
        </div>

        {/* Score Breakdown Grid */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", fontSize: "0.78rem" }}>
          <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <div style={{ color: "#64748b" }}>Tráfico</div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, marginTop: "0.2rem" }}>{healthScore.trafficScore} / 20</div>
          </div>
          <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <div style={{ color: "#64748b" }}>Engagement</div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, marginTop: "0.2rem" }}>{healthScore.engagementScore} / 20</div>
          </div>
          <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <div style={{ color: "#64748b" }}>Conversión</div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, marginTop: "0.2rem" }}>{healthScore.conversionScore} / 25</div>
          </div>
          <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <div style={{ color: "#64748b" }}>Campañas</div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, marginTop: "0.2rem" }}>{healthScore.campaignQualityScore} / 20</div>
          </div>
          <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.5rem 0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
            <div style={{ color: "#64748b" }}>Medición</div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, marginTop: "0.2rem" }}>{healthScore.measurementScore} / 15</div>
          </div>
        </div>
      </div>

      {/* 9 Primary KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
        <KPICard kpi={kpis.activeUsers} icon={Users} />
        <KPICard kpi={kpis.newUsers} icon={UserPlus} />
        <KPICard kpi={kpis.sessions} icon={Activity} />
        <KPICard kpi={kpis.engagedSessions} icon={Flame} />
        <KPICard kpi={kpis.engagementRate} icon={Zap} />
        <KPICard kpi={kpis.averageSessionDuration} icon={Clock} />
        <KPICard kpi={kpis.keyEvents} icon={Target} />
        <KPICard kpi={kpis.sessionKeyEventRate} icon={Award} />
        <KPICard kpi={kpis.totalRevenue} icon={DollarSign} />
      </div>

      {/* Daily Trends Interactive Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))", gap: "1.25rem" }}>
        {/* Sessions & Users Area Chart */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Evolución Diaria de Tráfico</h3>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0" }}>Sesiones y usuarios activos por día</p>
          </div>
          <div style={{ height: "260px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyTrends}>
                <defs>
                  <linearGradient id="sessionsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e9bd7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#1e9bd7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                <Area type="monotone" dataKey="sessions" stroke="#1e9bd7" strokeWidth={2} fillOpacity={1} fill="url(#sessionsGrad)" name="Sesiones" />
                <Area type="monotone" dataKey="activeUsers" stroke="#38bdf8" strokeWidth={1.5} fillOpacity={0} name="Usuarios Activos" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Key Events Bar Chart */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Evolución de Key Events</h3>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0" }}>Conversiones diarias acumuladas</p>
          </div>
          <div style={{ height: "260px", width: "100%" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
                <Bar dataKey="keyEvents" fill="#22c55e" radius={[4, 4, 0, 0]} name="Key Events" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Deterministic Diagnostic Findings Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
        {/* Critical & High Issues */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={18} color="#ef4444" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
              Problemas Principales ({criticals.length})
            </h3>
          </div>
          {criticals.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>No se detectaron problemas severos en este período.</div>
          ) : (
            criticals.map((f) => (
              <div key={f.id} style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "8px", padding: "0.875rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#ef4444" }}>{f.title}</div>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.25rem", lineHeight: 1.5 }}>{f.description}</div>
                <div style={{ fontSize: "0.75rem", color: "#1e9bd7", marginTop: "0.5rem", fontWeight: 600 }}>Acción: {f.proposedAction}</div>
              </div>
            ))
          )}
        </div>

        {/* Opportunities & Medium Findings */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <HelpCircle size={18} color="#f59e0b" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
              Oportunidades de Mejora ({opportunities.length})
            </h3>
          </div>
          {opportunities.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>No hay alertas moderadas registradas.</div>
          ) : (
            opportunities.map((f) => (
              <div key={f.id} style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "8px", padding: "0.875rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b" }}>{f.title}</div>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.25rem", lineHeight: 1.5 }}>{f.description}</div>
                <div style={{ fontSize: "0.75rem", color: "#1e9bd7", marginTop: "0.5rem", fontWeight: 600 }}>Acción: {f.proposedAction}</div>
              </div>
            ))
          )}
        </div>

        {/* Strengths & Growth Findings */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle2 size={18} color="#22c55e" />
            <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
              Fortalezas Principales ({strengths.length})
            </h3>
          </div>
          {strengths.length === 0 ? (
            <div style={{ fontSize: "0.8rem", color: "#64748b", fontStyle: "italic" }}>Métricas estables en el periodo seleccionado.</div>
          ) : (
            strengths.map((f) => (
              <div key={f.id} style={{ background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: "8px", padding: "0.875rem" }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#22c55e" }}>{f.title}</div>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.25rem", lineHeight: 1.5 }}>{f.description}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

export default function OverviewPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
      </div>
    }>
      <OverviewContent />
    </Suspense>
  );
}
