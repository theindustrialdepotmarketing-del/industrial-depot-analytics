"use client";

import React from "react";
import type { TrendDirection } from "@/lib/types/common";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface TrendBadgeProps {
  deltaPercent: number;
  direction: TrendDirection;
  inverted?: boolean; // For metrics where down is good (e.g. bounce rate)
  size?: "sm" | "md";
}

export function TrendBadge({
  deltaPercent,
  direction,
  inverted = false,
  size = "sm",
}: TrendBadgeProps) {
  const isPositive = inverted
    ? direction === "down"
    : direction === "up";

  const color =
    direction === "neutral"
      ? "#64748b"
      : isPositive
      ? "#22c55e"
      : "#ef4444";

  const bg =
    direction === "neutral"
      ? "rgba(100, 116, 139, 0.1)"
      : isPositive
      ? "rgba(34, 197, 94, 0.1)"
      : "rgba(239, 68, 68, 0.1)";

  const iconSize = size === "sm" ? 11 : 13;
  const fontSize = size === "sm" ? "0.7rem" : "0.8rem";

  const Icon =
    direction === "up"
      ? TrendingUp
      : direction === "down"
      ? TrendingDown
      : Minus;

  const sign = deltaPercent > 0 ? "+" : "";
  const formatted = `${sign}${deltaPercent.toFixed(1)}%`;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.2rem",
        padding: "0.15rem 0.45rem",
        borderRadius: "4px",
        background: bg,
        color,
        fontSize,
        fontWeight: 600,
        letterSpacing: "0.02em",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={iconSize} strokeWidth={2.5} />
      {formatted}
    </span>
  );
}
