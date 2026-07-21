"use client";

import React from "react";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: "default" | "compact";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
}: EmptyStateProps) {
  const isCompact = variant === "compact";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: isCompact ? "2rem" : "4rem 2rem",
        textAlign: "center",
        gap: isCompact ? "0.75rem" : "1rem",
      }}
    >
      {/* Icon container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: isCompact ? "48px" : "64px",
          height: isCompact ? "48px" : "64px",
          borderRadius: "16px",
          background: "rgba(30, 155, 215, 0.08)",
          border: "1px solid rgba(30, 155, 215, 0.15)",
          color: "#1e9bd7",
          marginBottom: "0.25rem",
        }}
      >
        <Icon size={isCompact ? 22 : 28} strokeWidth={1.5} />
      </div>

      {/* Text */}
      <div>
        <h3
          style={{
            fontSize: isCompact ? "0.9rem" : "1.1rem",
            fontWeight: 600,
            color: "#94a3b8",
            margin: 0,
            marginBottom: "0.35rem",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: isCompact ? "0.78rem" : "0.875rem",
            color: "#475569",
            margin: 0,
            maxWidth: "340px",
            lineHeight: 1.6,
          }}
        >
          {description}
        </p>
      </div>

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="btn-secondary"
          style={{ marginTop: "0.25rem" }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
