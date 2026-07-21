"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/lib/types/analytics";

interface AreaChartProps {
  data: ChartDataPoint[];
  height?: number;
  showPrevious?: boolean;
  valueFormatter?: (value: number) => string;
  dateFormatter?: (date: string) => string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; color: string }>;
  label?: string;
  valueFormatter?: (v: number) => string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1e293b",
        border: "1px solid #334155",
        borderRadius: "8px",
        padding: "0.75rem 1rem",
        fontSize: "0.8rem",
      }}
    >
      <div style={{ color: "#94a3b8", marginBottom: "0.5rem", fontWeight: 600 }}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ color: entry.color, display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: entry.color, display: "inline-block" }} />
          <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>
            {entry.dataKey === "previousValue" ? "Período anterior:" : "Período actual:"}
          </span>
          <span style={{ color: "#f1f5f9", fontWeight: 600 }}>
            {valueFormatter ? valueFormatter(entry.value) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

export function SessionsAreaChart({
  data,
  height = 260,
  showPrevious = true,
  valueFormatter,
  dateFormatter,
}: AreaChartProps) {
  const formatted = data.map((d) => ({
    ...d,
    date: dateFormatter ? dateFormatter(d.date) : d.date,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={formatted} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#1e9bd7" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#1e9bd7" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#475569" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#475569" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          dy={8}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={valueFormatter}
          width={50}
        />
        <Tooltip content={<CustomTooltip valueFormatter={valueFormatter} />} />
        {showPrevious && (
          <Area
            type="monotone"
            dataKey="previousValue"
            stroke="#334155"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            fill="url(#colorPrev)"
            dot={false}
            activeDot={{ r: 4, fill: "#334155" }}
          />
        )}
        <Area
          type="monotone"
          dataKey="value"
          stroke="#1e9bd7"
          strokeWidth={2}
          fill="url(#colorCurrent)"
          dot={false}
          activeDot={{ r: 5, fill: "#1e9bd7", stroke: "#0f172a", strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
