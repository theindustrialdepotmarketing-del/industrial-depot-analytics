import { z } from "zod";

/* ─── Company ─── */
export const CompanySchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  ga4_property_id: z.string(),
  timezone: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Company = z.infer<typeof CompanySchema>;

export const TestSupabaseResponseSchema = z.object({
  success: z.boolean(),
  companyName: z.string().optional(),
  propertyId: z.string().optional(),
  timezone: z.string().optional(),
  databaseConnected: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});
export type TestSupabaseResponse = z.infer<typeof TestSupabaseResponseSchema>;

/* ─── Metrics Snapshot (stored in Supabase) ─── */
export const MetricsSnapshotSchema = z.object({
  id: z.string().uuid(),
  property_id: z.string(),
  date: z.string(),           // YYYY-MM-DD
  period: z.enum(["day", "week", "month"] as [string, ...string[]]),
  active_users: z.number(),
  new_users: z.number(),
  sessions: z.number(),
  engaged_sessions: z.number(),
  engagement_rate: z.number(),
  conversions: z.number(),
  session_conversion_rate: z.number(),
  total_revenue: z.number(),
  raw_json: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type MetricsSnapshot = z.infer<typeof MetricsSnapshotSchema>;

/* ─── Alert ─── */
export const AlertSeverityEnum = z.enum(["info", "warning", "critical"] as [string, ...string[]]);
export type AlertSeverity = z.infer<typeof AlertSeverityEnum>;

export const AlertSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  severity: AlertSeverityEnum,
  metric: z.string().optional(),
  threshold: z.number().optional(),
  current_value: z.number().optional(),
  is_read: z.boolean(),
  is_resolved: z.boolean(),
  created_at: z.string(),
  resolved_at: z.string().nullable().optional(),
});
export type Alert = z.infer<typeof AlertSchema>;

/* ─── Task ─── */
export const TaskStatusEnum = z.enum(["pending", "in_progress", "done", "cancelled"] as [string, ...string[]]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskPriorityEnum = z.enum(["low", "medium", "high", "critical"] as [string, ...string[]]);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  due_date: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  created_at: z.string(),
  updated_at: z.string(),
});
export type Task = z.infer<typeof TaskSchema>;

/* ─── Report ─── */
export const ReportStatusEnum = z.enum(["draft", "generating", "ready", "failed"] as [string, ...string[]]);
export type ReportStatus = z.infer<typeof ReportStatusEnum>;

export const ReportSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().optional(),
  status: ReportStatusEnum,
  period_start: z.string(),
  period_end: z.string(),
  file_url: z.string().nullable().optional(),
  metrics_snapshot: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string(),
  generated_at: z.string().nullable().optional(),
});
export type Report = z.infer<typeof ReportSchema>;

/* ─── Settings ─── */
export const AppSettingsSchema = z.object({
  id: z.string(),
  ga4_property_id: z.string().optional(),
  ga4_connected: z.boolean(),
  supabase_connected: z.boolean(),
  cron_enabled: z.boolean(),
  cron_schedule: z.string().optional(),
  alert_email: z.string().email().optional(),
  timezone: z.string().optional(),
  updated_at: z.string(),
});
export type AppSettings = z.infer<typeof AppSettingsSchema>;

/* ─── Database Tables (for Supabase client typing) ─── */
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Partial<Company>;
        Update: Partial<Company>;
      };
      metrics_snapshots: {
        Row: MetricsSnapshot;
        Insert: Omit<MetricsSnapshot, "id" | "created_at" | "updated_at">;
        Update: Partial<MetricsSnapshot>;
      };
      alerts: {
        Row: Alert;
        Insert: Omit<Alert, "id" | "created_at">;
        Update: Partial<Alert>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, "id" | "created_at" | "updated_at">;
        Update: Partial<Task>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, "id" | "created_at">;
        Update: Partial<Report>;
      };
      app_settings: {
        Row: AppSettings;
        Insert: Partial<AppSettings>;
        Update: Partial<AppSettings>;
      };
    };
  };
}
