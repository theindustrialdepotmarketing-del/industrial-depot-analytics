"use client";

import React, { useEffect } from "react";
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
  X,
  Wifi,
  WifiOff,
} from "lucide-react";
import { NavItem } from "@/components/layout/NavItem";

const ALL_NAV = [
  { href: "/overview", icon: LayoutDashboard, label: "Resumen" },
  { href: "/acquisition", icon: ArrowUpFromDot, label: "Adquisición" },
  { href: "/campaigns", icon: Megaphone, label: "Campañas" },
  { href: "/pages", icon: FileText, label: "Páginas" },
  { href: "/conversions", icon: Target, label: "Conversiones" },
  { href: "/alerts", icon: Bell, label: "Alertas" },
  { href: "/recommendations", icon: Lightbulb, label: "Recomendaciones" },
  { href: "/tasks", icon: CheckSquare, label: "Tareas" },
  { href: "/reports", icon: BarChart3, label: "Reportes" },
  { href: "/settings", icon: Settings, label: "Configuración" },
] as const;

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  ga4Connected?: boolean;
}

export function MobileSidebar({ isOpen, onClose, ga4Connected = false }: MobileSidebarProps) {
  // Close on escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          zIndex: 50,
          backdropFilter: "blur(2px)",
        }}
      />
      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "260px",
          background: "var(--bg-sidebar)",
          borderRight: "1px solid var(--border-color)",
          zIndex: 60,
          display: "flex",
          flexDirection: "column",
          animation: "slide-in 0.25s ease-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem",
            borderBottom: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <Image src="/logo.png" alt="The Industrial Depot" width={36} height={36} style={{ objectFit: "contain", width: "36px", height: "36px" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#f1f5f9" }}>
              Industrial Depot
            </div>
            <div style={{ fontSize: "0.65rem", color: "#1e9bd7", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Analytics
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#64748b" }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "1rem 0.625rem", display: "flex", flexDirection: "column", gap: "0.25rem", overflowY: "auto" }}>
          {ALL_NAV.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </nav>

        {/* Status */}
        <div style={{ padding: "0.875rem 1rem", borderTop: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "0.625rem" }}>
          {ga4Connected ? (
            <><Wifi size={14} color="#22c55e" /><span style={{ fontSize: "0.72rem", color: "#22c55e", fontWeight: 600 }}>GA4 Conectado</span></>
          ) : (
            <><WifiOff size={14} color="#ef4444" /><span style={{ fontSize: "0.72rem", color: "#ef4444", fontWeight: 600 }}>GA4 Sin conectar</span></>
          )}
        </div>
      </div>
    </>
  );
}
