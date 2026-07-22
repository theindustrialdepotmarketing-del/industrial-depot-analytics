"use client";

import React, { useEffect, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Lightbulb,
  PlusCircle,
} from "lucide-react";
import type { Recommendation } from "@/lib/types/database";

export default function RecommendationsPage() {
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchRecommendations() {
      setLoading(true);
      try {
        const res = await fetch("/api/analytics/recommendations");
        const json = await res.json();
        if (isMounted && res.ok && json.success) {
          setRecommendations(json.recommendations || []);
        }
      } catch {
        // Suppress fetch error
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchRecommendations();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateStatus = async (id: string, status: "pending" | "in_progress" | "completed" | "dismissed") => {
    setActioningId(id);
    try {
      const res = await fetch("/api/analytics/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setRecommendations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status } : r))
        );
      }
    } catch {
      // Suppress error
    } finally {
      setActioningId(null);
    }
  };

  const handleCreateTaskFromRec = async (rec: Recommendation) => {
    setActioningId(rec.id || null);
    try {
      const res = await fetch("/api/analytics/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendation_id: rec.id,
          title: `[Acción] ${rec.title}`,
          description: rec.proposed_action,
          priority: rec.priority || "medium",
          target_metric: rec.target_metric,
        }),
      });
      if (res.ok) {
        setRecommendations((prev) =>
          prev.map((r) => (r.id === rec.id ? { ...r, status: "in_progress" } : r))
        );
        alert("Tarea creada e iniciada exitosamente.");
      }
    } catch {
      alert("Error al crear tarea.");
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "1rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Cargando recomendaciones desde Supabase...</span>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title="Recomendaciones Estratégicas"
        description="Acciones determinísticas con impacto esperado para optimizar la conversión"
      />

      {recommendations.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Sin recomendaciones pendientes"
          description="Ejecuta la sincronización o el análisis de diagnóstico para generar recomendaciones automáticas."
          variant="default"
        />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.25rem" }}>
          {recommendations.map((rec) => {
            const isProcessing = actioningId === rec.id;

            return (
              <div
                key={rec.id}
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span
                      style={{
                        background: "rgba(30, 155, 215, 0.12)",
                        color: "#1e9bd7",
                        padding: "0.2rem 0.6rem",
                        borderRadius: "4px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      Prioridad {rec.priority}
                    </span>
                    <h3 style={{ fontSize: "1rem", fontWeight: 700, color: "#f1f5f9", marginTop: "0.5rem", margin: "0.5rem 0 0" }}>
                      {rec.title}
                    </h3>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", color: "#94a3b8", lineHeight: 1.5 }}>
                  <strong style={{ color: "#cbd5e1" }}>Problema:</strong> {rec.problem}
                </div>

                <div style={{ background: "rgba(15, 23, 42, 0.6)", padding: "0.75rem", borderRadius: "8px", border: "1px solid var(--border-color)", fontSize: "0.78rem" }}>
                  <div style={{ color: "#1e9bd7", fontWeight: 700, marginBottom: "0.25rem" }}>Acción Propuesta:</div>
                  <div style={{ color: "#f1f5f9", lineHeight: 1.5 }}>{rec.proposed_action}</div>
                </div>

                <div style={{ fontSize: "0.78rem", color: "#22c55e", fontWeight: 600 }}>
                  Impacto Esperado: {rec.expected_impact}
                </div>

                <div style={{ display: "flex", gap: "0.5rem", marginTop: "auto", paddingTop: "0.5rem" }}>
                  <button
                    onClick={() => handleCreateTaskFromRec(rec)}
                    disabled={isProcessing}
                    className="btn-primary"
                    style={{ flex: 1, fontSize: "0.78rem", padding: "0.45rem", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.35rem" }}
                  >
                    <PlusCircle size={14} />
                    Convertir en Tarea
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(rec.id!, "completed")}
                    disabled={isProcessing}
                    style={{
                      background: "rgba(34, 197, 94, 0.12)",
                      color: "#22c55e",
                      border: "1px solid rgba(34, 197, 94, 0.3)",
                      padding: "0.45rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    Completar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
