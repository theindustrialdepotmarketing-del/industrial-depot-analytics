"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Target, Award, Database, Layers, Smartphone, Globe } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ConversionsResponse {
  success: boolean;
  period: string;
  keyEventsKpi: { value: number; prevValue: number; percentChange: number };
  keyEventRateKpi: { value: number; prevValue: number; percentChange: number };
  dailyTrends: { date: string; keyEvents: number }[];
  channels: { channel: string; keyEvents: number; conversionRate: number }[];
  devices: { device: string; keyEvents: number; conversionRate: number }[];
  countries: { country: string; keyEvents: number; conversionRate: number }[];
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
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Cargando datos de conversiones desde Supabase...</span>
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

  const { keyEventsKpi, keyEventRateKpi, dailyTrends, channels, devices, countries } = data;

  return (
    <>
      <SectionHeader
        title="Key Events y Conversiones"
        description="Análisis detallado de eventos clave por canal, dispositivo y ubicación geográfica"
      />

      {/* KPI Cards Header */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Key Events Totales</span>
            <Target size={18} color="#22c55e" />
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#22c55e", marginTop: "0.5rem" }}>
            {keyEventsKpi.value.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
            Variación: <strong style={{ color: keyEventsKpi.percentChange >= 0 ? "#22c55e" : "#ef4444" }}>{keyEventsKpi.percentChange}%</strong> vs periodo anterior ({keyEventsKpi.prevValue})
          </div>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>Tasa de Conversión Promedio</span>
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

      {/* Conversions Daily Bar Chart */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Evolución Diaria de Key Events</h3>
          <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0" }}>Eventos clave registrados cada día</p>
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
              <span style={{ color: "#22c55e", fontWeight: 700 }}>{ch.keyEvents} events ({(ch.conversionRate * 100).toFixed(2)}%)</span>
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
              <span style={{ color: "#22c55e", fontWeight: 700 }}>{d.keyEvents} events ({(d.conversionRate * 100).toFixed(2)}%)</span>
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
              <span style={{ color: "#22c55e", fontWeight: 700 }}>{c.keyEvents} events ({(c.conversionRate * 100).toFixed(2)}%)</span>
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
