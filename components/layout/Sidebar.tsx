"use client";

import React from "react";
import Image from "next/image";
import {
  LayoutDashboard,
  ArrowUpFromDot,
  Megaphone,
  FileText,
  Target,
  Bell,
  Lightbulb,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
} from "lucide-react";
import { NavItem } from "@/components/layout/NavItem";

const NAV_ITEMS = [
  { href: "/overview", icon: LayoutDashboard, label: "Resumen" },
  { href: "/acquisition", icon: ArrowUpFromDot, label: "Adquisición" },
  { href: "/campaigns", icon: Megaphone, label: "Campañas" },
  { href: "/pages", icon: FileText, label: "Páginas" },
  { href: "/conversions", icon: Target, label: "Conversiones" },
] as const;

const SECONDARY_NAV_ITEMS = [
  { href: "/alerts", icon: Bell, label: "Alertas", badge: 0 },
  { href: "/recommendations", icon: Lightbulb, label: "Recomendaciones" },
  { href: "/tasks", icon: CheckSquare, label: "Tareas" },
  { href: "/reports", icon: BarChart3, label: "Reportes" },
  { href: "/settings", icon: Settings, label: "Configuración" },
] as const;

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  ga4Connected?: boolean;
}

export function Sidebar({ collapsed, onToggle, ga4Connected = false }: SidebarProps) {
  return (
    <aside
      style={{
        width: collapsed ? "64px" : "240px",
        minHeight: "100vh",
        background: "var(--bg-sidebar)",
        borderRight: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        transition: "width 0.25s ease",
        flexShrink: 0,
        position: "relative",
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: collapsed ? "1.25rem 0.875rem" : "1.25rem 1.25rem",
          borderBottom: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          minHeight: "72px",
          overflow: "hidden",
        }}
      >
        <div style={{ flexShrink: 0, position: "relative", width: 36, height: 36 }}>
          <Image
            src="/logo.png"
            alt="The Industrial Depot"
            width={36}
            height={36}
            style={{ objectFit: "contain", width: "36px", height: "36px" }}
          />
        </div>
        {!collapsed && (
          <div style={{ overflow: "hidden" }}>
            <div
              style={{
                fontSize: "0.8rem",
                fontWeight: 700,
                color: "#f1f5f9",
                lineHeight: 1.2,
                whiteSpace: "nowrap",
              }}
            >
              Industrial Depot
            </div>
            <div
              style={{
                fontSize: "0.65rem",
                color: "#1e9bd7",
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              Analytics
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        style={{
          flex: 1,
          padding: "1rem 0.625rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {/* Primary nav */}
        {!collapsed && (
          <div
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "#475569",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0 0.25rem",
              marginBottom: "0.5rem",
            }}
          >
            Análisis
          </div>
        )}
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            collapsed={collapsed}
          />
        ))}

        {/* Divider */}
        <div
          style={{
            height: "1px",
            background: "var(--border-color)",
            margin: "0.75rem 0",
          }}
        />

        {/* Secondary nav */}
        {!collapsed && (
          <div
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              color: "#475569",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0 0.25rem",
              marginBottom: "0.5rem",
            }}
          >
            Gestión
          </div>
        )}
        {SECONDARY_NAV_ITEMS.map((item) => (
          <NavItem
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            badge={"badge" in item ? item.badge : undefined}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* GA4 Status */}
      <div
        style={{
          padding: collapsed ? "0.875rem" : "0.875rem 1rem",
          borderTop: "1px solid var(--border-color)",
          display: "flex",
          alignItems: "center",
          gap: "0.625rem",
          justifyContent: collapsed ? "center" : "flex-start",
        }}
      >
        {ga4Connected ? (
          <>
            <Wifi size={14} color="#22c55e" />
            {!collapsed && (
              <span style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 600 }}>
                GA4 Conectado
              </span>
            )}
          </>
        ) : (
          <>
            <WifiOff size={14} color="#ef4444" />
            {!collapsed && (
              <span style={{ fontSize: "0.72rem", color: "#ef4444", fontWeight: 600 }}>
                GA4 Sin conectar
              </span>
            )}
          </>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        style={{
          position: "absolute",
          top: "80px",
          right: "-12px",
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          background: "#1e293b",
          border: "1px solid #334155",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#64748b",
          transition: "all 0.15s ease",
          zIndex: 50,
        }}
        title={collapsed ? "Expandir menú" : "Colapsar menú"}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  );
}
