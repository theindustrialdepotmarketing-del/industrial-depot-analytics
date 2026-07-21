"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CampaignsTable } from "@/components/dashboard/CampaignsTable";

export default function CampaignsPage() {
  return (
    <>
      <SectionHeader
        title="Campañas"
        description="Rendimiento de campañas de marketing y paid media"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
        {["Campañas activas", "Ingresos totales", "ROAS promedio", "CPA promedio"].map((label) => (
          <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#334155", marginTop: "0.5rem" }}>—</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Todas las campañas</h2>
          <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0" }}>Ordenadas por ingresos generados</p>
        </div>
        <CampaignsTable data={[]} />
      </div>
    </>
  );
}
