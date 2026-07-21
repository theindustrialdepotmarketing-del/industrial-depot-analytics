"use client";

import React from "react";
import { MetricCard } from "@/components/ui/MetricCard";
import {
  Users,
  UserPlus,
  Activity,
  Zap,
  TrendingUp,
  Target,
  Percent,
  DollarSign,
} from "lucide-react";

interface MetricsGridProps {
  isConnected: boolean;
}

export function MetricsGrid({ isConnected }: MetricsGridProps) {
  const isEmpty = !isConnected;

  const metrics = [
    {
      title: "Usuarios Activos",
      value: "—",
      icon: <Users size={18} />,
      accent: "#1e9bd7",
    },
    {
      title: "Usuarios Nuevos",
      value: "—",
      icon: <UserPlus size={18} />,
      accent: "#4fb5ea",
    },
    {
      title: "Sesiones",
      value: "—",
      icon: <Activity size={18} />,
      accent: "#1578a8",
    },
    {
      title: "Sesiones con Interacción",
      value: "—",
      icon: <Zap size={18} />,
      accent: "#0e4663",
    },
    {
      title: "Tasa de Interacción",
      value: "—",
      icon: <TrendingUp size={18} />,
      accent: "#22c55e",
    },
    {
      title: "Conversiones",
      value: "—",
      icon: <Target size={18} />,
      accent: "#f59e0b",
    },
    {
      title: "Tasa de Conversión",
      value: "—",
      icon: <Percent size={18} />,
      accent: "#f59e0b",
    },
    {
      title: "Ingresos",
      value: "—",
      icon: <DollarSign size={18} />,
      accent: "#22c55e",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1rem",
      }}
    >
      {metrics.map((m) => (
        <MetricCard
          key={m.title}
          title={m.title}
          value={m.value}
          icon={m.icon}
          isEmpty={isEmpty}
          accent={m.accent}
        />
      ))}
    </div>
  );
}
