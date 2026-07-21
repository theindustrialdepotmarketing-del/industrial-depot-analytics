"use client";

import React from "react";
import type { TrendDirection } from "@/lib/types/common";
import { TrendBadge } from "@/components/ui/TrendBadge";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  deltaPercent?: number;
  trend?: TrendDirection;
  compareLabel?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
  inverted?: boolean;
  accent?: string;
}

function SkeletonPulse({ width = "60%", height = "1.5rem" }: { width?: string; height?: string }) {
  return (
    <div
      style={{
        width,
        height,
        background: "linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)",
        backgroundSize: "200% 100%",
        borderRadius: "4px",
        animation: "skeleton-shimmer 1.5s infinite",
      }}
    />
  );
}

export function MetricCard({
  title,
  value,
  icon,
  deltaPercent,
  trend,
  compareLabel,
  isLoading = false,
  isEmpty = false,
  inverted = false,
  accent = "#1e9bd7",
}: MetricCardProps) {
  return (
    <div
      className="metric-card"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        position: "relative",
        overflow: "hidden",
        animation: "fade-in 0.3s ease-out",
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg, ${accent}, transparent)`,
          borderRadius: "12px 12px 0 0",
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span
          style={{
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          {title}
        </span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "8px",
            background: `rgba(30, 155, 215, 0.1)`,
            color: accent,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
      </div>

      {/* Value */}
      {isLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <style>{`
            @keyframes skeleton-shimmer {
              0% { background-position: 200% 0; }
              100% { background-position: -200% 0; }
            }
          `}</style>
          <SkeletonPulse width="70%" height="2rem" />
          <SkeletonPulse width="40%" height="1rem" />
        </div>
      ) : isEmpty ? (
        <div>
          <div
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "#334155",
              lineHeight: 1,
            }}
          >
            —
          </div>
          <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#475569" }}>
            Sin datos
          </div>
        </div>
      ) : (
        <div>
          <div
            style={{
              fontSize: "1.875rem",
              fontWeight: 700,
              color: "#f1f5f9",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </div>
          {trend !== undefined && deltaPercent !== undefined && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "0.5rem",
              }}
            >
              <TrendBadge
                deltaPercent={deltaPercent}
                direction={trend}
                inverted={inverted}
                size="sm"
              />
              {compareLabel && (
                <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                  vs. {compareLabel}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
