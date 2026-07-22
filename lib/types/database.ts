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

/* ─── Sync Logs ─── */
export const SyncLogSchema = z.object({
  id: z.string().optional(),
  company_id: z.string().optional(),
  sync_type: z.enum(["daily", "manual", "backfill"] as [string, ...string[]]),
  status: z.enum(["running", "success", "partial", "failed"] as [string, ...string[]]),
  started_at: z.string(),
  completed_at: z.string().nullable().optional(),
  records_created: z.number().optional(),
  records_updated: z.number().optional(),
  error_message: z.string().nullable().optional(),
  created_at: z.string().optional(),
});
export type SyncLog = z.infer<typeof SyncLogSchema>;

/* ─── Backfill Request & Response Schemas ─── */
export const BackfillRequestSchema = z.object({
  days: z.union([z.literal(30), z.literal(60), z.literal(90), z.literal(180)]),
  action: z.enum(["start", "continue", "status"] as [string, ...string[]]).optional().default("start"),
});
export type BackfillRequest = z.infer<typeof BackfillRequestSchema>;

export const BackfillProgressSchema = z.object({
  totalChunks: z.number(),
  completedChunks: z.number(),
  percent: z.number(),
  recordsProcessed: z.number(),
  lastProcessedRange: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }).optional(),
});
export type BackfillProgress = z.infer<typeof BackfillProgressSchema>;

export const BackfillResponseSchema = z.object({
  success: z.boolean(),
  status: z.enum(["running", "success", "partial", "failed"] as [string, ...string[]]),
  syncLogId: z.string().optional(),
  requestedDays: z.number().optional(),
  progress: BackfillProgressSchema.optional(),
  hasMoreChunks: z.boolean(),
  message: z.string().optional(),
  error: z.string().optional(),
});
export type BackfillResponse = z.infer<typeof BackfillResponseSchema>;

/* ─── Daily Metrics ─── */
export const DailyMetricsSchema = z.object({
  id: z.string().optional(),
  company_id: z.string(),
  metric_date: z.string(),
  active_users: z.number(),
  new_users: z.number(),
  sessions: z.number(),
  engaged_sessions: z.number(),
  engagement_rate: z.number(),
  average_session_duration: z.number(),
  key_events: z.number(),
  session_key_event_rate: z.number(),
  total_revenue: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type DailyMetrics = z.infer<typeof DailyMetricsSchema>;

/* ─── Campaign Metrics ─── */
export const CampaignMetricsSchema = z.object({
  id: z.string().optional(),
  company_id: z.string(),
  metric_date: z.string(),
  channel_group: z.string(),
  source: z.string(),
  medium: z.string(),
  campaign_name: z.string(),
  active_users: z.number(),
  new_users: z.number(),
  sessions: z.number(),
  engaged_sessions: z.number(),
  engagement_rate: z.number(),
  key_events: z.number(),
  session_key_event_rate: z.number(),
  total_revenue: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type CampaignMetrics = z.infer<typeof CampaignMetricsSchema>;

/* ─── Page Metrics ─── */
export const PageMetricsSchema = z.object({
  id: z.string().optional(),
  company_id: z.string(),
  metric_date: z.string(),
  landing_page: z.string(),
  page_path: z.string(),
  page_title: z.string(),
  screen_page_views: z.number(),
  active_users: z.number(),
  sessions: z.number(),
  engaged_sessions: z.number(),
  engagement_rate: z.number(),
  user_engagement_duration: z.number(),
  key_events: z.number(),
  total_revenue: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type PageMetrics = z.infer<typeof PageMetricsSchema>;

/* ─── Audience Metrics ─── */
export const AudienceMetricsSchema = z.object({
  id: z.string().optional(),
  company_id: z.string(),
  metric_date: z.string(),
  device_category: z.string(),
  country: z.string(),
  region: z.string(),
  city: z.string(),
  active_users: z.number(),
  new_users: z.number(),
  sessions: z.number(),
  engagement_rate: z.number(),
  key_events: z.number(),
  total_revenue: z.number(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type AudienceMetrics = z.infer<typeof AudienceMetricsSchema>;

/* ─── Sync Result ─── */
export const SyncResultSchema = z.object({
  success: z.boolean(),
  status: z.enum(["success", "partial", "failed"] as [string, ...string[]]),
  syncedDate: z.string(),
  recordsProcessed: z.number(),
  recordsCreated: z.number(),
  recordsUpdated: z.number(),
  details: z.object({
    dailyMetrics: z.number(),
    campaignMetrics: z.number(),
    pageMetrics: z.number(),
    audienceMetrics: z.number(),
  }),
  startedAt: z.string(),
  completedAt: z.string(),
  message: z.string().optional(),
  error: z.string().optional(),
});
export type SyncResult = z.infer<typeof SyncResultSchema>;

/* ─── Alert ─── */
export const AlertSeverityEnum = z.enum(["info", "low", "medium", "high", "critical"] as [string, ...string[]]);
export type AlertSeverity = z.infer<typeof AlertSeverityEnum>;

export const AlertStatusEnum = z.enum(["open", "reviewing", "resolved", "dismissed"] as [string, ...string[]]);
export type AlertStatus = z.infer<typeof AlertStatusEnum>;

export interface AlertEvidence {
  ruleId?: string;
  affectedEntity?: string;
  currentValue?: number | null;
  previousValue?: number | null;
  percentageChange?: number | null;
  proposedAction?: string;
  targetMetric?: string;
  period?: string;
  [key: string]: unknown;
}

export const AlertSchema = z.object({
  id: z.string().optional(),
  company_id: z.string().optional(),
  alert_date: z.string().optional(),
  category: z.string(),
  severity: AlertSeverityEnum,
  title: z.string(),
  description: z.string(),
  evidence: z.record(z.string(), z.unknown()).optional(),
  signature: z.string().optional(),
  status: AlertStatusEnum,
  created_at: z.string().optional(),
  resolved_at: z.string().nullable().optional(),
});
export type Alert = z.infer<typeof AlertSchema>;

/* ─── Recommendation ─── */
export const RecommendationPriorityEnum = z.enum(["low", "medium", "high", "critical"] as [string, ...string[]]);
export type RecommendationPriority = z.infer<typeof RecommendationPriorityEnum>;

export const RecommendationStatusEnum = z.enum(["pending", "in_progress", "completed", "dismissed"] as [string, ...string[]]);
export type RecommendationStatus = z.infer<typeof RecommendationStatusEnum>;

export const RecommendationSchema = z.object({
  id: z.string().optional(),
  alert_id: z.string().optional(),
  title: z.string(),
  problem: z.string(),
  evidence: z.string(),
  proposed_action: z.string(),
  expected_impact: z.string(),
  priority: RecommendationPriorityEnum,
  target_metric: z.string().optional(),
  recommended_date: z.string().optional(),
  status: RecommendationStatusEnum,
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Recommendation = z.infer<typeof RecommendationSchema>;

/* ─── Task ─── */
export const TaskStatusEnum = z.enum(["pending", "in_progress", "done", "cancelled"] as [string, ...string[]]);
export type TaskStatus = z.infer<typeof TaskStatusEnum>;

export const TaskPriorityEnum = z.enum(["low", "medium", "high", "critical"] as [string, ...string[]]);
export type TaskPriority = z.infer<typeof TaskPriorityEnum>;

export const TaskSchema = z.object({
  id: z.string().optional(),
  recommendation_id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  status: TaskStatusEnum,
  priority: TaskPriorityEnum,
  due_date: z.string().nullable().optional(),
  assigned_to: z.string().nullable().optional(),
  target_metric: z.string().optional(),
  tags: z.array(z.string()).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Task = z.infer<typeof TaskSchema>;

/* ─── Database Tables (for Supabase client typing) ─── */
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company;
        Insert: Partial<Company>;
        Update: Partial<Company>;
      };
      sync_logs: {
        Row: SyncLog;
        Insert: Partial<SyncLog>;
        Update: Partial<SyncLog>;
      };
      daily_metrics: {
        Row: DailyMetrics;
        Insert: Partial<DailyMetrics>;
        Update: Partial<DailyMetrics>;
      };
      campaign_metrics: {
        Row: CampaignMetrics;
        Insert: Partial<CampaignMetrics>;
        Update: Partial<CampaignMetrics>;
      };
      page_metrics: {
        Row: PageMetrics;
        Insert: Partial<PageMetrics>;
        Update: Partial<PageMetrics>;
      };
      audience_metrics: {
        Row: AudienceMetrics;
        Insert: Partial<AudienceMetrics>;
        Update: Partial<AudienceMetrics>;
      };
      alerts: {
        Row: Alert;
        Insert: Partial<Alert>;
        Update: Partial<Alert>;
      };
      recommendations: {
        Row: Recommendation;
        Insert: Partial<Recommendation>;
        Update: Partial<Recommendation>;
      };
      tasks: {
        Row: Task;
        Insert: Partial<Task>;
        Update: Partial<Task>;
      };
    };
  };
}
