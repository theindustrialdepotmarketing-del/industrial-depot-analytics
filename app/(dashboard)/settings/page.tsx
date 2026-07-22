"use client";

import React, { useState, useEffect } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { TestGA4Response } from "@/lib/types/analytics";
import type { TestSupabaseResponse, SyncResult, BackfillResponse } from "@/lib/types/database";
import {
  Database,
  BarChart3,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
  Play,
  AlertCircle,
  Info,
  RefreshCw,
  History,
  DownloadCloud,
  Activity,
  Zap,
} from "lucide-react";

function SettingSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border-color)",
        borderRadius: "12px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <Icon size={18} color="#1e9bd7" />
        <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>
          {title}
        </h2>
      </div>
      <div
        style={{
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.25rem",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SettingRow({
  label,
  desc,
  value,
  connected,
}: {
  label: string;
  desc?: string;
  value?: string;
  connected?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#94a3b8" }}>{label}</div>
        {desc && (
          <div style={{ fontSize: "0.775rem", color: "#475569", marginTop: "0.15rem" }}>
            {desc}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
        {connected !== undefined &&
          (connected ? (
            <CheckCircle2 size={16} color="#22c55e" />
          ) : (
            <XCircle size={16} color="#ef4444" />
          ))}
        {value && (
          <span
            style={{
              fontSize: "0.8rem",
              color: "#64748b",
              background: "rgba(30,41,59,0.8)",
              padding: "0.25rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid var(--border-color)",
              fontFamily: "monospace",
            }}
          >
            {value}
          </span>
        )}
        {connected !== undefined && (
          <span
            style={{
              fontSize: "0.78rem",
              color: connected ? "#22c55e" : "#ef4444",
              fontWeight: 600,
            }}
          >
            {connected ? "Conectado" : "Sin conectar"}
          </span>
        )}
      </div>
    </div>
  );
}

interface AnalysisRunResult {
  success: boolean;
  period: string;
  healthScore: { totalScore: number; status: string; color: string };
  findingsCount: number;
  campaignsAnalyzed: number;
  message: string;
  timestamp: string;
}

export default function SettingsPage() {
  // GA4 test state
  const [testingGa4, setTestingGa4] = useState(false);
  const [ga4Result, setGa4Result] = useState<TestGA4Response | null>(null);
  const [ga4Error, setGa4Error] = useState<string | null>(null);

  // Supabase test state
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseResult, setSupabaseResult] = useState<TestSupabaseResponse | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Daily Sync state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);

  // Historical Backfill state
  const [selectedDays, setSelectedDays] = useState<30 | 60 | 90 | 180>(90);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillResult, setBackfillResult] = useState<BackfillResponse | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Diagnostic Engine Run State
  const [runningAnalysis, setRunningAnalysis] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisRunResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Dynamic connection states
  const isGa4Connected = Boolean(ga4Result?.success && !ga4Result?.isLocalEnv);
  const isSupabaseConnected = Boolean(
    supabaseResult?.success && supabaseResult?.databaseConnected
  );
  const isSyncConnected = Boolean(syncResult?.success);

  // Fetch initial backfill status cleanly
  useEffect(() => {
    let isMounted = true;
    async function loadStatus() {
      try {
        const res = await fetch("/api/sync/backfill");
        if (res.ok && isMounted) {
          const data: BackfillResponse = await res.json();
          if (data.success && data.progress) {
            setBackfillResult(data);
          }
        }
      } catch {
        // Suppress background status check errors
      }
    }
    loadStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleTestGa4Connection = async () => {
    setTestingGa4(true);
    setGa4Error(null);

    try {
      const res = await fetch("/api/analytics/test");
      const data = await res.json();

      if (!res.ok && !data.isLocalEnv) {
        setGa4Error(data.message || `Error consultando GA4 (${res.status})`);
        setGa4Result(null);
      } else {
        setGa4Result(data);
        if (!data.success && !data.isLocalEnv) {
          setGa4Result(null);
        }
      }
    } catch (err: unknown) {
      setGa4Error(
        err instanceof Error
          ? err.message
          : "Error de red al intentar conectar con el servidor"
      );
      setGa4Result(null);
    } finally {
      setTestingGa4(false);
    }
  };

  const handleTestSupabaseConnection = async () => {
    setTestingSupabase(true);
    setSupabaseError(null);

    try {
      const res = await fetch("/api/supabase/test");
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSupabaseError(data.message || `Error consultando Supabase (${res.status})`);
        setSupabaseResult(null);
      } else {
        setSupabaseResult(data);
      }
    } catch (err: unknown) {
      setSupabaseError(
        err instanceof Error
          ? err.message
          : "Error de red al intentar conectar con Supabase"
      );
      setSupabaseResult(null);
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleManualSync = async () => {
    setSyncing(true);

    try {
      const res = await fetch("/api/analytics/sync", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSyncResult(null);
      } else {
        setSyncResult(data);
      }
    } catch {
      setSyncResult(null);
    } finally {
      setSyncing(false);
    }
  };

  // Automated step-by-step backfill loop
  const executeBackfillLoop = async (
    days: 30 | 60 | 90 | 180,
    initialAction: "start" | "continue"
  ) => {
    setBackfilling(true);

    let currentAction = initialAction;
    let hasMore = true;

    try {
      while (hasMore) {
        const res = await fetch("/api/sync/backfill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ days, action: currentAction }),
        });

        const data: BackfillResponse = await res.json();

        if (!res.ok || !data.success) {
          break;
        }

        setBackfillResult(data);
        hasMore = data.hasMoreChunks;
        currentAction = "continue";

        if (hasMore) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } catch {
      // Suppress backfill loop error
    } finally {
      setBackfilling(false);
      setShowConfirmModal(false);
    }
  };

  const startBackfillProcess = () => {
    setShowConfirmModal(false);
    executeBackfillLoop(selectedDays, "start");
  };

  const continueBackfillProcess = () => {
    executeBackfillLoop(selectedDays, "continue");
  };

  // Run Diagnostic Analysis Engine
  const handleRunAnalysis = async () => {
    setRunningAnalysis(true);
    setAnalysisError(null);

    try {
      const res = await fetch("/api/analysis/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ period: "30d" }),
      });

      const data: AnalysisRunResult = await res.json();

      if (!res.ok || !data.success) {
        setAnalysisError(data.message || `Error ejecutando análisis (${res.status})`);
        setAnalysisResult(null);
      } else {
        setAnalysisResult(data);
      }
    } catch (err: unknown) {
      setAnalysisError(
        err instanceof Error
          ? err.message
          : "Error de red al ejecutar el análisis de diagnóstico"
      );
      setAnalysisResult(null);
    } finally {
      setRunningAnalysis(false);
    }
  };

  return (
    <>
      <SectionHeader
        title="Configuración"
        description="Gestión de integraciones, credenciales y preferencias del dashboard"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "760px" }}>
        {/* Diagnostic Analysis Trigger Section */}
        <SettingSection title="Motor de Diagnóstico y Análisis" icon={Activity}>
          <SettingRow
            label="Análisis determinístico"
            desc="Evalúa tráfico, conversiones, atribución, páginas y dispositivos para generar alertas y recomendaciones en Supabase"
            connected={Boolean(analysisResult?.success)}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <div>
              <button
                onClick={handleRunAnalysis}
                disabled={runningAnalysis || backfilling}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                {runningAnalysis ? (
                  <>
                    <LoadingSpinner size={16} color="#ffffff" />
                    Ejecutando análisis determinístico...
                  </>
                ) : (
                  <>
                    <Zap size={15} />
                    Ejecutar análisis ahora
                  </>
                )}
              </button>
            </div>

            {/* Analysis Error */}
            {analysisError && (
              <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)", borderRadius: "8px", padding: "1rem" }}>
                <div style={{ fontWeight: 600, color: "#ef4444", fontSize: "0.85rem" }}>Error en el Análisis</div>
                <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.25rem" }}>{analysisError}</div>
              </div>
            )}

            {/* Analysis Success Result */}
            {analysisResult && analysisResult.success && (
              <div style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.25)", borderRadius: "10px", padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={18} color="#22c55e" />
                  <span style={{ fontWeight: 700, color: "#22c55e", fontSize: "0.9rem" }}>
                    {analysisResult.message}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", fontSize: "0.8rem" }}>
                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Período Analizado</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>{analysisResult.period}</div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Health Score</div>
                    <div style={{ color: analysisResult.healthScore.color, fontWeight: 800, marginTop: "0.2rem" }}>
                      {analysisResult.healthScore.totalScore} / 100 ({analysisResult.healthScore.status})
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Hallazgos Generados</div>
                    <div style={{ color: "#1e9bd7", fontWeight: 700, marginTop: "0.2rem" }}>{analysisResult.findingsCount} alertas/recomendaciones</div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Campañas Evaluadas</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>{analysisResult.campaignsAnalyzed} campañas</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SettingSection>

        {/* GA4 Integration Section */}
        <SettingSection title="Google Analytics 4" icon={BarChart3}>
          <SettingRow
            label="Propiedad GA4"
            desc="ID de la propiedad de Google Analytics 4"
            value="properties/502218884"
            connected={isGa4Connected}
          />
          <SettingRow
            label="Autenticación"
            desc="Vercel OIDC + Google Workload Identity Federation (WIF)"
            value="Pool: vercel"
            connected={isGa4Connected}
          />
          <SettingRow
            label="Service Account"
            desc="Cuenta de servicio impersonada"
            value="ga4-dashboard-reader@..."
            connected={isGa4Connected}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <div>
              <button
                onClick={handleTestGa4Connection}
                disabled={testingGa4 || backfilling}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                {testingGa4 ? (
                  <>
                    <LoadingSpinner size={16} color="#ffffff" />
                    Probando conexión con GA4...
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    Probar conexión con GA4
                  </>
                )}
              </button>
            </div>

            {/* GA4 Test Error display */}
            {ga4Error && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "8px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "#ef4444", fontSize: "0.85rem" }}>
                      Error en la prueba de conexión GA4
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.25rem", lineHeight: 1.5 }}>
                      {ga4Error}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* GA4 Test Result display */}
            {ga4Result && ga4Result.isLocalEnv && (
              <div
                style={{
                  background: "rgba(30, 155, 215, 0.08)",
                  border: "1px solid rgba(30, 155, 215, 0.25)",
                  borderRadius: "8px",
                  padding: "1rem",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                }}
              >
                <Info size={18} color="#1e9bd7" style={{ flexShrink: 0, marginTop: "2px" }} />
                <div>
                  <div style={{ fontWeight: 600, color: "#1e9bd7", fontSize: "0.85rem" }}>
                    Entorno Local Detectado
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.25rem", lineHeight: 1.6 }}>
                    {ga4Result.message ||
                      "La prueba de autenticación OIDC + Workload Identity Federation debe ejecutarse desde un deployment en Vercel. En desarrollo local no existe token OIDC activo."}
                  </div>
                </div>
              </div>
            )}

            {ga4Result && ga4Result.success && !ga4Result.isLocalEnv && (
              <div
                style={{
                  background: "rgba(34, 197, 94, 0.08)",
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                  borderRadius: "8px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={18} color="#22c55e" />
                  <span style={{ fontWeight: 700, color: "#22c55e", fontSize: "0.9rem" }}>
                    ¡Conexión Exitosa con Google Analytics 4!
                  </span>
                </div>
              </div>
            )}
          </div>
        </SettingSection>

        {/* Supabase Section */}
        <SettingSection title="Supabase" icon={Database}>
          <SettingRow
            label="Proyecto Supabase"
            desc="Base de datos para métricas, empresas, alertas y tareas"
            value={supabaseResult?.companyName ? `Empresa: ${supabaseResult.companyName}` : "Base de datos"}
            connected={isSupabaseConnected}
          />
          <SettingRow
            label="Secret Key / Key Administrativa"
            desc="Autenticación server-only segura (SUPABASE_SECRET_KEY)"
            connected={isSupabaseConnected}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <div>
              <button
                onClick={handleTestSupabaseConnection}
                disabled={testingSupabase || backfilling}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                {testingSupabase ? (
                  <>
                    <LoadingSpinner size={16} color="#ffffff" />
                    Probando conexión con Supabase...
                  </>
                ) : (
                  <>
                    <Play size={15} />
                    Probar conexión con Supabase
                  </>
                )}
              </button>
            </div>

            {/* Supabase Error display */}
            {supabaseError && (
              <div
                style={{
                  background: "rgba(239, 68, 68, 0.08)",
                  border: "1px solid rgba(239, 68, 68, 0.25)",
                  borderRadius: "8px",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: 600, color: "#ef4444", fontSize: "0.85rem" }}>
                      Error en la prueba de conexión Supabase
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.25rem", lineHeight: 1.5 }}>
                      {supabaseError}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Supabase Result display */}
            {supabaseResult && supabaseResult.success && (
              <div
                style={{
                  background: "rgba(34, 197, 94, 0.08)",
                  border: "1px solid rgba(34, 197, 94, 0.25)",
                  borderRadius: "8px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <CheckCircle2 size={18} color="#22c55e" />
                  <span style={{ fontWeight: 700, color: "#22c55e", fontSize: "0.9rem" }}>
                    Conexión exitosa con Supabase
                  </span>
                </div>
              </div>
            )}
          </div>
        </SettingSection>

        {/* Automatic Daily Sync Section */}
        <SettingSection title="Sincronización automática" icon={Clock}>
          <SettingRow
            label="Cron diario"
            desc="Ejecuta /api/cron/daily a las 11:00 AM UTC todos los días"
            connected={isSyncConnected}
          />
          <SettingRow
            label="CRON_SECRET"
            desc="Secreto de autorización para Vercel Cron"
            connected={isSyncConnected}
          />
          <SettingRow
            label="Sincronización manual"
            desc="Transfiere métricas diarias, campañas, páginas y audiencias a Supabase"
            value={syncResult?.completedAt ? new Date(syncResult.completedAt).toLocaleString("es-ES") : undefined}
            connected={isSyncConnected}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <div>
              <button
                onClick={handleManualSync}
                disabled={syncing || backfilling}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                {syncing ? (
                  <>
                    <LoadingSpinner size={16} color="#ffffff" />
                    Sincronizando datos de GA4 hacia Supabase...
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    Ejecutar sincronización ahora
                  </>
                )}
              </button>
            </div>
          </div>
        </SettingSection>

        {/* Historical Backfill Section */}
        <SettingSection title="Carga histórica" icon={History}>
          <SettingRow
            label="Procesamiento por bloques"
            desc="Carga datos en bloques de 7 días para evitar límites de tiempo y garantizar la recuperabilidad"
            value="Bloques de 7 días"
            connected={backfillResult?.status === "success"}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              paddingTop: "0.5rem",
              borderTop: "1px solid var(--border-color)",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                <label style={{ fontSize: "0.78rem", color: "#94a3b8", fontWeight: 500 }}>
                  Período a importar:
                </label>
                <select
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(Number(e.target.value) as 30 | 60 | 90 | 180)}
                  disabled={backfilling}
                  style={{
                    background: "#0f172a",
                    color: "#f1f5f9",
                    border: "1px solid var(--border-color)",
                    borderRadius: "8px",
                    padding: "0.5rem 1rem",
                    fontSize: "0.85rem",
                    outline: "none",
                    cursor: backfilling ? "not-allowed" : "pointer",
                  }}
                >
                  <option value={30}>Últimos 30 días</option>
                  <option value={60}>Últimos 60 días</option>
                  <option value={90}>Últimos 90 días</option>
                  <option value={180}>Últimos 180 días</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "flex-end", gap: "0.75rem", flex: 1, paddingTop: "1.25rem" }}>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  disabled={backfilling}
                  className="btn-primary"
                  style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
                >
                  {backfilling ? (
                    <>
                      <LoadingSpinner size={16} color="#ffffff" />
                      Cargando historial ({backfillResult?.progress?.percent || 0}%)...
                    </>
                  ) : (
                    <>
                      <DownloadCloud size={16} />
                      Cargar historial
                    </>
                  )}
                </button>

                {backfillResult?.hasMoreChunks && !backfilling && (
                  <button
                    onClick={continueBackfillProcess}
                    style={{
                      background: "rgba(30, 155, 215, 0.15)",
                      color: "#1e9bd7",
                      border: "1px solid rgba(30, 155, 215, 0.4)",
                      padding: "0.55rem 1.1rem",
                      borderRadius: "8px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                  >
                    <RefreshCw size={15} />
                    Continuar carga
                  </button>
                )}
              </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirmModal && (
              <div
                style={{
                  background: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(30, 155, 215, 0.4)",
                  borderRadius: "10px",
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                  <Info size={20} color="#1e9bd7" style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: "0.9rem" }}>
                      Confirmar Carga Histórica de {selectedDays} días
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.35rem", lineHeight: 1.6 }}>
                      Se procesará el historial desde los últimos <strong>{selectedDays} días</strong> hasta ayer en bloques de 7 días.
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.25rem" }}>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    style={{
                      background: "transparent",
                      color: "#94a3b8",
                      border: "1px solid var(--border-color)",
                      padding: "0.45rem 1rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={startBackfillProcess}
                    className="btn-primary"
                    style={{ fontSize: "0.8rem", padding: "0.45rem 1.25rem" }}
                  >
                    Confirmar e Iniciar
                  </button>
                </div>
              </div>
            )}
          </div>
        </SettingSection>

        {/* Security */}
        <SettingSection title="Seguridad" icon={Shield}>
          <SettingRow
            label="Autenticación admin"
            desc="Credenciales de acceso al dashboard"
            connected={false}
          />
          <SettingRow
            label="NEXTAUTH_SECRET"
            desc="Clave de sesión JWT"
            connected={false}
          />
        </SettingSection>
      </div>
    </>
  );
}
