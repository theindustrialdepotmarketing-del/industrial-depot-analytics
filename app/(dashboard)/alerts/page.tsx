"use client";

import React, { useEffect, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  CheckCircle2,
  PlusCircle,
  Filter,
} from "lucide-react";
import type { Alert } from "@/lib/types/database";

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAlerts() {
      setLoading(true);
      try {
        const res = await fetch("/api/analytics/alerts");
        const json = await res.json();
        if (isMounted && res.ok && json.success) {
          setAlerts(json.alerts || []);
        }
      } catch {
        // Suppress fetch error
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchAlerts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleResolveAlert = async (id: string, isResolved: boolean) => {
    setActioningId(id);
    try {
      const res = await fetch("/api/analytics/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_resolved: isResolved }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, is_resolved: isResolved } : a))
        );
      }
    } catch {
      // Suppress error
    } finally {
      setActioningId(null);
    }
  };

  const handleCreateTaskFromAlert = async (alertItem: Alert) => {
    setActioningId(alertItem.id || null);
    try {
      const res = await fetch("/api/analytics/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[Alerta ${alertItem.severity?.toUpperCase()}] ${alertItem.title}`,
          description: alertItem.description,
          category: alertItem.category || "alert",
          priority: alertItem.severity || "medium",
          target_metric: alertItem.metric,
        }),
      });
      if (res.ok) {
        window.alert("Tarea creada exitosamente desde la alerta.");
      }
    } catch {
      window.alert("Error al crear tarea.");
    } finally {
      setActioningId(null);
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterStatus === "pending" && a.is_resolved) return false;
    if (filterStatus === "resolved" && !a.is_resolved) return false;
    if (filterSeverity !== "all" && a.severity !== filterSeverity) return false;
    return true;
  });

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" };
      case "high":
        return { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.3)" };
      case "medium":
        return { bg: "rgba(30, 155, 215, 0.15)", color: "#1e9bd7", border: "1px solid rgba(30, 155, 215, 0.3)" };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", border: "1px solid rgba(148, 163, 184, 0.3)" };
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "1rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Cargando alertas desde Supabase...</span>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title="Centro de Alertas"
        description="Detección determinística de problemas y desvíos guardados en Supabase"
      />

      {/* Filter Bar */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", alignItems: "center", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "0.875rem 1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#94a3b8", fontSize: "0.8rem", fontWeight: 600 }}>
          <Filter size={16} color="#1e9bd7" /> Filtrar:
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ background: "#0f172a", color: "#f1f5f9", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
        >
          <option value="pending">Pendientes / Activas</option>
          <option value="resolved">Resueltas</option>
          <option value="all">Todas</option>
        </select>

        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          style={{ background: "#0f172a", color: "#f1f5f9", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
        >
          <option value="all">Todas las Severidades</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No hay alertas registradas"
          description="Todas las alertas han sido resueltas o no hay problemas en esta categoría."
          variant="compact"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {filteredAlerts.map((alertItem) => {
            const badge = getSeverityBadge(alertItem.severity || "medium");
            const isProcessing = actioningId === alertItem.id;

            return (
              <div
                key={alertItem.id}
                style={{
                  background: "var(--bg-card)",
                  border: alertItem.is_resolved ? "1px solid var(--border-color)" : `1px solid ${badge.color}40`,
                  borderRadius: "12px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: badge.border,
                        padding: "0.2rem 0.6rem",
                        borderRadius: "6px",
                        fontSize: "0.725rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      {alertItem.severity}
                    </span>
                    <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: alertItem.is_resolved ? "#94a3b8" : "#f1f5f9", margin: 0, textDecoration: alertItem.is_resolved ? "line-through" : "none" }}>
                      {alertItem.title}
                    </h3>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleCreateTaskFromAlert(alertItem)}
                      disabled={isProcessing}
                      style={{
                        background: "rgba(30, 155, 215, 0.12)",
                        color: "#1e9bd7",
                        border: "1px solid rgba(30, 155, 215, 0.3)",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <PlusCircle size={14} />
                      Crear Tarea
                    </button>

                    <button
                      onClick={() => handleResolveAlert(alertItem.id!, !alertItem.is_resolved)}
                      disabled={isProcessing}
                      style={{
                        background: alertItem.is_resolved ? "rgba(148, 163, 184, 0.12)" : "rgba(34, 197, 94, 0.12)",
                        color: alertItem.is_resolved ? "#94a3b8" : "#22c55e",
                        border: alertItem.is_resolved ? "1px solid rgba(148, 163, 184, 0.3)" : "1px solid rgba(34, 197, 94, 0.3)",
                        padding: "0.35rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <CheckCircle2 size={14} />
                      {alertItem.is_resolved ? "Marcar Pendiente" : "Marcar Resuelta"}
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: "0.825rem", color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                  {alertItem.description}
                </p>

                {alertItem.proposed_action && (
                  <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "0.6rem 0.85rem", borderRadius: "6px", fontSize: "0.78rem", color: "#1e9bd7", border: "1px solid var(--border-color)" }}>
                    <strong>Acción Recomendada:</strong> {alertItem.proposed_action}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
