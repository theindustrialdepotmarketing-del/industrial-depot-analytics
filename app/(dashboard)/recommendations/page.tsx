"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Lightbulb,
  CheckCircle2,
  XCircle,
  PlayCircle,
  PlusSquare,
  AlertTriangle,
  Layers,
  Calendar,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import type { Recommendation, RecommendationStatus } from "@/lib/types/database";

function RecommendationsContent() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    // Perform fetch asynchronously inside microtask to avoid React 19 synchronous effect state warning
    Promise.resolve().then(async () => {
      if (!isMounted) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/recommendations?status=${statusFilter}`);
        const json = await res.json();
        if (isMounted) {
          if (!res.ok || !json.success) {
            setError(json.message || json.error || "Error al consultar recomendaciones en Supabase");
            setRecommendations([]);
          } else {
            setRecommendations(json.recommendations || []);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error de red al consultar recomendaciones");
          setRecommendations([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [statusFilter, period, refreshTrigger]);


  const handleUpdateStatus = async (id: string, newStatus: RecommendationStatus) => {
    setActionLoadingId(id);
    try {
      const res = await fetch("/api/analytics/recommendations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const json = await res.json();

      if (res.ok && json.success) {
        // Refresh list
        setRefreshTrigger((prev) => prev + 1);
      } else {
        window.alert(json.message || "Error al actualizar la recomendación");
      }
    } catch {
      window.alert("Error de conexión al actualizar el estado");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateTask = async (rec: Recommendation) => {
    if (!rec.id) return;
    setActionLoadingId(rec.id);
    try {
      const res = await fetch("/api/analytics/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recommendation_id: rec.id,
          title: `[Tarea] ${rec.title}`,
          description: rec.proposed_action || rec.action_steps || rec.description,
          category: rec.category || "general",
          priority: rec.priority || "medium",
          status: "pending",
          target_metric: rec.target_metric || "",
          tags: [rec.category || "recommendation"],
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        window.alert("¡Tarea creada exitosamente en la lista de Tareas!");
      } else {
        window.alert(json.message || "Error al crear la tarea");
      }
    } catch {
      window.alert("Error de red al crear la tarea");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRunAnalysisNow = async () => {
    setRunningAnalysis(true);
    setAnalysisSummary(null);
    try {
      const res = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAnalysisSummary(`Se generaron ${json.findingsGenerated} hallazgos, ${json.recommendationsCreated} recomendaciones nuevas y ${json.recommendationsUpdated} actualizadas.`);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setAnalysisSummary(json.message || "Error al ejecutar el diagnóstico");
      }
    } catch {
      setAnalysisSummary("Error de red al invocar el motor diagnóstico.");
    } finally {
      setRunningAnalysis(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return { label: "CRÍTICA", bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)" };
      case "high":
        return { label: "ALTA", bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b", border: "rgba(245, 158, 11, 0.3)" };
      case "medium":
        return { label: "MEDIA", bg: "rgba(30, 155, 215, 0.15)", color: "#1e9bd7", border: "rgba(30, 155, 215, 0.3)" };
      default:
        return { label: "BAJA", bg: "rgba(148, 163, 184, 0.15)", color: "#94a3b8", border: "rgba(148, 163, 184, 0.3)" };
    }
  };

  return (
    <>
      <SectionHeader
        title="Plan de Acción y Recomendaciones Estratégicas"
        description="Recomendaciones determinísticas generadas automáticamente a partir de los hallazgos de GA4"
      />

      {/* Header Controls & Filter Tabs */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        {/* Status Filter Tabs */}
        <div style={{ display: "flex", background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.25rem", gap: "0.25rem" }}>
          {[
            { id: "pending", label: "Pendientes" },
            { id: "in_progress", label: "En Progreso" },
            { id: "completed", label: "Completadas" },
            { id: "dismissed", label: "Descartadas" },
            { id: "all", label: "Todas" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              style={{
                background: statusFilter === tab.id ? "rgba(30, 155, 215, 0.2)" : "transparent",
                color: statusFilter === tab.id ? "#1e9bd7" : "#94a3b8",
                border: statusFilter === tab.id ? "1px solid rgba(30, 155, 215, 0.4)" : "none",
                padding: "0.4rem 0.85rem",
                borderRadius: "6px",
                fontSize: "0.8rem",
                fontWeight: statusFilter === tab.id ? 700 : 500,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Button: Run Analysis */}
        <button
          onClick={handleRunAnalysisNow}
          disabled={runningAnalysis}
          style={{
            background: "linear-gradient(135deg, #1e9bd7, #1578a8)",
            color: "#ffffff",
            border: "none",
            padding: "0.5rem 1rem",
            borderRadius: "8px",
            fontSize: "0.8rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <RefreshCw size={14} className={runningAnalysis ? "animate-spin" : ""} />
          {runningAnalysis ? "Generando Análisis..." : "Ejecutar Análisis Ahora"}
        </button>
      </div>

      {/* Analysis Summary Notification */}
      {analysisSummary && (
        <div style={{ background: "rgba(30, 155, 215, 0.1)", border: "1px solid rgba(30, 155, 215, 0.3)", borderRadius: "8px", padding: "0.75rem 1rem", fontSize: "0.825rem", color: "#f1f5f9", display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <Sparkles size={16} color="#1e9bd7" />
          <span>{analysisSummary}</span>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "350px", gap: "1rem" }}>
          <LoadingSpinner size={32} color="#1e9bd7" />
          <span style={{ color: "#94a3b8", fontSize: "0.875rem" }}>Consultando plan de acción en Supabase...</span>
        </div>
      )}

      {/* Requisito 17: Explicit Error State Card */}
      {!loading && error && (
        <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "12px", padding: "2rem", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          <AlertTriangle size={36} color="#ef4444" />
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#ef4444", margin: 0 }}>Error al consultar Supabase</h3>
            <p style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.4rem", maxWidth: "500px" }}>
              No se pudieron obtener las recomendaciones de la base de datos: <strong>{error}</strong>
            </p>
          </div>
          <button
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            style={{ background: "rgba(239, 68, 68, 0.2)", border: "1px solid rgba(239, 68, 68, 0.4)", color: "#f1f5f9", padding: "0.4rem 1rem", borderRadius: "6px", fontSize: "0.8rem", cursor: "pointer" }}
          >
            Reintentar Consulta
          </button>
        </div>
      )}

      {/* Empty State when no error but no items */}
      {!loading && !error && recommendations.length === 0 && (
        <EmptyState
          icon={Lightbulb}
          title="Sin recomendaciones en esta vista"
          description={`No hay recomendaciones registradas con el estado '${statusFilter}'. Ejecuta un análisis manual para generar nuevas recomendaciones.`}
          variant="default"
        />
      )}

      {/* Recommendations Cards Grid */}
      {!loading && !error && recommendations.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {recommendations.map((rec) => {
            const badge = getPriorityBadge(rec.priority);
            const isWorking = actionLoadingId === rec.id;

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
                {/* Header Row: Badges, Category, Date */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        padding: "0.2rem 0.6rem",
                        borderRadius: "6px",
                        fontSize: "0.725rem",
                        fontWeight: 800,
                        letterSpacing: "0.03em",
                      }}
                    >
                      {badge.label}
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.75rem", color: "#1e9bd7", fontWeight: 600 }}>
                      <Layers size={14} /> {(rec.category || "general").toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.75rem", color: "#64748b" }}>
                    <Calendar size={14} />
                    <span>{rec.recommendation_date || rec.created_at?.split("T")[0] || "Reciente"}</span>
                    <span style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-color)", padding: "0.1rem 0.4rem", borderRadius: "4px", fontSize: "0.7rem", color: "#cbd5e1" }}>
                      {rec.status}
                    </span>
                  </div>
                </div>

                {/* Title & Problem Description */}
                <div>
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
                    {rec.title}
                  </h3>
                  <p style={{ fontSize: "0.85rem", color: "#cbd5e1", marginTop: "0.4rem", lineHeight: 1.5 }}>
                    {rec.description || rec.problem}
                  </p>
                </div>

                {/* Quantitative Evidence Box */}
                {(rec.evidence || rec.target_metric) && (
                  <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.85rem 1rem", fontSize: "0.8rem" }}>
                    <strong style={{ color: "#1e9bd7" }}>Evidencia de Medición:</strong>
                    <div style={{ color: "#94a3b8", marginTop: "0.25rem" }}>
                      {typeof rec.evidence === "string" ? rec.evidence : JSON.stringify(rec.evidence)}
                    </div>
                  </div>
                )}

                {/* Action Steps & Expected Impact */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                  <div style={{ background: "rgba(34, 197, 94, 0.05)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "8px", padding: "0.85rem 1rem" }}>
                    <div style={{ fontWeight: 700, color: "#22c55e", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      Pasos de Acción Recomendados
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.4 }}>
                      {rec.proposed_action || rec.action_steps || "Verificar los parámetros de medición e implementar la corrección técnica en GTM o la web."}
                    </div>
                  </div>

                  <div style={{ background: "rgba(30, 155, 215, 0.05)", border: "1px solid rgba(30, 155, 215, 0.2)", borderRadius: "8px", padding: "0.85rem 1rem" }}>
                    <div style={{ fontWeight: 700, color: "#1e9bd7", fontSize: "0.8rem", marginBottom: "0.25rem" }}>
                      Impacto Estimado
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#cbd5e1", lineHeight: 1.4 }}>
                      {rec.expected_impact || "Mejora directa en el retorno publicitario y precisión del embudo de conversión."}
                    </div>
                  </div>
                </div>

                {/* Footer Action Buttons (Requisitos 8, 18) */}
                <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.6rem", borderTop: "1px solid var(--border-color)", paddingTop: "1rem", flexWrap: "wrap" }}>
                  {/* Create Task Button */}
                  <button
                    onClick={() => handleCreateTask(rec)}
                    disabled={isWorking}
                    style={{
                      background: "rgba(30, 155, 215, 0.12)",
                      color: "#1e9bd7",
                      border: "1px solid rgba(30, 155, 215, 0.3)",
                      padding: "0.4rem 0.85rem",
                      borderRadius: "6px",
                      fontSize: "0.775rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                    }}
                  >
                    <PlusSquare size={14} /> Crear Tarea
                  </button>

                  {/* Start Button */}
                  {rec.status !== "in_progress" && rec.status !== "completed" && (
                    <button
                      onClick={() => rec.id && handleUpdateStatus(rec.id, "in_progress")}
                      disabled={isWorking}
                      style={{
                        background: "rgba(245, 158, 11, 0.12)",
                        color: "#f59e0b",
                        border: "1px solid rgba(245, 158, 11, 0.3)",
                        padding: "0.4rem 0.85rem",
                        borderRadius: "6px",
                        fontSize: "0.775rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <PlayCircle size={14} /> Iniciar
                    </button>
                  )}

                  {/* Complete Button */}
                  {rec.status !== "completed" && (
                    <button
                      onClick={() => rec.id && handleUpdateStatus(rec.id, "completed")}
                      disabled={isWorking}
                      style={{
                        background: "rgba(34, 197, 94, 0.12)",
                        color: "#22c55e",
                        border: "1px solid rgba(34, 197, 94, 0.3)",
                        padding: "0.4rem 0.85rem",
                        borderRadius: "6px",
                        fontSize: "0.775rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <CheckCircle2 size={14} /> Completar
                    </button>
                  )}

                  {/* Dismiss Button */}
                  {rec.status !== "dismissed" && (
                    <button
                      onClick={() => rec.id && handleUpdateStatus(rec.id, "dismissed")}
                      disabled={isWorking}
                      style={{
                        background: "rgba(148, 163, 184, 0.12)",
                        color: "#94a3b8",
                        border: "1px solid rgba(148, 163, 184, 0.3)",
                        padding: "0.4rem 0.85rem",
                        borderRadius: "6px",
                        fontSize: "0.775rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                      }}
                    >
                      <XCircle size={14} /> Descartar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function RecommendationsPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
      </div>
    }>
      <RecommendationsContent />
    </Suspense>
  );
}
