"use client";

import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { ArrowUpFromDot } from "lucide-react";
import type { ChannelData } from "@/lib/types/analytics";
import { formatNumber, formatPercent, formatCurrency } from "@/lib/utils/format";

interface ChannelsTableProps {
  data: ChannelData[];
  isLoading?: boolean;
}

export function ChannelsTable({ data, isLoading = false }: ChannelsTableProps) {
  const columns: Column<ChannelData>[] = [
    {
      key: "channel",
      label: "Canal",
      render: (row) => (
        <span style={{ color: "#f1f5f9", fontWeight: 500 }}>{row.channel}</span>
      ),
    },
    {
      key: "sessions",
      label: "Sesiones",
      align: "right",
      sortable: true,
      render: (row) => <span style={{ color: "#94a3b8" }}>{formatNumber(row.sessions)}</span>,
    },
    {
      key: "newUsers",
      label: "Nuevos",
      align: "right",
      sortable: true,
      render: (row) => <span style={{ color: "#94a3b8" }}>{formatNumber(row.newUsers)}</span>,
    },
    {
      key: "engagementRate",
      label: "Interacción",
      align: "right",
      sortable: true,
      render: (row) => (
        <span style={{ color: "#94a3b8" }}>{formatPercent(row.engagementRate)}</span>
      ),
    },
    {
      key: "conversions",
      label: "Conversiones",
      align: "right",
      sortable: true,
      render: (row) => <span style={{ color: "#94a3b8" }}>{formatNumber(row.conversions)}</span>,
    },
    {
      key: "revenue",
      label: "Ingresos",
      align: "right",
      sortable: true,
      render: (row) => <span style={{ color: "#22c55e" }}>{formatCurrency(row.revenue)}</span>,
    },
    {
      key: "status",
      label: "Estado",
      align: "center",
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      keyField="channel"
      isLoading={isLoading}
      emptyNode={
        <EmptyState
          icon={ArrowUpFromDot}
          title="Sin datos de canales"
          description="Conecta Google Analytics 4 para analizar qué canales generan más tráfico y conversiones."
          variant="compact"
        />
      }
    />
  );
}
