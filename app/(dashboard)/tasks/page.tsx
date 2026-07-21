"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CheckSquare, Plus, Calendar } from "lucide-react";

type TaskStatus = "pending" | "in_progress" | "done";
type TaskPriority = "low" | "medium" | "high" | "critical";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
}

const PRIORITY_COLOR: Record<TaskPriority, string> = {
  critical: "#dc2626",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#64748b",
};

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending: "Pendiente",
  in_progress: "En proceso",
  done: "Completada",
};

const SAMPLE_TASKS: Task[] = []; // Empty initially

export default function TasksPage() {
  const [filter, setFilter] = useState<TaskStatus | "all">("all");

  const filtered = SAMPLE_TASKS.filter((t) => filter === "all" || t.status === filter);

  return (
    <>
      <SectionHeader
        title="Tareas"
        description="Seguimiento de tareas de optimización y acciones pendientes"
      >
        <button className="btn-primary" style={{ gap: "0.5rem" }}>
          <Plus size={16} />
          Nueva tarea
        </button>
      </SectionHeader>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.5rem" }}>
        {(["all", "pending", "in_progress", "done"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "8px",
              border: "1px solid var(--border-color)",
              background: filter === s ? "rgba(30,155,215,0.1)" : "transparent",
              color: filter === s ? "#1e9bd7" : "#64748b",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {s === "all" ? "Todas" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Tasks */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {filtered.length === 0 ? (
          <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px" }}>
            <EmptyState
              icon={CheckSquare}
              title="Sin tareas"
              description="Crea tareas de optimización para hacer seguimiento de las acciones de mejora de tu sitio web."
              action={{ label: "Crear primera tarea", onClick: () => {} }}
            />
          </div>
        ) : (
          filtered.map((task) => (
            <div
              key={task.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: "12px",
                padding: "1.25rem",
                display: "flex",
                gap: "1rem",
                alignItems: "flex-start",
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 600, fontSize: "0.875rem", color: "#f1f5f9" }}>{task.title}</span>
                  <span style={{ fontSize: "0.7rem", fontWeight: 700, color: PRIORITY_COLOR[task.priority], padding: "0.1rem 0.5rem", background: `${PRIORITY_COLOR[task.priority]}15`, borderRadius: "4px" }}>
                    {task.priority.toUpperCase()}
                  </span>
                </div>
                {task.description && (
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#64748b" }}>{task.description}</p>
                )}
                {task.dueDate && (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "0.5rem", fontSize: "0.75rem", color: "#475569" }}>
                    <Calendar size={12} />
                    {task.dueDate}
                  </div>
                )}
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", whiteSpace: "nowrap", background: "rgba(30,41,59,0.8)", padding: "0.25rem 0.625rem", borderRadius: "6px", border: "1px solid var(--border-color)" }}>
                {STATUS_LABEL[task.status]}
              </span>
            </div>
          ))
        )}
      </div>
    </>
  );
}
