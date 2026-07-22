"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  AlertTriangle,
  Database,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Layers,
  Globe,
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

interface ChannelItem {
  channel: string;
  users: number;
  sessions: number;
  engagedSessions: number;
  engagementRate: number;
  keyEvents: number;
  conversionRate: number;
  revenue: number;
  changeSessionsPercent: number;
  changeEventsPercent: number;
}

interface SourceMediumItem {
  source: string;
  medium: string;
  channel: string;
  users: number;
  sessions: number;
  keyEvents: number;
  revenue: number;
}

interface AcquisitionResponse {
  success: boolean;
  period: string;
  channels: ChannelItem[];
  sourceMediums: SourceMediumItem[];
}

function AcquisitionContent() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AcquisitionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/acquisition?period=${period}`);
        const json = await res.json();
        if (isMounted) {
          if (!res.ok || !json.success) {
            setError(json.message || "Error consultando adquisición");
          } else {
            setData(json);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error de red al consultar adquisición");
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
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Cargando datos de adquisición desde Supabase...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={Database}
        title="Sin datos de adquisición"
        description={error || "Verifica la sincronización de GA4 hacia Supabase."}
        variant="default"
      />
    );
  }

  const { channels, sourceMediums } = data;

  const totalSessions = channels.reduce((acc, c) => acc + c.sessions, 0);
  const directItem = channels.find((c) => c.channel.toLowerCase().includes("direct"));
  const unassignedItem = channels.find((c) => c.channel.toLowerCase().includes("unassigned"));
  const notSetItem = channels.find((c) => c.channel.includes("(not set)"));

  const directRatio = totalSessions > 0 && directItem ? directItem.sessions / totalSessions : 0;
  const unassignedRatio = totalSessions > 0 && unassignedItem ? unassignedItem.sessions / totalSessions : 0;
  const notSetRatio = totalSessions > 0 && notSetItem ? notSetItem.sessions / totalSessions : 0;

  return (
    <>
      <SectionHeader
        title="Adquisición de Tráfico"
        description="Análisis por grupo de canales predeterminado y combinaciones Fuente / Medio desde Supabase"
      />

      {/* Attribution Quality Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
        {directRatio > 0.4 && (
          <div style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "10px", padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.85rem" }}>Tráfico Direct Excesivo</div>
              <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: "0.2rem", lineHeight: 1.5 }}>
                El canal Direct representa el <strong>{(directRatio * 100).toFixed(1)}%</strong> del tráfico. Implementa etiquetado UTM en campañas externas.
              </div>
            </div>
          </div>
        )}

        {unassignedRatio > 0.05 && (
          <div style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "10px", padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.85rem" }}>Tráfico Unassigned Elevado</div>
              <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: "0.2rem", lineHeight: 1.5 }}>
                El <strong>{(unassignedRatio * 100).toFixed(1)}%</strong> del tráfico no coincide con los grupos de canales estándar de GA4.
              </div>
            </div>
          </div>
        )}

        {notSetRatio > 0.05 && (
          <div style={{ background: "rgba(245, 158, 11, 0.06)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: "10px", padding: "1rem", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
            <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontWeight: 700, color: "#f59e0b", fontSize: "0.85rem" }}>Valores (not set) Detectados</div>
              <div style={{ color: "#94a3b8", fontSize: "0.78rem", marginTop: "0.2rem", lineHeight: 1.5 }}>
                El <strong>{(notSetRatio * 100).toFixed(1)}%</strong> del tráfico tiene fuente/medio sin definir.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Channel Distribution Chart */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ marginBottom: "1.25rem" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Sesiones y Conversiones por Canal</h3>
          <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0" }}>Comparación de volumen y eventos clave</p>
        </div>
        <div style={{ height: "280px", width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={channels}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="channel" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }} />
              <Bar dataKey="sessions" fill="#1e9bd7" radius={[4, 4, 0, 0]} name="Sesiones" />
              <Bar dataKey="keyEvents" fill="#22c55e" radius={[4, 4, 0, 0]} name="Key Events" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Channels Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Layers size={18} color="#1e9bd7" />
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Canales de Adquisición</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.6)", color: "#64748b", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "0.875rem 1.25rem" }}>Canal</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Usuarios</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Sesiones</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Engagement %</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Key Events</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Conversión %</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Variación Sesiones</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((ch, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)", color: "#f1f5f9" }}>
                  <td style={{ padding: "0.875rem 1.25rem", fontWeight: 600 }}>{ch.channel}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{ch.users.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{ch.sessions.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{(ch.engagementRate * 100).toFixed(1)}%</td>
                  <td style={{ padding: "0.875rem 1.25rem", color: "#22c55e", fontWeight: 700 }}>{ch.keyEvents.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{(ch.conversionRate * 100).toFixed(2)}%</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <span style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.2rem",
                      color: ch.changeSessionsPercent > 0 ? "#22c55e" : ch.changeSessionsPercent < 0 ? "#ef4444" : "#94a3b8",
                      fontWeight: 600,
                    }}>
                      {ch.changeSessionsPercent > 0 ? <ArrowUpRight size={14} /> : ch.changeSessionsPercent < 0 ? <ArrowDownRight size={14} /> : <Minus size={14} />}
                      {Math.abs(Number(ch.changeSessionsPercent.toFixed(1)))}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Source / Medium Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Globe size={18} color="#1e9bd7" />
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Desglose por Fuente / Medio (Source / Medium)</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.6)", color: "#64748b", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "0.875rem 1.25rem" }}>Fuente</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Medio</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Canal</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Usuarios</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Sesiones</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Key Events</th>
              </tr>
            </thead>
            <tbody>
              {sourceMediums.slice(0, 15).map((sm, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)", color: "#f1f5f9" }}>
                  <td style={{ padding: "0.875rem 1.25rem", fontWeight: 600, color: sm.source.includes("(not set)") ? "#ef4444" : "#f1f5f9" }}>{sm.source}</td>
                  <td style={{ padding: "0.875rem 1.25rem", color: sm.medium.includes("(not set)") ? "#ef4444" : "#94a3b8" }}>{sm.medium}</td>
                  <td style={{ padding: "0.875rem 1.25rem", color: "#1e9bd7" }}>{sm.channel}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{sm.users.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{sm.sessions.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem", color: "#22c55e", fontWeight: 700 }}>{sm.keyEvents.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function AcquisitionPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
      </div>
    }>
      <AcquisitionContent />
    </Suspense>
  );
}
