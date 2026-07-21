import type { Status, TrendDirection, MetricComparison } from "@/lib/types/common";

/* ─── Trend Calculation ─── */
export function calculateTrend(current: number, previous: number): MetricComparison {
  const delta = current - previous;
  const deltaPercent = previous !== 0 ? (delta / previous) * 100 : 0;
  const trend: TrendDirection =
    delta > 0 ? "up" : delta < 0 ? "down" : "neutral";

  return { current, previous, delta, deltaPercent, trend };
}

/* ─── Status from Metric ─── */
export function getStatusFromEngagementRate(rate: number): Status {
  if (rate >= 0.6) return "continue";
  if (rate >= 0.4) return "optimize";
  if (rate >= 0.25) return "watch";
  return "review";
}

export function getStatusFromConversionRate(rate: number): Status {
  if (rate >= 0.03) return "continue";
  if (rate >= 0.01) return "optimize";
  if (rate >= 0.005) return "watch";
  return "review";
}

export function getStatusFromTrend(deltaPercent: number): Status {
  if (deltaPercent >= 5) return "continue";
  if (deltaPercent >= -5) return "optimize";
  if (deltaPercent >= -20) return "watch";
  return "review";
}

export function getStatusFromROAS(roas: number): Status {
  if (roas >= 4) return "continue";
  if (roas >= 2) return "optimize";
  if (roas >= 1) return "watch";
  return "review";
}

/* ─── Status Display ─── */
export const STATUS_CONFIG: Record<
  Status,
  { label: string; color: string; bg: string; border: string }
> = {
  continue: {
    label: "Continuar",
    color: "#22c55e",
    bg: "rgba(34, 197, 94, 0.1)",
    border: "rgba(34, 197, 94, 0.3)",
  },
  optimize: {
    label: "Optimizar",
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.1)",
    border: "rgba(245, 158, 11, 0.3)",
  },
  watch: {
    label: "Vigilar",
    color: "#ef4444",
    bg: "rgba(239, 68, 68, 0.1)",
    border: "rgba(239, 68, 68, 0.3)",
  },
  review: {
    label: "Revisar",
    color: "#dc2626",
    bg: "rgba(220, 38, 38, 0.1)",
    border: "rgba(220, 38, 38, 0.3)",
  },
};

/* ─── Trend Display ─── */
export function getTrendColor(direction: TrendDirection, inverted = false): string {
  if (direction === "neutral") return "#64748b";
  const isPositive = inverted ? direction === "down" : direction === "up";
  return isPositive ? "#22c55e" : "#ef4444";
}
