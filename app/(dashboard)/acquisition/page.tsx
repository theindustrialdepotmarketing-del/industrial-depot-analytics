"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ChannelsTable } from "@/components/dashboard/ChannelsTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowUpFromDot } from "lucide-react";

export default function AcquisitionPage() {
  return (
    <>
      <SectionHeader
        title="Adquisición"
        description="Análisis de canales de tráfico y fuentes de adquisición"
      />

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Canales de adquisición</h2>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0" }}>Rendimiento por canal de marketing</p>
          </div>
        </div>
        <ChannelsTable data={[]} />
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: "0 0 1.25rem" }}>Sesiones por canal</h2>
        <EmptyState
          icon={ArrowUpFromDot}
          title="Sin datos de adquisición"
          description="Conecta GA4 para visualizar la distribución de tráfico por canal en el período seleccionado."
          variant="compact"
        />
      </div>
    </>
  );
}
