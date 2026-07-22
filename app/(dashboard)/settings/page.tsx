"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { TestGA4Response } from "@/lib/types/analytics";
import type { TestSupabaseResponse, SyncResult } from "@/lib/types/database";
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

export default function SettingsPage() {
  // GA4 test state
  const [testingGa4, setTestingGa4] = useState(false);
  const [ga4Result, setGa4Result] = useState<TestGA4Response | null>(null);
  const [ga4Error, setGa4Error] = useState<string | null>(null);

  // Supabase test state
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseResult, setSupabaseResult] = useState<TestSupabaseResponse | null>(null);
  const [supabaseError, setSupabaseError] = useState<string | null>(null);

  // Sync test state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Dynamic connection states
  const isGa4Connected = Boolean(ga4Result?.success && !ga4Result?.isLocalEnv);
  const isSupabaseConnected = Boolean(
    supabaseResult?.success && supabaseResult?.databaseConnected
  );
  const isSyncConnected = Boolean(syncResult?.success);

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
    setSyncError(null);

    try {
      const res = await fetch("/api/analytics/sync", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSyncError(data.message || `Error en sincronización manual (${res.status})`);
        setSyncResult(null);
      } else {
        setSyncResult(data);
      }
    } catch (err: unknown) {
      setSyncError(
        err instanceof Error
          ? err.message
          : "Error de red al intentar ejecutar la sincronización manual"
      );
      setSyncResult(null);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <>
      <SectionHeader
        title="Configuración"
        description="Gestión de integraciones, credenciales y preferencias del dashboard"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "760px" }}>
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
                disabled={testingGa4}
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

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    gap: "0.75rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Período</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>
                      {ga4Result.period.description}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Filas Consultadas</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>
                      {ga4Result.rowCount} días
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Usuarios Activos</div>
                    <div style={{ color: "#1e9bd7", fontWeight: 700, marginTop: "0.2rem" }}>
                      {ga4Result.summary.activeUsers.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Nuevos Usuarios</div>
                    <div style={{ color: "#1e9bd7", fontWeight: 700, marginTop: "0.2rem" }}>
                      {ga4Result.summary.newUsers.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Sesiones</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>
                      {ga4Result.summary.sessions.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Key Events</div>
                    <div style={{ color: "#22c55e", fontWeight: 700, marginTop: "0.2rem" }}>
                      {ga4Result.summary.keyEvents.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Safe Diagnostics Block */}
                {ga4Result.diagnostics && (
                  <div
                    style={{
                      background: "rgba(15,23,42,0.8)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "0.75rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    <div style={{ color: "#64748b", fontWeight: 600, marginBottom: "0.35rem" }}>
                      Diagnóstico de Autenticación:
                    </div>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", color: "#94a3b8" }}>
                      <span>
                        OIDC Token:{" "}
                        <strong style={{ color: ga4Result.diagnostics.oidcTokenReceived ? "#22c55e" : "#ef4444" }}>
                          {ga4Result.diagnostics.oidcTokenReceived ? "OK" : "NO"}
                        </strong>
                      </span>
                      <span>
                        Intercambio WIF:{" "}
                        <strong style={{ color: ga4Result.diagnostics.workloadIdentityExchange === "success" ? "#22c55e" : "#ef4444" }}>
                          {ga4Result.diagnostics.workloadIdentityExchange}
                        </strong>
                      </span>
                      <span>
                        Impersonación:{" "}
                        <strong style={{ color: ga4Result.diagnostics.serviceAccountImpersonation === "success" ? "#22c55e" : "#ef4444" }}>
                          {ga4Result.diagnostics.serviceAccountImpersonation}
                        </strong>
                      </span>
                      <span>
                        OAuth Scopes:{" "}
                        <strong style={{ color: ga4Result.diagnostics.analyticsScopeConfigured ? "#22c55e" : "#ef4444" }}>
                          {ga4Result.diagnostics.analyticsScopeConfigured ? "analytics.readonly" : "Falta"}
                        </strong>
                      </span>
                      <span>
                        Consulta GA4:{" "}
                        <strong style={{ color: ga4Result.diagnostics.ga4Query === "success" ? "#22c55e" : "#ef4444" }}>
                          {ga4Result.diagnostics.ga4Query}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
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
                disabled={testingSupabase}
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

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "0.75rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Empresa</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>
                      {supabaseResult.companyName}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Property ID</div>
                    <div style={{ color: "#1e9bd7", fontWeight: 700, marginTop: "0.2rem" }}>
                      {supabaseResult.propertyId}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Zona Horaria</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>
                      {supabaseResult.timezone}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Estado BD</div>
                    <div style={{ color: "#22c55e", fontWeight: 700, marginTop: "0.2rem" }}>
                      Conectado
                    </div>
                  </div>
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
                disabled={syncing}
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

            {/* Sync Error display */}
            {syncError && (
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
                      Error en la sincronización automática
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.25rem", lineHeight: 1.5 }}>
                      {syncError}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sync Result display */}
            {syncResult && syncResult.success && (
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
                    ¡Sincronización Completada Exitosamente!
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "0.75rem",
                    fontSize: "0.8rem",
                  }}
                >
                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Fecha Sincronizada</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>
                      {syncResult.syncedDate} (Día anterior completo)
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Registros Procesados</div>
                    <div style={{ color: "#1e9bd7", fontWeight: 700, marginTop: "0.2rem" }}>
                      {syncResult.recordsProcessed.toLocaleString()} filas
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Estado</div>
                    <div style={{ color: "#22c55e", fontWeight: 700, marginTop: "0.2rem" }}>
                      {syncResult.status}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Última Ejecución</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>
                      {new Date(syncResult.completedAt).toLocaleTimeString("es-ES")}
                    </div>
                  </div>
                </div>

                {/* Details Breakdown */}
                {syncResult.details && (
                  <div
                    style={{
                      background: "rgba(15,23,42,0.8)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "6px",
                      padding: "0.75rem",
                      fontSize: "0.75rem",
                    }}
                  >
                    <div style={{ color: "#64748b", fontWeight: 600, marginBottom: "0.35rem" }}>
                      Desglose de Registros por Tabla:
                    </div>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", color: "#94a3b8" }}>
                      <span>Métricas Diarias: <strong style={{ color: "#f1f5f9" }}>{syncResult.details.dailyMetrics}</strong></span>
                      <span>Campañas: <strong style={{ color: "#f1f5f9" }}>{syncResult.details.campaignMetrics}</strong></span>
                      <span>Páginas: <strong style={{ color: "#f1f5f9" }}>{syncResult.details.pageMetrics}</strong></span>
                      <span>Audiencias: <strong style={{ color: "#f1f5f9" }}>{syncResult.details.audienceMetrics}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.7, marginTop: "0.5rem" }}>
            Configurado en <code style={{ color: "#1e9bd7" }}>vercel.json</code>:
            <pre
              style={{
                background: "#0a0f1e",
                border: "1px solid var(--border-color)",
                borderRadius: "6px",
                padding: "0.75rem",
                marginTop: "0.5rem",
                overflow: "auto",
                color: "#94a3b8",
                fontSize: "0.75rem",
              }}
            >
              {`{\n  "crons": [{\n    "path": "/api/cron/daily",\n    "schedule": "0 11 * * *"\n  }]\n}`}
            </pre>
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
          <div
            style={{
              background: "rgba(239,68,68,0.06)",
              border: "1px solid rgba(239,68,68,0.15)",
              borderRadius: "8px",
              padding: "1rem",
              fontSize: "0.78rem",
              color: "#94a3b8",
              lineHeight: 1.7,
            }}
          >
            ⚠️ Configura todas las variables de entorno en{" "}
            <strong>Vercel Dashboard → Settings → Environment Variables</strong> antes del despliegue.
            Nunca incluyas secretos en el código fuente.
          </div>
        </SettingSection>
      </div>
    </>
  );
}
