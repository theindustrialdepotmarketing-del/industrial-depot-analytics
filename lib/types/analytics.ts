import { z } from "zod";

/* ─── GA4 Metric Names ─── */
export const GA4MetricName = {
  ACTIVE_USERS: "activeUsers",
  NEW_USERS: "newUsers",
  SESSIONS: "sessions",
  ENGAGED_SESSIONS: "engagedSessions",
  ENGAGEMENT_RATE: "engagementRate",
  CONVERSIONS: "conversions",
  SESSION_CONVERSION_RATE: "sessionConversionRate",
  TOTAL_REVENUE: "totalRevenue",
  BOUNCE_RATE: "bounceRate",
  AVERAGE_SESSION_DURATION: "averageSessionDuration",
  SCREEN_PAGE_VIEWS: "screenPageViews",
  SESSIONS_PER_USER: "sessionsPerUser",
} as const;

/* ─── Overview Metrics ─── */
export const OverviewMetricsSchema = z.object({
  activeUsers: z.number(),
  newUsers: z.number(),
  sessions: z.number(),
  engagedSessions: z.number(),
  engagementRate: z.number(),
  conversions: z.number(),
  sessionConversionRate: z.number(),
  totalRevenue: z.number(),
  period: z.string(),
});
export type OverviewMetrics = z.infer<typeof OverviewMetricsSchema>;

/* ─── Acquisition / Channel ─── */
export const ChannelDataSchema = z.object({
  channel: z.string(),
  sessions: z.number(),
  newUsers: z.number(),
  engagementRate: z.number(),
  conversions: z.number(),
  revenue: z.number(),
  status: z.enum(["continue", "optimize", "watch", "review"] as [string, ...string[]]),
});
export type ChannelData = z.infer<typeof ChannelDataSchema>;

/* ─── Campaign ─── */
export const CampaignDataSchema = z.object({
  campaign: z.string(),
  source: z.string(),
  medium: z.string(),
  sessions: z.number(),
  newUsers: z.number(),
  engagementRate: z.number(),
  conversions: z.number(),
  revenue: z.number(),
  cost: z.number().optional(),
  roas: z.number().optional(),
  status: z.enum(["continue", "optimize", "watch", "review"] as [string, ...string[]]),
});
export type CampaignData = z.infer<typeof CampaignDataSchema>;

/* ─── Landing Page ─── */
export const LandingPageDataSchema = z.object({
  pagePath: z.string(),
  pageTitle: z.string(),
  sessions: z.number(),
  newUsers: z.number(),
  engagementRate: z.number(),
  conversions: z.number(),
  conversionRate: z.number(),
  bounceRate: z.number(),
  status: z.enum(["continue", "optimize", "watch", "review"] as [string, ...string[]]),
});
export type LandingPageData = z.infer<typeof LandingPageDataSchema>;

/* ─── Conversion / Key Event ─── */
export const ConversionDataSchema = z.object({
  eventName: z.string(),
  eventCount: z.number(),
  sessions: z.number(),
  conversionRate: z.number(),
  revenue: z.number(),
});
export type ConversionData = z.infer<typeof ConversionDataSchema>;

/* ─── Chart Data Point ─── */
export const ChartDataPointSchema = z.object({
  date: z.string(),
  value: z.number(),
  previousValue: z.number().optional(),
  label: z.string().optional(),
});
export type ChartDataPoint = z.infer<typeof ChartDataPointSchema>;

/* ─── Sync Response ─── */
export const SyncResponseSchema = z.object({
  success: z.boolean(),
  synced: z.number().optional(),
  message: z.string(),
  timestamp: z.string(),
});
export type SyncResponse = z.infer<typeof SyncResponseSchema>;
