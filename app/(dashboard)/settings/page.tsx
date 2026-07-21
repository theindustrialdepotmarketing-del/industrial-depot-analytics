"use client";

import React from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  Database,
  BarChart3,
  Clock,
  Shield,
  CheckCircle2,
  XCircle,
} from "lucide-react";

function SettingSection({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "12px", overflow: "hidden" }}>
      <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <Icon size={18} color="#1e9bd7" />
        <h2 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#f1f5f9", margin: 0 }}>{title}</h2>
      </div>
      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column" as const, gap: "1.25rem" }}>
        {children}
      </div>
    </div>
  );
}

function SettingRow({ label, desc, value, connected }: { label: string; desc?: string; value?: string; connected?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" as const }}>
      <div>
        <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "#94a3b8" }}>{label}</div>
        {desc && <div style={{ fontSize: "0.775rem", color: "#475569", marginTop: "0.15rem" }}>{desc}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
        {connected !== undefined && (
          connected
            ? <CheckCircle2 size={16} color="#22c55e" />
            : <XCircle size={16} color="#ef4444" />
        )}
        {value && <span style={{ fontSize: "0.8rem", color: "#64748b", background: "rgba(30,41,59,0.8)", padding: "0.25rem 0.75rem", borderRadius: "6px", border: "1px solid var(--border-color)", fontFamily: "monospace" }}>{value}</span>}
        {connected !== undefined && (
          <span style={{ fontSize: "0.78rem", color: connected ? "#22c55e" : "#ef4444", fontWeight: 600 }}>
            {connected ? "Conectado" : "Sin conectar"}
          </span>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <SectionHeader
        title="Configuración"
        description="Gestión de integraciones, credenciales y preferencias del dashboard"
      />

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", maxWidth: "720px" }}>

        <SettingSection title="Google Analytics 4" icon={BarChart3}>
          <SettingRow
            label="Propiedad GA4"
            desc="ID de la propiedad de Google Analytics 4"
            value="No configurado"
            connected={false}
          />
          <SettingRow
            label="Autenticación"
            desc="Workload Identity Federation (Vercel → Google Cloud)"
            connected={false}
          />
          <div style={{ background: "rgba(30,155,215,0.06)", border: "1px solid rgba(30,155,215,0.15)", borderRadius: "8px", padding: "1rem", fontSize: "0.8rem", color: "#64748b", lineHeight: 1.7 }}>
            <strong style={{ color: "#94a3b8" }}>Instrucciones:</strong><br />
            1. Configura <code style={{ color: "#1e9bd7" }}>GA4_PROPERTY_ID</code> en variables de entorno de Vercel.<br />
            2. Habilita Workload Identity Federation en Google Cloud Console.<br />
            3. Conecta el proveedor de identidad de Vercel con el Service Account de GA4.<br />
            4. No se requieren archivos JSON ni claves privadas.
          </div>
        </SettingSection>

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
            <pre style={{ background: "#0a0f1e", border: "1px solid var(--border-color)", borderRadius: "6px", padding: "0.75rem", marginTop: "0.5rem", overflow: "auto", color: "#94a3b8", fontSize: "0.75rem" }}>{`{\n  "crons": [{\n    "path": "/api/cron/daily",\n    "schedule": "0 2 * * *"\n  }]\n}`}</pre>
          </div>
        </SettingSection>

        <SettingSection title="Seguridad" icon={Shield}>
          <SettingRow label="Autenticación admin" desc="Credenciales de acceso al dashboard" connected={false} />
          <SettingRow label="NEXTAUTH_SECRET" desc="Clave de sesión JWT" connected={false} />
          <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: "8px", padding: "1rem", fontSize: "0.78rem", color: "#94a3b8", lineHeight: 1.7 }}>
            ⚠️ Configura todas las variables de entorno en <strong>Vercel Dashboard → Settings → Environment Variables</strong> antes del despliegue. Nunca incluyas secretos en el código fuente.
          </div>
        </SettingSection>

      </div>
    </>
  );
}
