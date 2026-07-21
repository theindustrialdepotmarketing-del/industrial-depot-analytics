"use client";

import React from "react";

interface SectionHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function SectionHeader({ title, description, children }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "1rem",
        flexWrap: "wrap",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "1.375rem",
            fontWeight: 700,
            color: "#f1f5f9",
            margin: 0,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              margin: "0.25rem 0 0",
              fontSize: "0.875rem",
              color: "#64748b",
            }}
          >
            {description}
          </p>
        )}
      </div>
      {children && (
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", flexShrink: 0 }}>
          {children}
        </div>
      )}
    </div>
  );
}
