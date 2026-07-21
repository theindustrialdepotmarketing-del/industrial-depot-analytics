import { z } from "zod";

/* ─── Enums ─── */
export const StatusEnum = z.enum(["continue", "optimize", "watch", "review"] as [string, ...string[]]);
export type Status = z.infer<typeof StatusEnum>;

export const ComparisonPeriodEnum = z.enum(["yesterday", "7d", "30d"] as [string, ...string[]]);
export type ComparisonPeriod = z.infer<typeof ComparisonPeriodEnum>;

export const TrendDirectionEnum = z.enum(["up", "down", "neutral"] as [string, ...string[]]);
export type TrendDirection = z.infer<typeof TrendDirectionEnum>;

/* ─── Navigation ─── */
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  badge?: number;
}

/* ─── Table ─── */
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  align?: "left" | "right" | "center";
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
}

/* ─── Date Range ─── */
export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

export interface ComparisonDateRange {
  current: DateRange;
  previous: DateRange;
  period: ComparisonPeriod;
}

/* ─── Metric Value ─── */
export const MetricValueSchema = z.object({
  value: z.number(),
  formattedValue: z.string(),
});
export type MetricValue = z.infer<typeof MetricValueSchema>;

export const MetricComparisonSchema = z.object({
  current: z.number(),
  previous: z.number(),
  delta: z.number(),         // absolute change
  deltaPercent: z.number(),  // percentage change
  trend: TrendDirectionEnum,
});
export type MetricComparison = z.infer<typeof MetricComparisonSchema>;

/* ─── UI State ─── */
export type LoadingState = "idle" | "loading" | "success" | "error";

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}
