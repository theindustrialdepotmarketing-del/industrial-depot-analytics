"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LandingPagesTable } from "@/components/dashboard/LandingPagesTable";

export default function PagesPage() {
  return (
    <>
      <SectionHeader
        title="Páginas"
        description="Rendimiento de páginas de destino y contenido del sitio"
      />

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Páginas de destino</h2>
          <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0" }}>Por sesiones, tasa de interacción y conversiones</p>
        </div>
        <LandingPagesTable data={[]} />
      </div>
    </>
  );
}
