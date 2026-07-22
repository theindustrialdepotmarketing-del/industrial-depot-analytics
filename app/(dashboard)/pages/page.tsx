"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText, AlertTriangle, Database } from "lucide-react";

interface PageItem {
  landingPage: string;
  pagePath: string;
  pageTitle: string;
  views: number;
  users: number;
  sessions: number;
  engaged: number;
  duration: number;
  keyEvents: number;
  revenue: number;
  engagementRate: number;
  avgDuration: number;
}

interface PagesResponse {
  success: boolean;
  period: string;
  pages: PageItem[];
}

function PagesContent() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PagesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/pages?period=${period}`);
        const json = await res.json();
        if (isMounted) {
          if (!res.ok || !json.success) {
            setError(json.message || "Error consultando datos de páginas");
          } else {
            setData(json);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error de red al consultar páginas");
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
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Cargando métricas de páginas desde Supabase...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={Database}
        title="Sin datos de páginas"
        description={error || "Verifica la sincronización de GA4 hacia Supabase."}
        variant="default"
      />
    );
  }

  const { pages } = data;
  const zeroEventHighTraffic = pages.filter((p) => p.sessions >= 50 && p.keyEvents === 0);

  return (
    <>
      <SectionHeader
        title="Rendimiento de Páginas de Destino"
        description="Métricas por Landing Page y Page Path consultadas directamente desde Supabase"
      />

      {/* Zero Event High Traffic Alert Banner */}
      {zeroEventHighTraffic.length > 0 && (
        <div style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "10px", padding: "1.25rem", display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
          <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.9rem" }}>
              Páginas de Destino con Alto Tráfico y Cero Conversiones ({zeroEventHighTraffic.length})
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.35rem", lineHeight: 1.6 }}>
              Se detectaron páginas con más de 50 sesiones que no han registrado ningún Key Event en el periodo seleccionado.
            </div>
          </div>
        </div>
      )}

      {/* Pages Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText size={18} color="#1e9bd7" />
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Páginas de Destino Principales</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.6)", color: "#64748b", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "0.875rem 1.25rem" }}>Landing Page</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Vistas</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Usuarios</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Sesiones</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Engagement %</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Key Events</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Estado Conversión</th>
              </tr>
            </thead>
            <tbody>
              {pages.slice(0, 15).map((p, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)", color: "#f1f5f9" }}>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <div style={{ fontWeight: 600, color: p.landingPage.includes("(not set)") ? "#ef4444" : "#f1f5f9" }}>{p.landingPage}</div>
                    <div style={{ fontSize: "0.725rem", color: "#64748b" }}>{p.pageTitle !== "(not set)" ? p.pageTitle : p.pagePath}</div>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{p.views.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{p.users.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{p.sessions.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{(p.engagementRate * 100).toFixed(1)}%</td>
                  <td style={{ padding: "0.875rem 1.25rem", color: "#22c55e", fontWeight: 700 }}>{p.keyEvents.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    {p.sessions >= 50 && p.keyEvents === 0 ? (
                      <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.75rem" }}>⚠️ Sin conversiones</span>
                    ) : p.keyEvents > 0 ? (
                      <span style={{ color: "#22c55e", fontWeight: 600, fontSize: "0.75rem" }}>✓ Convierte</span>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Volumen bajo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function PagesPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
      </div>
    }>
      <PagesContent />
    </Suspense>
  );
}
