"use client";

import React, { useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { TestGA4Response } from "@/lib/types/analytics";
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
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestGA4Response | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Dynamic connection state: true when test succeed in Vercel environment
  const isGa4Connected = Boolean(testResult?.success && !testResult?.isLocalEnv);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestError(null);

    try {
      const res = await fetch("/api/analytics/test");
      const data = await res.json();

      if (!res.ok && !data.isLocalEnv) {
        setTestError(data.message || `Error consultando GA4 (${res.status})`);
        setTestResult(null); // Reset connected status on error
      } else {
        setTestResult(data);
        if (!data.success && !data.isLocalEnv) {
          setTestResult(null);
        }
      }
    } catch (err: unknown) {
      setTestError(
        err instanceof Error
          ? err.message
          : "Error de red al intentar conectar con el servidor"
      );
      setTestResult(null);
    } finally {
      setTesting(false);
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
                onClick={handleTestConnection}
                disabled={testing}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem" }}
              >
                {testing ? (
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

            {/* Test Error display */}
            {testError && (
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
                      Error en la prueba de conexión
                    </div>
                    <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.25rem", lineHeight: 1.5 }}>
                      {testError}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Test Result display */}
            {testResult && testResult.isLocalEnv && (
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
                    {testResult.message ||
                      "La prueba de autenticación OIDC + Workload Identity Federation debe ejecutarse desde un deployment en Vercel. En desarrollo local no existe token OIDC activo."}
                  </div>
                </div>
              </div>
            )}

            {testResult && testResult.success && !testResult.isLocalEnv && (
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
                      {testResult.period.description}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Filas Consultadas</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>
                      {testResult.rowCount} días
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Usuarios Activos</div>
                    <div style={{ color: "#1e9bd7", fontWeight: 700, marginTop: "0.2rem" }}>
                      {testResult.summary.activeUsers.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Nuevos Usuarios</div>
                    <div style={{ color: "#1e9bd7", fontWeight: 700, marginTop: "0.2rem" }}>
                      {testResult.summary.newUsers.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Sesiones</div>
                    <div style={{ color: "#f1f5f9", fontWeight: 600, marginTop: "0.2rem" }}>
                      {testResult.summary.sessions.toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: "rgba(15,23,42,0.6)", padding: "0.6rem 0.8rem", borderRadius: "6px" }}>
                    <div style={{ color: "#64748b", fontSize: "0.7rem", textTransform: "uppercase" }}>Key Events</div>
                    <div style={{ color: "#22c55e", fontWeight: 700, marginTop: "0.2rem" }}>
                      {testResult.summary.keyEvents.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Safe Diagnostics Block */}
                {testResult.diagnostics && (
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
                        <strong style={{ color: testResult.diagnostics.oidcTokenReceived ? "#22c55e" : "#ef4444" }}>
                          {testResult.diagnostics.oidcTokenReceived ? "OK" : "NO"}
                        </strong>
                      </span>
                      <span>
                        Intercambio WIF:{" "}
                        <strong style={{ color: testResult.diagnostics.workloadIdentityExchange === "success" ? "#22c55e" : "#ef4444" }}>
                          {testResult.diagnostics.workloadIdentityExchange}
                        </strong>
                      </span>
                      <span>
                        Impersonación:{" "}
                        <strong style={{ color: testResult.diagnostics.serviceAccountImpersonation === "success" ? "#22c55e" : "#ef4444" }}>
                          {testResult.diagnostics.serviceAccountImpersonation}
                        </strong>
                      </span>
                      <span>
                        OAuth Scopes:{" "}
                        <strong style={{ color: testResult.diagnostics.analyticsScopeConfigured ? "#22c55e" : "#ef4444" }}>
                          {testResult.diagnostics.analyticsScopeConfigured ? "analytics.readonly" : "Falta"}
                        </strong>
                      </span>
                      <span>
                        Consulta GA4:{" "}
                        <strong style={{ color: testResult.diagnostics.ga4Query === "success" ? "#22c55e" : "#ef4444" }}>
                          {testResult.diagnostics.ga4Query}
                        </strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            style={{
              background: "rgba(30,155,215,0.06)",
              border: "1px solid rgba(30,155,215,0.15)",
              borderRadius: "8px",
              padding: "1rem",
              fontSize: "0.8rem",
              color: "#64748b",
              lineHeight: 1.7,
            }}
          >
            <strong style={{ color: "#94a3b8" }}>Arquitectura de Autenticación:</strong>
            <br />
            1. Vercel genera automáticamente un token JWT OIDC firmado por despliegue.
            <br />
            2. Google Workload Identity Federation valida el token sin requerir archivos JSON.
            <br />
            3. GCP otorga permisos temporales impersonando la cuenta{" "}
            <code style={{ color: "#1e9bd7" }}>ga4-dashboard-reader@...</code> incluyendo los OAuth Scopes{" "}
            <code style={{ color: "#1e9bd7" }}>analytics.readonly</code> y{" "}
            <code style={{ color: "#1e9bd7" }}>cloud-platform</code>.
            <br />
            4. Ningún secreto ni clave privada permanente es almacenada o expuesta al navegador.
          </div>
        </SettingSection>

        {/* Supabase */}
        <SettingSection title="Supabase" icon={Database}>
          <SettingRow
            label="Proyecto Supabase"
            desc="Base de datos para métricas, alertas y tareas"
            value="No configurado"
            connected={false}
          />
          <SettingRow
            label="Service Role Key"
            desc="Solo usada en el servidor — nunca expuesta al navegador"
            connected={false}
          />
        </SettingSection>

        {/* Cron */}
        <SettingSection title="Sincronización automática" icon={Clock}>
          <SettingRow
            label="Cron diario"
            desc="Ejecuta /api/cron/daily a las 2:00 AM UTC todos los días"
            connected={false}
          />
          <SettingRow
            label="CRON_SECRET"
            desc="Secreto para proteger el endpoint de cron"
            connected={false}
          />
          <div style={{ fontSize: "0.78rem", color: "#475569", lineHeight: 1.7 }}>
            Configura en <code style={{ color: "#1e9bd7" }}>vercel.json</code>:
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
              {`{\n  "crons": [{\n    "path": "/api/cron/daily",\n    "schedule": "0 2 * * *"\n  }]\n}`}
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
