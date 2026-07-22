"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Target,
  Award,
  Database,
  Layers,
  Smartphone,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  FileCheck2,
  HelpCircle,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface FunnelStage {
  id: string;
  stageName: string;
  eventName: string;
  status: "detected" | "not_detected" | "no_recent_data";
  isDetected: boolean;
  count: number;
}

interface EcommerceAudit {
  primaryConversion: string;
  funnelStages: FunnelStage[];
  detectedEvents: string[];
  missingEcommerceEvents: string[];
  funnelLimitationNotice: string;
  formClassificationNotice: string;
}

interface ConversionsResponse {
  success: boolean;
  period: string;
  keyEventsKpi: { value: number; prevValue: number; percentChange: number };
  keyEventRateKpi: { value: number; prevValue: number; percentChange: number };
  dailyTrends: { date: string; keyEvents: number }[];
  channels: { channel: string; keyEvents: number; conversionRate: number }[];
  devices: { device: string; keyEvents: number; conversionRate: number }[];
  countries: { country: string; keyEvents: number; conversionRate: number }[];
  ecommerceAudit: EcommerceAudit;
}

function ConversionsContent() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ConversionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/conversions?period=${period}`);
        const json = await res.json();
        if (isMounted) {
          if (!res.ok || !json.success) {
            setError(json.message || "Error consultando conversiones");
          } else {
            setData(json);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error de red al consultar conversiones");
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
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Cargando datos de conversiones y auditoría de embudo desde Supabase...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={Database}
        title="Sin datos de conversiones"
        description={error || "Verifica la sincronización de GA4 hacia Supabase."}
        variant="default"
      />
    );
  }

  const { keyEventsKpi, keyEventRateKpi, dailyTrends, channels, devices, countries, ecommerceAudit } = data;

  return (
    <>
      <SectionHeader
        title="Key Events y Cobertura de Conversiones"
        description="Análisis de conversión principal, auditoría de eventos de GA4 y mapa de cobertura del embudo de e-commerce"
      />

      {/* KPI Cards Header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Conversión Principal (purchase)</span>
            <Target size={18} color="#22c55e" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#22c55e", marginTop: "0.5rem" }}>
            {keyEventsKpi.value.toLocaleString()} <span style={{ fontSize: "0.85rem", color: "#64748b", fontWeight: 400 }}>compras</span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            Variación: <strong style={{ color: keyEventsKpi.percentChange >= 0 ? "#22c55e" : "#ef4444" }}>{keyEventsKpi.percentChange}%</strong> vs periodo anterior ({keyEventsKpi.prevValue})
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Tasa de Conversión a Compra</span>
            <Award size={18} color="#1e9bd7" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#1e9bd7", marginTop: "0.5rem" }}>
            {(keyEventRateKpi.value * 100).toFixed(2)}%
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            Tasa periodo anterior: {(keyEventRateKpi.prevValue * 100).toFixed(2)}%
          </div>
        </div>
      </div>

      {/* 1. SECCIÓN: COBERTURA DEL EMBUDO DE E-COMMERCE (Requisitos 1, 2, 3, 4) */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShoppingBag size={20} color="#1e9bd7" />
            <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
              Cobertura del Embudo de Comercio Electrónico (GA4 Real)
            </h3>
          </div>
          <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 700, background: "rgba(239, 68, 68, 0.1)", padding: "0.25rem 0.6rem", borderRadius: "6px", border: "1px solid rgba(239, 68, 68, 0.3)" }}>
            ⚠️ Embudo Incompleto (1 de 7 etapas activas)
          </span>
        </div>

        {/* Funnel Stage Grid Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          {ecommerceAudit.funnelStages.map((stage) => {
            return (
              <div
                key={stage.id}
                style={{
                  background: stage.isDetected ? "rgba(34, 197, 94, 0.06)" : "rgba(15, 23, 42, 0.6)",
                  border: stage.isDetected ? "1px solid rgba(34, 197, 94, 0.3)" : "1px solid var(--border-color)",
                  borderRadius: "10px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>{stage.eventName}</span>
                  {stage.isDetected ? (
                    <CheckCircle2 size={16} color="#22c55e" />
                  ) : (
                    <XCircle size={16} color="#ef4444" />
                  )}
                </div>

                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: stage.isDetected ? "#f1f5f9" : "#94a3b8" }}>
                  {stage.stageName}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      color: stage.isDetected ? "#22c55e" : "#ef4444",
                      background: stage.isDetected ? "rgba(34, 197, 94, 0.12)" : "rgba(239, 68, 68, 0.12)",
                      padding: "0.15rem 0.45rem",
                      borderRadius: "4px",
                    }}
                  >
                    {stage.isDetected ? "Detectado" : "No detectado"}
                  </span>
                  {stage.isDetected && (
                    <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#22c55e" }}>
                      {stage.count.toLocaleString()} ops
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 2. AVISO DE LIMITACIÓN DE ANÁLISIS DE ABANDONO DE CARRITO (Requisito 8) */}
        <div
          style={{
            marginTop: "1.25rem",
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            borderRadius: "10px",
            padding: "1rem 1.25rem",
            display: "flex",
            gap: "0.85rem",
            alignItems: "flex-start",
          }}
        >
          <AlertTriangle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f59e0b" }}>
              Limitación de Diagnóstico: Análisis de Abandono de Carrito No Disponible
            </div>
            <div style={{ fontSize: "0.8rem", color: "#cbd5e1", marginTop: "0.35rem", lineHeight: 1.5 }}>
              {ecommerceAudit.funnelLimitationNotice} Se ha ajustado la confianza de los diagnósticos sobre el flujo de compra. No se emitirán afirmaciones categóricas sobre abandonos hasta la implementación de los eventos intermedios.
            </div>
          </div>
        </div>
      </div>

      {/* 3. SECCIÓN: CLASIFICACIÓN DE FORMULARIOS (Requisitos 10 y 11) */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <FileCheck2 size={20} color="#1e9bd7" />
          <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Evaluación y Clasificación de Formularios (`form_submit`)
          </h3>
        </div>
        <p style={{ fontSize: "0.825rem", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
          GA4 registra el evento automático <strong>form_submit</strong>. Para mantener la integridad de los informes, este evento <strong>NO se marca automáticamente como Key Event principal</strong> (puesto que puede incluir envíos de contacto general, búsquedas o boletines).
        </p>

        <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
          <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 700, color: "#1e9bd7", fontSize: "0.85rem" }}>
              <HelpCircle size={16} /> Clasificación de Formularios Pendiente
            </div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.35rem", lineHeight: 1.4 }}>
              Se debe mapear cada formulario por URL o ID (ej. Formularios de Cotización vs Contacto General) para definir cuáles deben catalogarse como conversiones secundarias.
            </div>
          </div>

          <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "1rem" }}>
            <div style={{ fontWeight: 700, color: "#22c55e", fontSize: "0.85rem" }}>
              Conversión Principal Configurada: `purchase`
            </div>
            <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginTop: "0.35rem", lineHeight: 1.4 }}>
              Las transacciones de compra verificadas son la única métrica ponderada en el cálculo del ROI y la tasa de conversión global del negocio.
            </div>
          </div>
        </div>
      </div>

      {/* Conversions Daily Bar Chart */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Evolución Diaria de Transacciones (`purchase`)</h3>
          <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0" }}>Compras verificadas registradas cada día</p>
        </div>
        <div style={{ height: "260px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
              <Bar dataKey="keyEvents" fill="#22c55e" radius={[4, 4, 0, 0]} name="Compras (purchase)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Grids */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
        {/* By Channel */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Layers size={16} color="#1e9bd7" />
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Por Canal</h3>
          </div>
          {channels.map((ch, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border-color)", fontSize: "0.8rem" }}>
              <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{ch.channel}</span>
              <span style={{ color: "#22c55e", fontWeight: 700 }}>{ch.keyEvents} compras ({(ch.conversionRate * 100).toFixed(2)}%)</span>
            </div>
          ))}
        </div>

        {/* By Device */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Smartphone size={16} color="#1e9bd7" />
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Por Dispositivo</h3>
          </div>
          {devices.map((d, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border-color)", fontSize: "0.8rem" }}>
              <span style={{ color: "#f1f5f9", fontWeight: 600, textTransform: "capitalize" }}>{d.device}</span>
              <span style={{ color: "#22c55e", fontWeight: 700 }}>{d.keyEvents} compras ({(d.conversionRate * 100).toFixed(2)}%)</span>
            </div>
          ))}
        </div>

        {/* By Country */}
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            <Globe size={16} color="#1e9bd7" />
            <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Por País</h3>
          </div>
          {countries.slice(0, 6).map((c, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid var(--border-color)", fontSize: "0.8rem" }}>
              <span style={{ color: "#f1f5f9", fontWeight: 600 }}>{c.country}</span>
              <span style={{ color: "#22c55e", fontWeight: 700 }}>{c.keyEvents} compras ({(c.conversionRate * 100).toFixed(2)}%)</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function ConversionsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
      </div>
    }>
      <ConversionsContent />
    </Suspense>
  );
}
