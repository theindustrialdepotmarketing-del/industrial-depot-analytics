"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { CampaignsTable } from "@/components/dashboard/CampaignsTable";
import { ChannelsTable } from "@/components/dashboard/ChannelsTable";
import { LandingPagesTable } from "@/components/dashboard/LandingPagesTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { Activity, WifiOff } from "lucide-react";

const GA4_CONNECTED = false;

export default function OverviewPage() {
  return (
    <>
      <SectionHeader
        title="Resumen"
        description="Vista general del rendimiento de TheIndustrialDepot.com"
      />

      {!GA4_CONNECTED && (
        <div
          style={{
            background: "rgba(30, 155, 215, 0.06)",
            border: "1px solid rgba(30, 155, 215, 0.2)",
            borderRadius: "12px",
            padding: "1rem 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.875rem",
          }}
        >
          <WifiOff size={18} color="#1e9bd7" />
          <div>
            <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#94a3b8" }}>
              Google Analytics 4 no está conectado
            </div>
            <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: "0.15rem" }}>
              Configura las credenciales de GA4 en{" "}
              <a href="/settings" style={{ color: "#1e9bd7", textDecoration: "none" }}>
                Configuración
              </a>{" "}
              para ver datos reales.
            </div>
          </div>
        </div>
      )}

      <MetricsGrid isConnected={GA4_CONNECTED} />

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <div>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>
              Sesiones en el tiempo
            </h2>
            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0" }}>
              Período actual vs. período anterior
            </p>
          </div>
        </div>
        <EmptyState
          icon={Activity}
          title="Sin datos de sesiones"
          description="Cuando GA4 esté conectado, aquí verás la evolución de sesiones comparada con el período anterior."
          variant="compact"
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(480px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Por canal</h2>
          </div>
          <ChannelsTable data={[]} />
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Campañas principales</h2>
          </div>
          <CampaignsTable data={[]} />
        </div>
      </div>

      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Páginas de destino</h2>
        </div>
        <LandingPagesTable data={[]} />
      </div>
    </>
  );
}
