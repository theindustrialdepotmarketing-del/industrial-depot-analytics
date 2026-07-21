"use client";

import React from "react";
import { Bell, User, Menu, LogOut } from "lucide-react";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import type { ComparisonPeriod } from "@/lib/types/common";
import { signOut } from "next-auth/react";

interface HeaderProps {
  period: ComparisonPeriod;
  onPeriodChange: (period: ComparisonPeriod) => void;
  onMenuToggle?: () => void;
  userName?: string;
  alertCount?: number;
}

export function Header({
  period,
  onPeriodChange,
  onMenuToggle,
  userName = "Administrador",
  alertCount = 0,
}: HeaderProps) {
  return (
    <header
      style={{
        height: "72px",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        gap: "1rem",
        position: "sticky",
        top: 0,
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      {/* Mobile menu button */}
      {onMenuToggle && (
        <button
          onClick={onMenuToggle}
          className="btn-secondary"
          style={{
            display: "none",
            padding: "0.5rem",
            border: "none",
            background: "transparent",
          }}
          id="mobile-menu-btn"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Date range picker */}
      <DateRangePicker value={period} onChange={onPeriodChange} />

      {/* Alerts */}
      <button
        style={{
          position: "relative",
          background: "transparent",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          padding: "0.5rem",
          cursor: "pointer",
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "all 0.15s ease",
        }}
        title="Alertas"
      >
        <Bell size={18} />
        {alertCount > 0 && (
          <span
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: "#ef4444",
              color: "#fff",
              fontSize: "0.6rem",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {alertCount > 9 ? "9+" : alertCount}
          </span>
        )}
      </button>

      {/* User */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.375rem 0.75rem",
          borderRadius: "8px",
          border: "1px solid var(--border-color)",
          cursor: "default",
        }}
      >
        <div
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1e9bd7, #1578a8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <User size={14} color="#fff" />
        </div>
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#94a3b8",
            whiteSpace: "nowrap",
          }}
        >
          {userName}
        </span>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            color: "#475569",
            display: "flex",
            alignItems: "center",
            padding: "0 0 0 0.25rem",
            transition: "color 0.15s ease",
          }}
          title="Cerrar sesión"
        >
          <LogOut size={14} />
        </button>
      </div>

      <style>{`
        @media (max-width: 768px) {
          #mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
