"use client";

import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Megaphone } from "lucide-react";
import type { CampaignData } from "@/lib/types/analytics";
import { formatNumber, formatPercent, formatCurrency } from "@/lib/utils/format";

interface CampaignsTableProps {
  data: CampaignData[];
  isLoading?: boolean;
}

export function CampaignsTable({ data, isLoading = false }: CampaignsTableProps) {
  const columns: Column<CampaignData>[] = [
    {
      key: "campaign",
      label: "Campaña",
      render: (row) => (
        <div>
          <div style={{ color: "#f1f5f9", fontWeight: 500, fontSize: "0.875rem" }}>
            {row.campaign}
          </div>
          <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: "0.1rem" }}>
            {row.source} / {row.medium}
          </div>
        </div>
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
      label: "Conv.",
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
      keyField="campaign"
      isLoading={isLoading}
      emptyNode={
        <EmptyState
          icon={Megaphone}
          title="Sin datos de campañas"
          description="Conecta Google Analytics 4 para ver el rendimiento de tus campañas con comparaciones de período."
          variant="compact"
        />
      }
    />
  );
}
