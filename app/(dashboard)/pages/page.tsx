"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  FileText,
  AlertTriangle,
  Database,
  Code,
  Edit3,
  Save,
  Link,
  Info,
} from "lucide-react";
import type { ReplacementType, CorrectionStatus } from "@/lib/types/database";

interface PageItem {
  landingPage: string;
  pagePath: string;
  pageTitle: string;
  views: number;
  users: number;
  sessions: number;
  engaged: number;
  duration: number;
  keyEvents: number;
  revenue: number;
  engagementRate: number;
  avgDuration: number;
}

interface Confirmed404Item {
  pagePath: string;
  landingPage: string;
  pageTitle: string;
  sessions: number;
  users: number;
  views: number;
  landingSessions: number;
  source: string;
  medium: string;
  campaign: string;
  country: string;
  engagementRate: number;
  keyEvents: number;
  lastDetectedDate: string;
  priority: "Alta" | "Media" | "Baja";
  classificationStatus: string;
  // Managed fields
  replacementUrl: string;
  replacementType: ReplacementType;
  verifiedHttpStatus: number;
  correctionStatus: CorrectionStatus;
  notes: string;
  assignedTo: string;
  verifiedAt?: string | null;
}

interface PagesResponse {
  success: boolean;
  period: string;
  pages: PageItem[];
  confirmed404Pages: Confirmed404Item[];
  probableSources404: { name: string; riskLevel: string; description: string }[];
  gtmImplementationGuide: {
    eventName: string;
    gtmScript: string;
    requiredParameters: string[];
    note: string;
  };
}

function PagesContent() {
  const searchParams = useSearchParams();
  const period = searchParams.get("period") || "30d";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PagesResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingPath, setEditingPath] = useState<string | null>(null);
  const [savingPath, setSavingPath] = useState<string | null>(null);

  // Edit form state
  const [editForm, setEditForm] = useState<{
    replacementUrl: string;
    replacementType: ReplacementType;
    verifiedHttpStatus: number;
    correctionStatus: CorrectionStatus;
    notes: string;
    assignedTo: string;
  }>({
    replacementUrl: "",
    replacementType: "unknown",
    verifiedHttpStatus: 404,
    correctionStatus: "pending_review",
    notes: "",
    assignedTo: "",
  });

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/analytics/pages?period=${period}`);
        const json = await res.json();
        if (isMounted) {
          if (!res.ok || !json.success) {
            setError(json.message || "Error consultando datos de páginas");
          } else {
            setData(json);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Error de red al consultar páginas");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [period]);

  const handleStartEdit = (item: Confirmed404Item) => {
    setEditingPath(item.pagePath);
    setEditForm({
      replacementUrl: item.replacementUrl || "",
      replacementType: item.replacementType || "unknown",
      verifiedHttpStatus: item.verifiedHttpStatus || 404,
      correctionStatus: item.correctionStatus || "pending_review",
      notes: item.notes || "",
      assignedTo: item.assignedTo || "",
    });
  };

  const handleSaveCorrection = async (pagePath: string) => {
    setSavingPath(pagePath);
    try {
      const res = await fetch("/api/analytics/pages/404", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page_path: pagePath,
          replacement_url: editForm.replacementUrl,
          replacement_type: editForm.replacementType,
          verified_http_status: editForm.verifiedHttpStatus,
          correction_status: editForm.correctionStatus,
          notes: editForm.notes,
          assigned_to: editForm.assignedTo,
        }),
      });

      if (res.ok) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            confirmed404Pages: prev.confirmed404Pages.map((p) =>
              p.pagePath === pagePath
                ? {
                    ...p,
                    replacementUrl: editForm.replacementUrl,
                    replacementType: editForm.replacementType,
                    verifiedHttpStatus: editForm.verifiedHttpStatus,
                    correctionStatus: editForm.correctionStatus,
                    notes: editForm.notes,
                    assignedTo: editForm.assignedTo,
                  }
                : p
            ),
          };
        });
        setEditingPath(null);
      }
    } catch {
      window.alert("Error al guardar la corrección de la URL 404");
    } finally {
      setSavingPath(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", gap: "1rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
        <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>Cargando métricas de páginas y auditoría 404 desde Supabase...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        icon={Database}
        title="Sin datos de páginas"
        description={error || "Verifica la sincronización de GA4 hacia Supabase."}
        variant="default"
      />
    );
  }

  const { pages, confirmed404Pages, probableSources404, gtmImplementationGuide } = data;
  const zeroEventHighTraffic = pages.filter((p) => p.sessions >= 50 && p.keyEvents === 0);

  return (
    <>
      <SectionHeader
        title="Rendimiento de Páginas y Auditoría de URLs 404"
        description="Métricas de Landing Pages, diagnóstico de errores HTTP 404 confirmados y gestión de redirecciones"
      />

      {/* Zero Event High Traffic Alert Banner */}
      {zeroEventHighTraffic.length > 0 && (
        <div style={{ background: "rgba(239, 68, 68, 0.06)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "10px", padding: "1.25rem", display: "flex", gap: "0.85rem", alignItems: "flex-start" }}>
          <AlertTriangle size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
          <div>
            <div style={{ fontWeight: 700, color: "#ef4444", fontSize: "0.9rem" }}>
              Páginas de Destino con Alto Tráfico y Cero Conversiones ({zeroEventHighTraffic.length})
            </div>
            <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.35rem", lineHeight: 1.6 }}>
              Se detectaron páginas con más de 50 sesiones que no han registrado ningún Key Event en el periodo seleccionado.
            </div>
          </div>
        </div>
      )}

      {/* 1. SECCIÓN PRIORITARIA: URLs 404 CONFIRMADAS (Requisitos 1, 2, 3, 4, 5, 6, 7) */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertTriangle size={20} color="#ef4444" />
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
              URLs 404 Confirmadas ({confirmed404Pages.length})
            </h3>
          </div>
          <span style={{ fontSize: "0.75rem", color: "#ef4444", background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "0.25rem 0.6rem", borderRadius: "6px", fontWeight: 700 }}>
            HTTP Status 404 Real Confirmado
          </span>
        </div>

        {/* Technical Guidelines Card */}
        <div style={{ background: "rgba(30, 155, 215, 0.08)", border: "1px solid rgba(30, 155, 215, 0.25)", borderRadius: "8px", padding: "1rem", fontSize: "0.8rem", color: "#cbd5e1" }}>
          <strong style={{ color: "#1e9bd7" }}>Criterios de Redirección Sugeridos:</strong>
          <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.2rem", lineHeight: 1.5 }}>
            <li><strong>Mismo Producto:</strong> Redirección HTTP 301 al nuevo producto.</li>
            <li><strong>Producto Sustituto:</strong> Redirección HTTP 301 al equivalente relevante.</li>
            <li><strong>Categoría Relevante:</strong> Redirección HTTP 301 a la categoría correspondiente.</li>
            <li><strong>Sin Reemplazo:</strong> Mantener 404 o evaluar código HTTP 410 (Gone).</li>
          </ul>
          <div style={{ marginTop: "0.5rem", color: "#ef4444", fontWeight: 700, fontSize: "0.75rem" }}>
            ⚠️ REGLA CRÍTICA: NUNCA redirigir masivamente todas las URLs 404 a la portada (/).
          </div>
        </div>

        {/* 404 Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.6)", color: "#64748b", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "0.75rem 1rem" }}>Página 404 / Path</th>
                <th style={{ padding: "0.75rem 1rem" }}>Sesiones</th>
                <th style={{ padding: "0.75rem 1rem" }}>Vistas</th>
                <th style={{ padding: "0.75rem 1rem" }}>Fuente / Medio</th>
                <th style={{ padding: "0.75rem 1rem" }}>Prioridad</th>
                <th style={{ padding: "0.75rem 1rem" }}>Tipo Reemplazo</th>
                <th style={{ padding: "0.75rem 1rem" }}>Estado Corrección</th>
                <th style={{ padding: "0.75rem 1rem" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {confirmed404Pages.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>
                    No se han detectado URLs 404 confirmadas en el período seleccionado.
                  </td>
                </tr>
              ) : (
                confirmed404Pages.map((item) => {
                  const isEditing = editingPath === item.pagePath;
                  const isSaving = savingPath === item.pagePath;

                  return (
                    <React.Fragment key={item.pagePath}>
                      <tr style={{ borderBottom: "1px solid var(--border-color)", color: "#f1f5f9" }}>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <div style={{ fontWeight: 700, color: "#ef4444" }}>{item.pagePath}</div>
                          <div style={{ fontSize: "0.7rem", color: "#64748b" }}>{item.pageTitle}</div>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600 }}>{item.sessions.toLocaleString()}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>{item.views.toLocaleString()}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#1e9bd7" }}>
                          {item.source} / {item.medium}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span
                            style={{
                              background: item.priority === "Alta" ? "rgba(239, 68, 68, 0.15)" : item.priority === "Media" ? "rgba(245, 158, 11, 0.15)" : "rgba(148, 163, 184, 0.15)",
                              color: item.priority === "Alta" ? "#ef4444" : item.priority === "Media" ? "#f59e0b" : "#94a3b8",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                            }}
                          >
                            {item.priority}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem", fontSize: "0.75rem", textTransform: "capitalize" }}>
                          {item.replacementType.replace("_", " ")}
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span
                            style={{
                              background: item.correctionStatus === "resolved" ? "rgba(34, 197, 94, 0.12)" : "rgba(30, 155, 215, 0.12)",
                              color: item.correctionStatus === "resolved" ? "#22c55e" : "#1e9bd7",
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                              fontWeight: 600,
                              fontSize: "0.725rem",
                            }}
                          >
                            {item.correctionStatus}
                          </span>
                        </td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <button
                            onClick={() => (isEditing ? setEditingPath(null) : handleStartEdit(item))}
                            style={{
                              background: isEditing ? "rgba(148, 163, 184, 0.2)" : "rgba(30, 155, 215, 0.12)",
                              color: isEditing ? "#94a3b8" : "#1e9bd7",
                              border: "1px solid var(--border-color)",
                              padding: "0.25rem 0.5rem",
                              borderRadius: "6px",
                              fontSize: "0.725rem",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                            }}
                          >
                            <Edit3 size={12} />
                            {isEditing ? "Cerrar" : "Gestionar"}
                          </button>
                        </td>
                      </tr>

                      {/* Inline Management Row */}
                      {isEditing && (
                        <tr style={{ background: "rgba(15, 23, 42, 0.9)", borderBottom: "2px solid #1e9bd7" }}>
                          <td colSpan={8} style={{ padding: "1.25rem" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
                              <div>
                                <label style={{ display: "block", fontSize: "0.725rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                                  URL de Reemplazo / Redirección 301
                                </label>
                                <input
                                  type="text"
                                  placeholder="https://industrialdepot.com/nuevo-producto"
                                  value={editForm.replacementUrl}
                                  onChange={(e) => setEditForm({ ...editForm, replacementUrl: e.target.value })}
                                  style={{ width: "100%", background: "#0f172a", border: "1px solid var(--border-color)", color: "#f1f5f9", padding: "0.4rem", borderRadius: "6px", fontSize: "0.8rem" }}
                                />
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: "0.725rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                                  Tipo de Reemplazo
                                </label>
                                <select
                                  value={editForm.replacementType}
                                  onChange={(e) => setEditForm({ ...editForm, replacementType: e.target.value as ReplacementType })}
                                  style={{ width: "100%", background: "#0f172a", border: "1px solid var(--border-color)", color: "#f1f5f9", padding: "0.4rem", borderRadius: "6px", fontSize: "0.8rem" }}
                                >
                                  <option value="same_product">Mismo producto (same_product)</option>
                                  <option value="equivalent_product">Producto equivalente (equivalent_product)</option>
                                  <option value="relevant_category">Categoría relevante (relevant_category)</option>
                                  <option value="no_replacement">Sin reemplazo (no_replacement)</option>
                                  <option value="unknown">Desconocido (unknown)</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: "0.725rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                                  Estado HTTP Verificado
                                </label>
                                <select
                                  value={editForm.verifiedHttpStatus}
                                  onChange={(e) => setEditForm({ ...editForm, verifiedHttpStatus: Number(e.target.value) })}
                                  style={{ width: "100%", background: "#0f172a", border: "1px solid var(--border-color)", color: "#f1f5f9", padding: "0.4rem", borderRadius: "6px", fontSize: "0.8rem" }}
                                >
                                  <option value={404}>404 (Not Found)</option>
                                  <option value={410}>410 (Gone)</option>
                                  <option value={301}>301 (Moved Permanently)</option>
                                  <option value={200}>200 (OK - Resuelto)</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: "0.725rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                                  Estado de Corrección
                                </label>
                                <select
                                  value={editForm.correctionStatus}
                                  onChange={(e) => setEditForm({ ...editForm, correctionStatus: e.target.value as CorrectionStatus })}
                                  style={{ width: "100%", background: "#0f172a", border: "1px solid var(--border-color)", color: "#f1f5f9", padding: "0.4rem", borderRadius: "6px", fontSize: "0.8rem" }}
                                >
                                  <option value="pending_review">Revisión pendiente (pending_review)</option>
                                  <option value="redirect_required">Redirección requerida 301 (redirect_required)</option>
                                  <option value="link_correction_required">Corregir enlace interno (link_correction_required)</option>
                                  <option value="keep_404">Mantener 404 (keep_404)</option>
                                  <option value="use_410">Usar 410 Gone (use_410)</option>
                                  <option value="resolved">Resuelto (resolved)</option>
                                </select>
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: "0.725rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                                  Asignado A / Notas
                                </label>
                                <input
                                  type="text"
                                  placeholder="Asignado a... / Notas técnicas"
                                  value={editForm.notes}
                                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                  style={{ width: "100%", background: "#0f172a", border: "1px solid var(--border-color)", color: "#f1f5f9", padding: "0.4rem", borderRadius: "6px", fontSize: "0.8rem" }}
                                />
                              </div>
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "1rem" }}>
                              <button
                                onClick={() => handleSaveCorrection(item.pagePath)}
                                disabled={isSaving}
                                style={{
                                  background: "linear-gradient(135deg, #1e9bd7, #1578a8)",
                                  color: "#ffffff",
                                  border: "none",
                                  padding: "0.45rem 1rem",
                                  borderRadius: "6px",
                                  fontSize: "0.775rem",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "0.35rem",
                                }}
                              >
                                <Save size={14} /> {isSaving ? "Guardando en Supabase..." : "Guardar Corrección"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. SECCIÓN: FUENTES PROBABLES DEL TRÁFICO 404 (Requisito 12) */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
          <Link size={18} color="#1e9bd7" />
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Fuentes Probables de Tráfico Hacia URLs 404
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "0.875rem" }}>
          {probableSources404.map((src, idx) => (
            <div key={idx} style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "0.875rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#f1f5f9" }}>{src.name}</span>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, color: src.riskLevel === "Crítico" ? "#ef4444" : src.riskLevel === "Alto" ? "#f59e0b" : "#94a3b8" }}>
                  [{src.riskLevel}]
                </span>
              </div>
              <p style={{ fontSize: "0.78rem", color: "#94a3b8", margin: "0.35rem 0 0", lineHeight: 1.4 }}>
                {src.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SECCIÓN: GUÍA TÉCNICA GTM EVENTO `page_not_found` (Requisitos 13, 14, 15) */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <Code size={18} color="#1e9bd7" />
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#f1f5f9", margin: 0 }}>
            Recomendación Técnica: Evento GTM `page_not_found`
          </h3>
        </div>

        <p style={{ fontSize: "0.825rem", color: "#cbd5e1", lineHeight: 1.5, margin: 0 }}>
          Para capturar en tiempo real las peticiones que resultan en 404 en el servidor, se recomienda disparar el evento personalizado mediante la dataLayer de Google Tag Manager:
        </p>

        <pre
          style={{
            background: "#090d16",
            border: "1px solid var(--border-color)",
            borderRadius: "8px",
            padding: "1rem",
            color: "#38bdf8",
            fontSize: "0.775rem",
            overflowX: "auto",
            marginTop: "0.75rem",
          }}
        >
          {gtmImplementationGuide.gtmScript}
        </pre>

        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginTop: "0.75rem", fontSize: "0.78rem", color: "#f59e0b" }}>
          <Info size={16} color="#f59e0b" />
          <span>{gtmImplementationGuide.note}</span>
        </div>
      </div>

      {/* General Landing Pages Table */}
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <FileText size={18} color="#1e9bd7" />
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>Todas las Páginas de Destino</h3>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.825rem", textAlign: "left" }}>
            <thead>
              <tr style={{ background: "rgba(15,23,42,0.6)", color: "#64748b", borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "0.875rem 1.25rem" }}>Landing Page</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Vistas</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Usuarios</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Sesiones</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Engagement %</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Key Events</th>
                <th style={{ padding: "0.875rem 1.25rem" }}>Estado Conversión</th>
              </tr>
            </thead>
            <tbody>
              {pages.slice(0, 15).map((p, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border-color)", color: "#f1f5f9" }}>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    <div style={{ fontWeight: 600, color: p.landingPage.includes("(not set)") ? "#ef4444" : "#f1f5f9" }}>{p.landingPage}</div>
                    <div style={{ fontSize: "0.725rem", color: "#64748b" }}>{p.pageTitle !== "(not set)" ? p.pageTitle : p.pagePath}</div>
                  </td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{p.views.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{p.users.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{p.sessions.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>{(p.engagementRate * 100).toFixed(1)}%</td>
                  <td style={{ padding: "0.875rem 1.25rem", color: "#22c55e", fontWeight: 700 }}>{p.keyEvents.toLocaleString()}</td>
                  <td style={{ padding: "0.875rem 1.25rem" }}>
                    {p.sessions >= 50 && p.keyEvents === 0 ? (
                      <span style={{ color: "#ef4444", fontWeight: 600, fontSize: "0.75rem" }}>⚠️ Sin conversiones</span>
                    ) : p.keyEvents > 0 ? (
                      <span style={{ color: "#22c55e", fontWeight: 600, fontSize: "0.75rem" }}>✓ Convierte</span>
                    ) : (
                      <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Volumen bajo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

export default function PagesPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <LoadingSpinner size={32} color="#1e9bd7" />
      </div>
    }>
      <PagesContent />
    </Suspense>
  );
}
