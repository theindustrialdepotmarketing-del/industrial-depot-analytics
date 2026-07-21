"use client";

import React from "react";
import type { Status } from "@/lib/types/common";
import { STATUS_CONFIG } from "@/lib/utils/metrics";
import { CheckCircle2, Zap, Eye, StopCircle } from "lucide-react";

interface StatusBadgeProps {
  status: Status;
  size?: "sm" | "md" | "lg";
}

const STATUS_ICONS: Record<Status, React.ElementType> = {
  continue: CheckCircle2,
  optimize: Zap,
  watch: Eye,
  review: StopCircle,
};

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = STATUS_ICONS[status];

  const sizeMap = {
    sm: { fontSize: "0.7rem", padding: "0.15rem 0.5rem", iconSize: 11 },
    md: { fontSize: "0.8rem", padding: "0.25rem 0.65rem", iconSize: 13 },
    lg: { fontSize: "0.875rem", padding: "0.35rem 0.875rem", iconSize: 14 },
  };

  const s = sizeMap[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        padding: s.padding,
        borderRadius: "6px",
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontSize: s.fontSize,
        fontWeight: 600,
        letterSpacing: "0.03em",
        whiteSpace: "nowrap",
      }}
    >
      <Icon size={s.iconSize} strokeWidth={2.5} />
      {config.label}
    </span>
  );
}
