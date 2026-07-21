"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface BarChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface MetricBarChartProps {
  data: BarChartDataPoint[];
  height?: number;
  valueFormatter?: (value: number) => string;
}

export function MetricBarChart({ data, height = 200, valueFormatter }: MetricBarChartProps) {
  const COLORS = ["#1e9bd7", "#1578a8", "#0e4663", "#4fb5ea", "#8dcff3"];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#475569", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={valueFormatter}
          width={45}
        />
        <Tooltip
          contentStyle={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "8px",
            fontSize: "0.8rem",
            color: "#f1f5f9",
          }}
          formatter={(value) => [
            typeof value === "number"
              ? (valueFormatter ? valueFormatter(value) : value.toLocaleString())
              : String(value ?? ""),
            "",
          ]}
          cursor={{ fill: "rgba(30, 155, 215, 0.05)" }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color ?? COLORS[index % COLORS.length]}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
