"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3, Plus, Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <>
      <SectionHeader
        title="Reportes"
        description="Generación y descarga de reportes de analítica"
      >
        <button className="btn-primary">
          <Plus size={16} />
          Generar reporte
        </button>
      </SectionHeader>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
        {[
          { title: "Reporte semanal", desc: "Resumen de los últimos 7 días con comparación", icon: "📊" },
          { title: "Reporte mensual", desc: "Análisis completo del mes con tendencias", icon: "📈" },
          { title: "Reporte de campañas", desc: "ROI y rendimiento de campañas activas", icon: "📣" },
          { title: "Reporte de conversiones", desc: "Análisis de embudos y key events", icon: "🎯" },
        ].map((r) => (
          <div
            key={r.title}
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-color)",
              borderRadius: "12px",
              padding: "1.5rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>{r.icon}</div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "#f1f5f9", marginBottom: "0.35rem" }}>{r.title}</div>
            <div style={{ fontSize: "0.78rem", color: "#64748b" }}>{r.desc}</div>
            <button className="btn-secondary" style={{ marginTop: "1rem", width: "100%", justifyContent: "center" }}>
              <Download size={14} />
              Generar PDF
            </button>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Reportes generados</h2>
        </div>
        <EmptyState
          icon={BarChart3}
          title="Sin reportes generados"
          description="Los reportes generados aparecerán aquí para que puedas descargarlos o compartirlos con tu equipo."
          variant="compact"
        />
      </div>
    </>
  );
}
