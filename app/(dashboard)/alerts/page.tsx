"use client";

import React, { useEffect, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  CheckCircle2,
  PlusCircle,
  Filter,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import type { Alert, AlertEvidence } from "@/lib/types/database";

export default function AlertsPage() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("active");
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

  const handleUpdateStatus = async (id: string, newStatus: "open" | "reviewing" | "resolved" | "dismissed") => {
    setActioningId(id);
    try {
      const res = await fetch("/api/analytics/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setAlerts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
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
    const evidence = (alertItem.evidence || {}) as AlertEvidence;

    try {
      const res = await fetch("/api/analytics/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `[Alerta ${alertItem.severity?.toUpperCase()}] ${alertItem.title}`,
          description: evidence.proposedAction || alertItem.description,
          category: alertItem.category || "alert",
          priority: alertItem.severity || "medium",
          target_metric: evidence.targetMetric,
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
    if (filterStatus === "active") {
      if (a.status !== "open" && a.status !== "reviewing") return false;
    } else if (filterStatus === "resolved") {
      if (a.status !== "resolved") return false;
    } else if (filterStatus === "dismissed") {
      if (a.status !== "dismissed") return false;
    }

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
          <option value="active">Pendientes / Activas (open, reviewing)</option>
          <option value="resolved">Resueltas (resolved)</option>
          <option value="dismissed">Descartadas (dismissed)</option>
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
          <option value="info">Info</option>
        </select>
      </div>

      {/* Alerts List */}
      {filteredAlerts.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No hay alertas registradas"
          description="Todas las alertas han sido procesadas o no hay hallazgos con este filtro."
          variant="compact"
        />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {filteredAlerts.map((alertItem) => {
            const badge = getSeverityBadge(alertItem.severity || "medium");
            const isProcessing = actioningId === alertItem.id;
            const evidence = (alertItem.evidence || {}) as AlertEvidence;
            const isInactive = alertItem.status === "resolved" || alertItem.status === "dismissed";

            return (
              <div
                key={alertItem.id}
                style={{
                  background: "var(--bg-card)",
                  border: isInactive ? "1px solid var(--border-color)" : `1px solid ${badge.color}40`,
                  borderRadius: "12px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                {/* Header Row: Severidad, Categoría, Estado & Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
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

                    <span
                      style={{
                        background: "rgba(148, 163, 184, 0.12)",
                        color: "#94a3b8",
                        border: "1px solid var(--border-color)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "6px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        textTransform: "capitalize",
                      }}
                    >
                      {alertItem.category}
                    </span>

                    <span
                      style={{
                        fontSize: "0.7rem",
                        color: alertItem.status === "resolved" ? "#22c55e" : alertItem.status === "dismissed" ? "#64748b" : "#1e9bd7",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        background: "rgba(15, 23, 42, 0.6)",
                        padding: "0.2rem 0.5rem",
                        borderRadius: "4px",
                        border: "1px solid var(--border-color)",
                      }}
                    >
                      Estado: {alertItem.status}
                    </span>
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

                    {alertItem.status !== "resolved" ? (
                      <button
                        onClick={() => handleUpdateStatus(alertItem.id!, "resolved")}
                        disabled={isProcessing}
                        style={{
                          background: "rgba(34, 197, 94, 0.12)",
                          color: "#22c55e",
                          border: "1px solid rgba(34, 197, 94, 0.3)",
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
                        Resolver
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(alertItem.id!, "open")}
                        disabled={isProcessing}
                        style={{
                          background: "rgba(148, 163, 184, 0.12)",
                          color: "#94a3b8",
                          border: "1px solid var(--border-color)",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Reabrir
                      </button>
                    )}

                    {alertItem.status !== "dismissed" && (
                      <button
                        onClick={() => handleUpdateStatus(alertItem.id!, "dismissed")}
                        disabled={isProcessing}
                        style={{
                          background: "transparent",
                          color: "#64748b",
                          border: "1px solid var(--border-color)",
                          padding: "0.35rem 0.6rem",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                        }}
                        title="Descartar"
                      >
                        <XCircle size={14} />
                        Descartar
                      </button>
                    )}
                  </div>
                </div>

                {/* Title & Description */}
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: isInactive ? "#94a3b8" : "#f1f5f9", margin: 0, textDecoration: isInactive ? "line-through" : "none" }}>
                    {alertItem.title}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "0.35rem", margin: "0.35rem 0 0", lineHeight: 1.5 }}>
                    {alertItem.description}
                  </p>
                </div>

                {/* Evidence Metrics Grid (Requisito 17) */}
                <div
                  style={{
                    background: "rgba(15, 23, 42, 0.6)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "0.875rem 1rem",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "0.75rem",
                    fontSize: "0.78rem",
                  }}
                >
                  {evidence.affectedEntity && (
                    <div>
                      <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Entidad Afectada</div>
                      <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.15rem" }}>{evidence.affectedEntity}</div>
                    </div>
                  )}

                  {(evidence.currentValue !== undefined || evidence.previousValue !== undefined) && (
                    <div>
                      <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Valores (Actual / Prev)</div>
                      <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.15rem" }}>
                        {evidence.currentValue !== undefined && evidence.currentValue !== null ? String(evidence.currentValue) : "N/A"} / {evidence.previousValue !== undefined && evidence.previousValue !== null ? String(evidence.previousValue) : "N/A"}
                      </div>
                    </div>
                  )}

                  {evidence.percentageChange !== undefined && evidence.percentageChange !== null && (
                    <div>
                      <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Variación Porcentual</div>
                      <div style={{
                        color: Number(evidence.percentageChange) > 0 ? "#22c55e" : Number(evidence.percentageChange) < 0 ? "#ef4444" : "#94a3b8",
                        fontWeight: 700,
                        marginTop: "0.15rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.2rem",
                      }}>
                        {Number(evidence.percentageChange) > 0 ? <ArrowUpRight size={13} /> : Number(evidence.percentageChange) < 0 ? <ArrowDownRight size={13} /> : <Minus size={13} />}
                        {evidence.percentageChange}%
                      </div>
                    </div>
                  )}

                  {evidence.targetMetric && (
                    <div>
                      <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Métrica Objetivo</div>
                      <div style={{ color: "#1e9bd7", fontWeight: 600, marginTop: "0.15rem" }}>{evidence.targetMetric}</div>
                    </div>
                  )}

                  <div>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Fecha Registrada</div>
                    <div style={{ color: "#94a3b8", marginTop: "0.15rem" }}>
                      {alertItem.alert_date || (alertItem.created_at ? new Date(alertItem.created_at).toLocaleDateString("es-ES") : "Sin fecha")}
                    </div>
                  </div>
                </div>

                {/* Proposed Action */}
                {evidence.proposedAction && (
                  <div style={{ background: "rgba(30, 155, 215, 0.08)", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.8rem", border: "1px solid rgba(30, 155, 215, 0.25)" }}>
                    <strong style={{ color: "#1e9bd7" }}>Acción Propuesta:</strong>{" "}
                    <span style={{ color: "#cbd5e1" }}>{evidence.proposedAction}</span>
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
