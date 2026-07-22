import "server-only";

import { getSupabaseServerClient } from "@/lib/supabase/server";

export type PeriodKey = "yesterday" | "7d" | "30d" | "90d";

export interface DateRangePair {
  current: { startDate: string; endDate: string };
  previous: { startDate: string; endDate: string };
  period: PeriodKey;
}

/**
 * Calculates start & end dates (YYYY-MM-DD) for current and previous comparative periods.
 * Ends at yesterday to avoid partial today data. Timezone: America/New_York (UTC offset adjusted).
 */
export function getDateRanges(period: PeriodKey): DateRangePair {
  const now = new Date();

  // Get yesterday in UTC
  const yesterday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));

  let days = 30;
  if (period === "yesterday") days = 1;
  else if (period === "7d") days = 7;
  else if (period === "30d") days = 30;
  else if (period === "90d") days = 90;

  const currentEnd = new Date(yesterday);
  const currentStart = new Date(yesterday);
  currentStart.setUTCDate(currentStart.getUTCDate() - (days - 1));

  const previousEnd = new Date(currentStart);
  previousEnd.setUTCDate(previousEnd.getUTCDate() - 1);

  const previousStart = new Date(previousEnd);
  previousStart.setUTCDate(previousStart.getUTCDate() - (days - 1));

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  return {
    current: {
      startDate: formatDate(currentStart),
      endDate: formatDate(currentEnd),
    },
    previous: {
      startDate: formatDate(previousStart),
      endDate: formatDate(previousEnd),
    },
    period,
  };
}

/**
 * Helper to compute percentage change & trend direction
 */
export function computeDelta(current: number, previous: number) {
  const delta = current - previous;
  let percentChange = 0;
  if (previous > 0) {
    percentChange = Number(((delta / previous) * 100).toFixed(2));
  } else if (current > 0) {
    percentChange = 100;
  }

  let trend: "up" | "down" | "neutral" = "neutral";
  if (percentChange > 0.5) trend = "up";
  else if (percentChange < -0.5) trend = "down";

  return { delta, percentChange, trend };
}

/**
 * Aggregates Overview KPIs & Daily Trends from Supabase daily_metrics
 */
export async function getOverviewMetrics(period: PeriodKey = "30d") {
  const supabase = getSupabaseServerClient();
  const ranges = getDateRanges(period);

  if (!supabase) {
    throw new Error("Supabase server client not initialized.");
  }

  // Fetch current period daily metrics
  const { data: currDailyRaw } = await supabase
    .from("daily_metrics")
    .select("*")
    .gte("metric_date", ranges.current.startDate)
    .lte("metric_date", ranges.current.endDate)
    .order("metric_date", { ascending: true });

  // Fetch previous period daily metrics
  const { data: prevDailyRaw } = await supabase
    .from("daily_metrics")
    .select("*")
    .gte("metric_date", ranges.previous.startDate)
    .lte("metric_date", ranges.previous.endDate);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currDaily: any[] = currDailyRaw || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevDaily: any[] = prevDailyRaw || [];

  // Sum current period
  const currUsers = currDaily.reduce((acc, row) => acc + (row.active_users || 0), 0);
  const currNewUsers = currDaily.reduce((acc, row) => acc + (row.new_users || 0), 0);
  const currSessions = currDaily.reduce((acc, row) => acc + (row.sessions || 0), 0);
  const currEngaged = currDaily.reduce((acc, row) => acc + (row.engaged_sessions || 0), 0);
  const currDuration = currDaily.reduce((acc, row) => acc + (row.average_session_duration || 0), 0);
  const currEvents = currDaily.reduce((acc, row) => acc + (row.key_events || 0), 0);
  const currRevenue = currDaily.reduce((acc, row) => acc + (row.total_revenue || 0), 0);

  const currEngagementRate = currSessions > 0 ? currEngaged / currSessions : 0;
  const currAvgDuration = currDaily.length > 0 ? currDuration / currDaily.length : 0;
  const currKeyEventRate = currSessions > 0 ? currEvents / currSessions : 0;

  // Sum previous period
  const prevUsers = prevDaily.reduce((acc, row) => acc + (row.active_users || 0), 0);
  const prevNewUsers = prevDaily.reduce((acc, row) => acc + (row.new_users || 0), 0);
  const prevSessions = prevDaily.reduce((acc, row) => acc + (row.sessions || 0), 0);
  const prevEngaged = prevDaily.reduce((acc, row) => acc + (row.engaged_sessions || 0), 0);
  const prevDuration = prevDaily.reduce((acc, row) => acc + (row.average_session_duration || 0), 0);
  const prevEvents = prevDaily.reduce((acc, row) => acc + (row.key_events || 0), 0);
  const prevRevenue = prevDaily.reduce((acc, row) => acc + (row.total_revenue || 0), 0);

  const prevEngagementRate = prevSessions > 0 ? prevEngaged / prevSessions : 0;
  const prevAvgDuration = prevDaily.length > 0 ? prevDuration / prevDaily.length : 0;
  const prevKeyEventRate = prevSessions > 0 ? prevEvents / prevSessions : 0;

  // Build KPI objects
  const kpis = {
    activeUsers: {
      key: "activeUsers",
      label: "Usuarios Activos",
      value: currUsers,
      prevValue: prevUsers,
      ...computeDelta(currUsers, prevUsers),
    },
    newUsers: {
      key: "newUsers",
      label: "Nuevos Usuarios",
      value: currNewUsers,
      prevValue: prevNewUsers,
      ...computeDelta(currNewUsers, prevNewUsers),
    },
    sessions: {
      key: "sessions",
      label: "Sesiones Totales",
      value: currSessions,
      prevValue: prevSessions,
      ...computeDelta(currSessions, prevSessions),
    },
    engagedSessions: {
      key: "engagedSessions",
      label: "Sesiones Enganchadas",
      value: currEngaged,
      prevValue: prevEngaged,
      ...computeDelta(currEngaged, prevEngaged),
    },
    engagementRate: {
      key: "engagementRate",
      label: "Tasa de Engagement",
      value: currEngagementRate,
      prevValue: prevEngagementRate,
      isPercent: true,
      ...computeDelta(currEngagementRate, prevEngagementRate),
    },
    averageSessionDuration: {
      key: "averageSessionDuration",
      label: "Duración Prom. Sesión",
      value: currAvgDuration,
      prevValue: prevAvgDuration,
      isSeconds: true,
      ...computeDelta(currAvgDuration, prevAvgDuration),
    },
    keyEvents: {
      key: "keyEvents",
      label: "Key Events (Conversiones)",
      value: currEvents,
      prevValue: prevEvents,
      ...computeDelta(currEvents, prevEvents),
    },
    sessionKeyEventRate: {
      key: "sessionKeyEventRate",
      label: "Tasa de Conversión",
      value: currKeyEventRate,
      prevValue: prevKeyEventRate,
      isPercent: true,
      ...computeDelta(currKeyEventRate, prevKeyEventRate),
    },
    totalRevenue: {
      key: "totalRevenue",
      label: "Ingresos Totales",
      value: currRevenue,
      prevValue: prevRevenue,
      isCurrency: true,
      ...computeDelta(currRevenue, prevRevenue),
    },
  };

  // Build daily trend line array
  const dailyTrends = currDaily.map((row) => ({
    date: row.metric_date,
    activeUsers: row.active_users || 0,
    sessions: row.sessions || 0,
    keyEvents: row.key_events || 0,
    engagementRate: row.engagement_rate || 0,
    revenue: row.total_revenue || 0,
  }));

  return {
    ranges,
    kpis,
    dailyTrends,
  };
}

/**
 * Aggregates Acquisition Channels & Source/Medium metrics from campaign_metrics
 */
export async function getAcquisitionMetrics(period: PeriodKey = "30d") {
  const supabase = getSupabaseServerClient();
  const ranges = getDateRanges(period);

  if (!supabase) {
    throw new Error("Supabase server client not initialized.");
  }

  const { data: currCampaignsRaw } = await supabase
    .from("campaign_metrics")
    .select("*")
    .gte("metric_date", ranges.current.startDate)
    .lte("metric_date", ranges.current.endDate);

  const { data: prevCampaignsRaw } = await supabase
    .from("campaign_metrics")
    .select("*")
    .gte("metric_date", ranges.previous.startDate)
    .lte("metric_date", ranges.previous.endDate);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currCampaigns: any[] = currCampaignsRaw || [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevCampaigns: any[] = prevCampaignsRaw || [];

  // Group by channel_group for current period
  const channelMap = new Map<string, {
    channel: string;
    users: number;
    sessions: number;
    engagedSessions: number;
    keyEvents: number;
    revenue: number;
  }>();

  for (const row of currCampaigns) {
    const ch = row.channel_group || "Unassigned";
    const existing = channelMap.get(ch) || {
      channel: ch,
      users: 0,
      sessions: 0,
      engagedSessions: 0,
      keyEvents: 0,
      revenue: 0,
    };
    existing.users += row.active_users || 0;
    existing.sessions += row.sessions || 0;
    existing.engagedSessions += row.engaged_sessions || 0;
    existing.keyEvents += row.key_events || 0;
    existing.revenue += row.total_revenue || 0;
    channelMap.set(ch, existing);
  }

  // Previous period channel totals
  const prevChannelMap = new Map<string, { sessions: number; keyEvents: number }>();
  for (const row of prevCampaigns) {
    const ch = row.channel_group || "Unassigned";
    const existing = prevChannelMap.get(ch) || { sessions: 0, keyEvents: 0 };
    existing.sessions += row.sessions || 0;
    existing.keyEvents += row.key_events || 0;
    prevChannelMap.set(ch, existing);
  }

  // Build Channel array with comparative percentage changes
  const channels = Array.from(channelMap.values()).map((c) => {
    const prev = prevChannelMap.get(c.channel) || { sessions: 0, keyEvents: 0 };
    const changeSessionsPercent = computeDelta(c.sessions, prev.sessions).percentChange;
    const changeEventsPercent = computeDelta(c.keyEvents, prev.keyEvents).percentChange;
    const engagementRate = c.sessions > 0 ? c.engagedSessions / c.sessions : 0;
    const conversionRate = c.sessions > 0 ? c.keyEvents / c.sessions : 0;

    return {
      ...c,
      engagementRate,
      conversionRate,
      changeSessionsPercent,
      changeEventsPercent,
    };
  }).sort((a, b) => b.sessions - a.sessions);

  // Group by Source / Medium for top 20 breakdown
  const sourceMediumMap = new Map<string, {
    source: string;
    medium: string;
    channel: string;
    users: number;
    sessions: number;
    keyEvents: number;
    revenue: number;
  }>();

  for (const row of currCampaigns) {
    const key = `${row.source || "(not set)"} / ${row.medium || "(not set)"}`;
    const existing = sourceMediumMap.get(key) || {
      source: row.source || "(not set)",
      medium: row.medium || "(not set)",
      channel: row.channel_group || "Unassigned",
      users: 0,
      sessions: 0,
      keyEvents: 0,
      revenue: 0,
    };
    existing.users += row.active_users || 0;
    existing.sessions += row.sessions || 0;
    existing.keyEvents += row.key_events || 0;
    existing.revenue += row.total_revenue || 0;
    sourceMediumMap.set(key, existing);
  }

  const sourceMediums = Array.from(sourceMediumMap.values()).sort((a, b) => b.sessions - a.sessions);

  return {
    ranges,
    channels,
    sourceMediums,
  };
}

/**
 * Aggregates Landing Page & Page Path metrics from page_metrics
 */
export async function getPagesMetrics(period: PeriodKey = "30d") {
  const supabase = getSupabaseServerClient();
  const ranges = getDateRanges(period);

  if (!supabase) {
    throw new Error("Supabase server client not initialized.");
  }

  const { data: currPagesRaw } = await supabase
    .from("page_metrics")
    .select("*")
    .gte("metric_date", ranges.current.startDate)
    .lte("metric_date", ranges.current.endDate);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currPages: any[] = currPagesRaw || [];

  const pageMap = new Map<string, {
    landingPage: string;
    pagePath: string;
    pageTitle: string;
    views: number;
    users: number;
    sessions: number;
    engaged: number;
    duration: number;
    keyEvents: number;
    revenue: number;
  }>();

  for (const row of currPages) {
    const key = row.landing_page || row.page_path || "(not set)";
    const existing = pageMap.get(key) || {
      landingPage: row.landing_page || "(not set)",
      pagePath: row.page_path || "/",
      pageTitle: row.page_title || "(not set)",
      views: 0,
      users: 0,
      sessions: 0,
      engaged: 0,
      duration: 0,
      keyEvents: 0,
      revenue: 0,
    };
    existing.views += row.screen_page_views || 0;
    existing.users += row.active_users || 0;
    existing.sessions += row.sessions || 0;
    existing.engaged += row.engaged_sessions || 0;
    existing.duration += row.user_engagement_duration || 0;
    existing.keyEvents += row.key_events || 0;
    existing.revenue += row.total_revenue || 0;
    pageMap.set(key, existing);
  }

  const pages = Array.from(pageMap.values()).map((p) => ({
    ...p,
    engagementRate: p.sessions > 0 ? p.engaged / p.sessions : 0,
    avgDuration: p.sessions > 0 ? p.duration / p.sessions : 0,
  })).sort((a, b) => b.sessions - a.sessions);

  return {
    ranges,
    pages,
  };
}

/**
 * Aggregates Audience & Device metrics from audience_metrics
 */
export async function getAudienceMetrics(period: PeriodKey = "30d") {
  const supabase = getSupabaseServerClient();
  const ranges = getDateRanges(period);

  if (!supabase) {
    throw new Error("Supabase server client not initialized.");
  }

  const { data: currAudienceRaw } = await supabase
    .from("audience_metrics")
    .select("*")
    .gte("metric_date", ranges.current.startDate)
    .lte("metric_date", ranges.current.endDate);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currAudience: any[] = currAudienceRaw || [];

  const deviceMap = new Map<string, { device: string; users: number; sessions: number; keyEvents: number; revenue: number }>();
  const countryMap = new Map<string, { country: string; users: number; sessions: number; keyEvents: number; revenue: number }>();

  for (const row of currAudience) {
    const dev = row.device_category || "desktop";
    const existingDev = deviceMap.get(dev) || { device: dev, users: 0, sessions: 0, keyEvents: 0, revenue: 0 };
    existingDev.users += row.active_users || 0;
    existingDev.sessions += row.sessions || 0;
    existingDev.keyEvents += row.key_events || 0;
    existingDev.revenue += row.total_revenue || 0;
    deviceMap.set(dev, existingDev);

    const country = row.country || "(not set)";
    const existingCountry = countryMap.get(country) || { country, users: 0, sessions: 0, keyEvents: 0, revenue: 0 };
    existingCountry.users += row.active_users || 0;
    existingCountry.sessions += row.sessions || 0;
    existingCountry.keyEvents += row.key_events || 0;
    existingCountry.revenue += row.total_revenue || 0;
    countryMap.set(country, existingCountry);
  }

  const devices = Array.from(deviceMap.values()).map((d) => ({
    ...d,
    conversionRate: d.sessions > 0 ? d.keyEvents / d.sessions : 0,
  })).sort((a, b) => b.sessions - a.sessions);

  const countries = Array.from(countryMap.values()).map((c) => ({
    ...c,
    conversionRate: c.sessions > 0 ? c.keyEvents / c.sessions : 0,
  })).sort((a, b) => b.sessions - a.sessions);

  return {
    ranges,
    devices,
    countries,
  };
}
