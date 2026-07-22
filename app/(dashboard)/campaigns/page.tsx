"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Database, Megaphone } from "lucide-react";
import type { CampaignClassification } from "@/lib/analytics/diagnostic-engine";

interface CampaignsResponse {
  success: boolean;
  period: string;
  campaigns: CampaignClassification[];
}

function CampaignsContent() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CampaignsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/campaigns?period=${period}`);
        const json = await res.json();
        if (isMounted) {
          if (!res.ok || !json.success) {
            setError(json.message || "Error consultando campañas");
          } else {
            setData(json);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error de red al consultar campañas");
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
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Clasificando campañas desde Supabase...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={Database}
        title="Sin datos de campañas"
        description={error || "Verifica la sincronización de GA4 hacia Supabase."}
        variant="default"
      />
    );
  }

  const { campaigns } = data;

  const filteredCampaigns = campaigns.filter((c) => {
    if (selectedFilter === "all") return true;
    return c.classification === selectedFilter;
  });

  const getBadgeStyle = (classification: string) => {
    switch (classification) {
      case "CONTINUAR":
        return { bg: "rgba(34, 197, 94, 0.12)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.3)" };
      case "OPTIMIZAR":
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" };
      case "VIGILAR":
        return { bg: "rgba(30, 155, 215, 0.12)", color: "#1e9bd7", border: "1px solid rgba(30, 155, 215, 0.3)" };
      case "REVISAR/DETENER":
        return { bg: "rgba(239, 68, 68, 0.12)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" };
      default:
        return { bg: "rgba(148, 163, 184, 0.12)", color: "#94a3b8", border: "1px solid rgba(148, 163, 184, 0.3)" };
    }
  };

  return (
    <>
      <SectionHeader
        title="Evaluación de Campañas"
        description="Clasificación determinística basada en volumen, tasa de conversión y calidad de etiquetado UTM"
      />

      {/* Classification Filters Bar */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
        {[
          { key: "all", label: "Todas las Campañas", count: campaigns.length },
          { key: "CONTINUAR", label: "CONTINUAR", count: campaigns.filter((c) => c.classification === "CONTINUAR").length },
          { key: "OPTIMIZAR", label: "OPTIMIZAR", count: campaigns.filter((c) => c.classification === "OPTIMIZAR").length },
          { key: "VIGILAR", label: "VIGILAR", count: campaigns.filter((c) => c.classification === "VIGILAR").length },
          { key: "REVISAR/DETENER", label: "REVISAR / DETENER", count: campaigns.filter((c) => c.classification === "REVISAR/DETENER").length },
        ].map((btn) => {
          const isActive = selectedFilter === btn.key;
          return (
            <button
              key={btn.key}
              onClick={() => setSelectedFilter(btn.key)}
              style={{
                background: isActive ? "linear-gradient(135deg, #1e9bd7, #1578a8)" : "rgba(15, 23, 42, 0.8)",
                color: isActive ? "#ffffff" : "#94a3b8",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "0.45rem 0.85rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
              }}
            >
              {btn.label}
              <span style={{ background: "rgba(0,0,0,0.2)", padding: "0.1rem 0.4rem", borderRadius: "10px", fontSize: "0.7rem" }}>
                {btn.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Campaigns Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Megaphone size={18} color="#1e9bd7" />
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Listado de Campañas</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.6)", color: "#64748b", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "0.875rem 1.25rem" }}>Fuente / Medio / Campaña</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Canal</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Sesiones</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Key Events</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Conversión %</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Estado</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Recomendación Determinística</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                    No hay campañas en esta categoría.
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((c, idx) => {
                  const badge = getBadgeStyle(c.classification);
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)", color: "#f1f5f9" }}>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <div style={{ fontWeight: 600, color: c.hasErrors ? "#ef4444" : "#f1f5f9" }}>{c.campaignName}</div>
                        <div style={{ fontSize: "0.725rem", color: "#64748b" }}>{c.source} / {c.medium}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", color: "#1e9bd7" }}>{c.channel}</td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>{c.sessions.toLocaleString()}</td>
                      <td style={{ padding: "0.875rem 1.25rem", color: "#22c55e", fontWeight: 700 }}>{c.keyEvents.toLocaleString()}</td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>{(c.conversionRate * 100).toFixed(2)}%</td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            border: badge.border,
                            padding: "0.25rem 0.6rem",
                            borderRadius: "6px",
                            fontSize: "0.725rem",
                            fontWeight: 700,
                            display: "inline-block",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {c.classification}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", color: "#94a3b8", fontSize: "0.78rem", maxWidth: "320px", lineHeight: 1.4 }}>
                        {c.recommendationText}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function CampaignsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
      </div>
    }>
      <CampaignsContent />
    </Suspense>
  );
}
