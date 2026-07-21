"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell, AlertTriangle, Info, XOctagon } from "lucide-react";

const SEVERITY_CONFIG = {
  critical: { icon: XOctagon, color: "#dc2626", bg: "rgba(220,38,38,0.08)", border: "rgba(220,38,38,0.2)", label: "Crítica" },
  warning: { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", label: "Advertencia" },
  info: { icon: Info, color: "#1e9bd7", bg: "rgba(30,155,215,0.08)", border: "rgba(30,155,215,0.2)", label: "Info" },
} as const;

type Severity = keyof typeof SEVERITY_CONFIG;

interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  time: string;
  isRead: boolean;
}

const SAMPLE_ALERTS: AlertItem[] = []; // Empty until GA4 is connected

export default function AlertsPage() {
  return (
    <>
      <SectionHeader
        title="Alertas"
        description="Notificaciones automáticas sobre cambios significativos en tus métricas"
      />

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {["Todas", "Críticas", "Advertencias", "Información"].map((tab) => (
          <button
            key={tab}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: tab === "Todas" ? "rgba(30,155,215,0.1)" : "transparent",
              color: tab === "Todas" ? "#1e9bd7" : "#64748b",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {SAMPLE_ALERTS.length === 0 ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
            <EmptyState
              icon={Bell}
              title="Sin alertas activas"
              description="Las alertas automáticas aparecerán aquí cuando GA4 esté conectado y se detecten cambios significativos en tus métricas."
            />
          </div>
        ) : (
          SAMPLE_ALERTS.map((alert) => {
            const cfg = SEVERITY_CONFIG[alert.severity];
            const Icon = cfg.icon;
            return (
              <div
                key={alert.id}
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${alert.isRead ? "var(--border-color)" : cfg.border}`,
                  borderRadius: "12px",
                  padding: "1.25rem",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  transition: "border-color 0.15s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "8px", background: cfg.bg, flexShrink: 0 }}>
                  <Icon size={18} color={cfg.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#f1f5f9" }}>{alert.title}</div>
                    <div style={{ fontSize: "0.72rem", color: "#475569", whiteSpace: "nowrap" }}>{alert.time}</div>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "0.25rem" }}>{alert.description}</div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
