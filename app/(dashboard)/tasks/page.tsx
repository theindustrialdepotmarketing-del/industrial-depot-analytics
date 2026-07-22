"use client";

import React, { useEffect, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckSquare } from "lucide-react";
import type { Task } from "@/lib/types/database";

export default function TasksPage() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchTasks() {
      setLoading(true);
      try {
        const res = await fetch("/api/analytics/tasks");
        const json = await res.json();
        if (isMounted && res.ok && json.success) {
          setTasks(json.tasks || []);
        }
      } catch {
        // Suppress fetch error
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTasks();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateStatus = async (id: string, status: "pending" | "in_progress" | "done" | "cancelled") => {
    setActioningId(id);
    try {
      const res = await fetch("/api/analytics/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status } : t))
        );
      }
    } catch {
      // Suppress error
    } finally {
      setActioningId(null);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === "all") return true;
    return t.status === filterStatus;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return { bg: "rgba(239, 68, 68, 0.15)", color: "#ef4444" };
      case "high":
        return { bg: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" };
      case "medium":
        return { bg: "rgba(30, 155, 215, 0.15)", color: "#1e9bd7" };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", color: "#94a3b8" };
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "1rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Cargando tareas desde Supabase...</span>
      </div>
    );
  }

  return (
    <>
      <SectionHeader
        title="Gestión de Tareas"
        description="Tareas técnicas y optimizaciones generadas automáticamente o creadas por el usuario"
      />

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        {[
          { key: "all", label: "Todas" },
          { key: "pending", label: "Pendientes" },
          { key: "in_progress", label: "En Progreso" },
          { key: "done", label: "Completadas" },
        ].map((tab) => {
          const isActive = filterStatus === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              style={{
                background: isActive ? "linear-gradient(135deg, #1e9bd7, #1578a8)" : "rgba(15, 23, 42, 0.8)",
                color: isActive ? "#ffffff" : "#94a3b8",
                border: "1px solid var(--border-color)",
                borderRadius: "8px",
                padding: "0.45rem 0.85rem",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tasks Table */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Sin tareas en esta categoría"
          description="No hay tareas pendientes en este filtro."
          variant="compact"
        />
      ) : (
        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(15,23,42,0.6)", color: "#64748b", borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "0.875rem 1.25rem" }}>Tarea</th>
                  <th style={{ padding: "0.875rem 1.25rem" }}>Categoría</th>
                  <th style={{ padding: "0.875rem 1.25rem" }}>Prioridad</th>
                  <th style={{ padding: "0.875rem 1.25rem" }}>Fecha Límite</th>
                  <th style={{ padding: "0.875rem 1.25rem" }}>Estado</th>
                  <th style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.map((task) => {
                  const badge = getPriorityBadge(task.priority || "medium");
                  const isProcessing = actioningId === task.id;

                  return (
                    <tr key={task.id} style={{ borderBottom: "1px solid var(--border-color)", color: "#f1f5f9" }}>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <div style={{ fontWeight: 600, textDecoration: task.status === "done" ? "line-through" : "none" }}>{task.title}</div>
                        <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>{task.description}</div>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", color: "#1e9bd7", textTransform: "capitalize" }}>{task.category || "general"}</td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <span style={{ background: badge.bg, color: badge.color, padding: "0.15rem 0.5rem", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase" }}>
                          {task.priority}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", color: "#94a3b8" }}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString("es-ES") : "Sin fecha"}
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem" }}>
                        <span style={{ color: task.status === "done" ? "#22c55e" : task.status === "in_progress" ? "#1e9bd7" : "#f59e0b", fontWeight: 600, textTransform: "capitalize" }}>
                          {task.status}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 1.25rem", textAlign: "right" }}>
                        {task.status !== "done" ? (
                          <button
                            onClick={() => handleUpdateStatus(task.id!, "done")}
                            disabled={isProcessing}
                            style={{ background: "rgba(34, 197, 94, 0.12)", color: "#22c55e", border: "1px solid rgba(34, 197, 94, 0.3)", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}
                          >
                            ✓ Completar
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(task.id!, "pending")}
                            disabled={isProcessing}
                            style={{ background: "rgba(148, 163, 184, 0.12)", color: "#94a3b8", border: "1px solid var(--border-color)", padding: "0.3rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", cursor: "pointer" }}
                          >
                            Reabrir
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
