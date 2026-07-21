"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Target } from "lucide-react";

export default function ConversionsPage() {
  return (
    <>
      <SectionHeader
        title="Conversiones"
        description="Key events, embudos de conversión y tasas por canal"
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
        {["Total conversiones", "Tasa de conversión", "Valor por conversión", "Top evento"].map((label) => (
          <div key={label} style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#334155", marginTop: "0.5rem" }}>—</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Key Events de GA4</h2>
        </div>
        <EmptyState
          icon={Target}
          title="Sin datos de conversiones"
          description="Conecta GA4 para rastrear key events, embudos y tasas de conversión por canal y campaña."
          variant="compact"
        />
      </div>
    </>
  );
}
