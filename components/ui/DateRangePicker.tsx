"use client";

import React from "react";
import type { ComparisonPeriod } from "@/lib/types/common";

interface DateRangePickerProps {
  value: ComparisonPeriod;
  onChange: (period: ComparisonPeriod) => void;
}

const OPTIONS: { value: ComparisonPeriod; label: string; sub: string }[] = [
  { value: "yesterday", label: "Ayer", sub: "vs. día anterior" },
  { value: "7d", label: "7 días", sub: "vs. 7 días anteriores" },
  { value: "30d", label: "30 días", sub: "vs. 30 días anteriores" },
  { value: "90d", label: "90 días", sub: "vs. 90 días anteriores" },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.375rem",
        background: "rgba(15, 23, 42, 0.8)",
        border: "1px solid #334155",
        borderRadius: "10px",
        padding: "0.25rem",
      }}
    >
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              padding: "0.375rem 0.875rem",
              borderRadius: "7px",
              border: "none",
              cursor: "pointer",
              fontSize: "0.8rem",
              fontWeight: 600,
              transition: "all 0.15s ease",
              background: isActive
                ? "linear-gradient(135deg, #1e9bd7, #1578a8)"
                : "transparent",
              color: isActive ? "#ffffff" : "#64748b",
              boxShadow: isActive ? "0 2px 8px rgba(30, 155, 215, 0.3)" : "none",
              whiteSpace: "nowrap",
            }}
            title={opt.sub}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
