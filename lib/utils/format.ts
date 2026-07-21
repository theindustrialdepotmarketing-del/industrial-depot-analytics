import type { ComparisonPeriod, DateRange, ComparisonDateRange } from "@/lib/types/common";

/* ─── Number Formatting ─── */
export function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("en-US");
}

export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

export function formatPercentRaw(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatCurrency(value: number, currency = "USD"): string {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}m ${secs}s`;
}

/* ─── Date Formatting ─── */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

/* ─── Delta Formatting ─── */
export function formatDelta(delta: number, type: "number" | "percent" | "currency" = "number"): string {
  const sign = delta > 0 ? "+" : "";
  switch (type) {
    case "percent":
      return `${sign}${(delta * 100).toFixed(1)}%`;
    case "currency":
      return `${sign}${formatCurrency(Math.abs(delta))}`;
    default:
      return `${sign}${formatNumber(delta)}`;
  }
}

export function formatDeltaPercent(deltaPercent: number): string {
  const sign = deltaPercent > 0 ? "+" : "";
  return `${sign}${deltaPercent.toFixed(1)}%`;
}

/* ─── Date Range Helpers ─── */
export function getDateRange(period: ComparisonPeriod): ComparisonDateRange {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let current: DateRange;
  let previous: DateRange;

  switch (period) {
    case "yesterday": {
      const dayBefore = new Date(yesterday);
      dayBefore.setDate(dayBefore.getDate() - 1);
      current = {
        startDate: toISODate(yesterday),
        endDate: toISODate(yesterday),
        label: "Yesterday",
      };
      previous = {
        startDate: toISODate(dayBefore),
        endDate: toISODate(dayBefore),
        label: "Day before",
      };
      break;
    }
    case "7d": {
      const start7 = new Date(yesterday);
      start7.setDate(start7.getDate() - 6);
      const prevEnd7 = new Date(start7);
      prevEnd7.setDate(prevEnd7.getDate() - 1);
      const prevStart7 = new Date(prevEnd7);
      prevStart7.setDate(prevStart7.getDate() - 6);
      current = {
        startDate: toISODate(start7),
        endDate: toISODate(yesterday),
        label: "Last 7 days",
      };
      previous = {
        startDate: toISODate(prevStart7),
        endDate: toISODate(prevEnd7),
        label: "Previous 7 days",
      };
      break;
    }
    case "30d":
    default: {
      const start30 = new Date(yesterday);
      start30.setDate(start30.getDate() - 29);
      const prevEnd30 = new Date(start30);
      prevEnd30.setDate(prevEnd30.getDate() - 1);
      const prevStart30 = new Date(prevEnd30);
      prevStart30.setDate(prevStart30.getDate() - 29);
      current = {
        startDate: toISODate(start30),
        endDate: toISODate(yesterday),
        label: "Last 30 days",
      };
      previous = {
        startDate: toISODate(prevStart30),
        endDate: toISODate(prevEnd30),
        label: "Previous 30 days",
      };
      break;
    }
  }

  return { current, previous, period };
}
