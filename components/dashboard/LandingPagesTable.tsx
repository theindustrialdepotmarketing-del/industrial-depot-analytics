"use client";

import React from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { FileText } from "lucide-react";
import type { LandingPageData } from "@/lib/types/analytics";
import { formatNumber, formatPercent } from "@/lib/utils/format";

interface LandingPagesTableProps {
  data: LandingPageData[];
  isLoading?: boolean;
}

export function LandingPagesTable({ data, isLoading = false }: LandingPagesTableProps) {
  const columns: Column<LandingPageData>[] = [
    {
      key: "pagePath",
      label: "Página",
      render: (row) => (
        <div>
          <div style={{ color: "#f1f5f9", fontWeight: 500, fontSize: "0.875rem" }}>
            {row.pageTitle}
          </div>
          <div
            style={{
              color: "#475569",
              fontSize: "0.72rem",
              fontFamily: "monospace",
              marginTop: "0.1rem",
            }}
          >
            {row.pagePath}
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
      key: "engagementRate",
      label: "Interacción",
      align: "right",
      sortable: true,
      render: (row) => (
        <span style={{ color: "#94a3b8" }}>{formatPercent(row.engagementRate)}</span>
      ),
    },
    {
      key: "conversionRate",
      label: "Tasa Conv.",
      align: "right",
      sortable: true,
      render: (row) => (
        <span style={{ color: "#94a3b8" }}>{formatPercent(row.conversionRate)}</span>
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
      key: "bounceRate",
      label: "Rebote",
      align: "right",
      sortable: true,
      render: (row) => (
        <span
          style={{
            color: row.bounceRate > 0.7 ? "#ef4444" : row.bounceRate > 0.5 ? "#f59e0b" : "#94a3b8",
          }}
        >
          {formatPercent(row.bounceRate)}
        </span>
      ),
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
      keyField="pagePath"
      isLoading={isLoading}
      emptyNode={
        <EmptyState
          icon={FileText}
          title="Sin datos de páginas"
          description="Conecta Google Analytics 4 para identificar las páginas de destino con mayor rendimiento."
          variant="compact"
        />
      }
    />
  );
}
