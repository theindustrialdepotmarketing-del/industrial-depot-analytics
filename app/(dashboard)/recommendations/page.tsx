"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Lightbulb } from "lucide-react";

export default function RecommendationsPage() {
  return (
    <>
      <SectionHeader
        title="Recomendaciones"
        description="Sugerencias de optimización basadas en el análisis de tus datos"
      />

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
        <EmptyState
          icon={Lightbulb}
          title="Sin recomendaciones disponibles"
          description="Las recomendaciones de optimización se generarán automáticamente una vez que GA4 esté conectado y haya suficiente historial de datos."
        />
      </div>
    </>
  );
}
