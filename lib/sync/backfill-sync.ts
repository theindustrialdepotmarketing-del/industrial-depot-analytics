import "server-only";
import { getGA4ClientWithDiagnostics } from "@/lib/google/analytics";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { BackfillResponse, Company, SyncLog } from "@/lib/types/database";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "properties/502218884";
const FORMATTED_PROPERTY = PROPERTY_ID.startsWith("properties/")
  ? PROPERTY_ID
  : `properties/${PROPERTY_ID}`;

export interface BackfillChunk {
  index: number;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  daysCount: number;
}

export interface BackfillMetadata {
  requestedDays: number;
  totalChunks: number;
  completedChunks: number;
  currentChunkIndex: number;
  totalRecords: number;
  chunks: BackfillChunk[];
}

/**
 * Generates contiguous 7-day UTC chunks from (daysCount) days ago ending at yesterday.
 */
export function generateBackfillChunks(daysCount: number, chunkSize = 7): BackfillChunk[] {
  const endDateObj = new Date();
  endDateObj.setUTCDate(endDateObj.getUTCDate() - 1); // yesterday

  const startDateObj = new Date(endDateObj);
  startDateObj.setUTCDate(startDateObj.getUTCDate() - (daysCount - 1));

  const chunks: BackfillChunk[] = [];
  let currentStart = new Date(startDateObj);
  let index = 0;

  while (currentStart <= endDateObj) {
    const currentEnd = new Date(currentStart);
    currentEnd.setUTCDate(currentEnd.getUTCDate() + (chunkSize - 1));

    if (currentEnd > endDateObj) {
      currentEnd.setTime(endDateObj.getTime());
    }

    const startStr = currentStart.toISOString().split("T")[0];
    const endStr = currentEnd.toISOString().split("T")[0];
    const diffDays =
      Math.round((currentEnd.getTime() - currentStart.getTime()) / (1000 * 3600 * 24)) + 1;

    chunks.push({
      index,
      startDate: startStr,
      endDate: endStr,
      daysCount: diffDays,
    });

    index++;
    currentStart = new Date(currentEnd);
    currentStart.setUTCDate(currentStart.getUTCDate() + 1);
  }

  return chunks;
}

function normDim(val: string | undefined | null): string {
  if (!val || val.trim() === "" || val === "(not set)") {
    return "(not set)";
  }
  return val.trim();
}

/**
 * Executes batch upserts to Supabase in chunks to prevent payload limit issues.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function batchUpsert(supabase: any, tableName: string, rows: any[], batchSize = 250) {
  if (!rows || rows.length === 0) return;
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(tableName).upsert(chunk);
    if (error) {
      console.error(`[Backfill Batch Error] ${tableName}:`, error.message);
    }
  }
}

/**
 * Core server-side backfill engine.
 * Processes 1 chunk (7 days) per call to guarantee high resilience & no Vercel timeouts.
 */
export async function runBackfillStep(
  days: 30 | 60 | 90 | 180 = 90,
  action: "start" | "continue" | "status" = "start"
): Promise<BackfillResponse> {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    throw new Error("No se pudo instanciar el cliente de Supabase.");
  }

  // Fetch Company
  const { data: companyData } = await supabase
    .from("companies")
    .select("*")
    .eq("ga4_property_id", "502218884")
    .maybeSingle();

  const company = companyData as Company | null;
  const companyId = company?.id || "industrial_depot_company";

  // Check for an active running backfill job
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: activeLogData } = await (supabase as any)
    .from("sync_logs")
    .select("*")
    .eq("sync_type", "backfill")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const activeLog = activeLogData as SyncLog | null;

  // Status check action
  if (action === "status") {
    if (!activeLog) {
      // Check last finished log
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: lastLogData } = await (supabase as any)
        .from("sync_logs")
        .select("*")
        .eq("sync_type", "backfill")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastLog = lastLogData as SyncLog | null;

      if (!lastLog) {
        return {
          success: true,
          status: "success",
          hasMoreChunks: false,
          message: "No hay registros de carga histórica previas.",
        };
      }

      return {
        success: true,
        status: (lastLog.status as "success" | "running" | "partial" | "failed") || "success",
        syncLogId: lastLog.id,
        hasMoreChunks: false,
        message: `Última carga histórica finalizada con estado: ${lastLog.status}`,
      };
    }

    let meta: BackfillMetadata | null = null;
    try {
      meta = activeLog.error_message ? JSON.parse(activeLog.error_message) : null;
    } catch {
      meta = null;
    }

    const totalChunks = meta?.totalChunks || 1;
    const completedChunks = meta?.completedChunks || 0;
    const percent = Number(((completedChunks / totalChunks) * 100).toFixed(1));

    return {
      success: true,
      status: "running",
      syncLogId: activeLog.id,
      requestedDays: meta?.requestedDays || days,
      progress: {
        totalChunks,
        completedChunks,
        percent,
        recordsProcessed: meta?.totalRecords || 0,
      },
      hasMoreChunks: completedChunks < totalChunks,
      message: `Carga histórica en curso: bloque ${completedChunks + 1} de ${totalChunks}`,
    };
  }

  // Handle Action Start
  let currentLog: SyncLog;
  let metadata: BackfillMetadata;

  if (action === "start") {
    if (activeLog) {
      // There's already a running backfill job - resume it instead of creating duplicates
      currentLog = activeLog;
      try {
        metadata = JSON.parse(activeLog.error_message || "{}");
      } catch {
        const chunks = generateBackfillChunks(days);
        metadata = {
          requestedDays: days,
          totalChunks: chunks.length,
          completedChunks: 0,
          currentChunkIndex: 0,
          totalRecords: 0,
          chunks,
        };
      }
    } else {
      // Create new backfill job
      const chunks = generateBackfillChunks(days);
      metadata = {
        requestedDays: days,
        totalChunks: chunks.length,
        completedChunks: 0,
        currentChunkIndex: 0,
        totalRecords: 0,
        chunks,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newLogData } = await (supabase as any)
        .from("sync_logs")
        .insert({
          company_id: companyId,
          sync_type: "backfill",
          status: "running",
          started_at: new Date().toISOString(),
          error_message: JSON.stringify(metadata),
        })
        .select("*")
        .single();

      currentLog = newLogData as SyncLog;
    }
  } else {
    // Action continue
    if (!activeLog) {
      throw new Error("No hay ninguna carga histórica en curso para continuar.");
    }
    currentLog = activeLog;
    try {
      metadata = JSON.parse(activeLog.error_message || "{}");
    } catch {
      throw new Error("Formato de metadatos de carga histórica inválido.");
    }
  }

  // Check if all chunks completed
  if (metadata.completedChunks >= metadata.totalChunks) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("sync_logs")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
        records_created: metadata.totalRecords,
      })
      .eq("id", currentLog.id);

    return {
      success: true,
      status: "success",
      syncLogId: currentLog.id,
      requestedDays: metadata.requestedDays,
      progress: {
        totalChunks: metadata.totalChunks,
        completedChunks: metadata.totalChunks,
        percent: 100,
        recordsProcessed: metadata.totalRecords,
      },
      hasMoreChunks: false,
      message: `Carga histórica completada exitosamente (${metadata.totalRecords} registros procesados).`,
    };
  }

  // Process current chunk
  const chunkIndex = metadata.currentChunkIndex;
  const chunk = metadata.chunks[chunkIndex];

  if (!chunk) {
    // Mark finished
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("sync_logs")
      .update({
        status: "success",
        completed_at: new Date().toISOString(),
        records_created: metadata.totalRecords,
      })
      .eq("id", currentLog.id);

    return {
      success: true,
      status: "success",
      syncLogId: currentLog.id,
      requestedDays: metadata.requestedDays,
      progress: {
        totalChunks: metadata.totalChunks,
        completedChunks: metadata.totalChunks,
        percent: 100,
        recordsProcessed: metadata.totalRecords,
      },
      hasMoreChunks: false,
    };
  }

  // Authenticate with GA4 & query chunk date range
  const { client } = await getGA4ClientWithDiagnostics();
  const dateRanges = [{ startDate: chunk.startDate, endDate: chunk.endDate }];

  // 1. Daily Metrics
  const [dailyRes] = await client.runReport({
    property: FORMATTED_PROPERTY,
    dateRanges,
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "engagedSessions" },
      { name: "engagementRate" },
      { name: "averageSessionDuration" },
      { name: "keyEvents" },
      { name: "sessionKeyEventRate" },
      { name: "totalRevenue" },
    ],
  });

  const dailyRows = (dailyRes.rows || []).map((row) => {
    const d = row.dimensionValues?.[0]?.value || "";
    const m = (row.metricValues || []).map((v) => parseFloat(v.value || "0"));
    return {
      company_id: companyId,
      metric_date: d,
      active_users: Math.round(m[0] || 0),
      new_users: Math.round(m[1] || 0),
      sessions: Math.round(m[2] || 0),
      engaged_sessions: Math.round(m[3] || 0),
      engagement_rate: Number((m[4] || 0).toFixed(4)),
      average_session_duration: Number((m[5] || 0).toFixed(2)),
      key_events: Math.round(m[6] || 0),
      session_key_event_rate: Number((m[7] || 0).toFixed(4)),
      total_revenue: Number((m[8] || 0).toFixed(2)),
    };
  });

  // 2. Campaign Metrics
  const [campaignRes] = await client.runReport({
    property: FORMATTED_PROPERTY,
    dateRanges,
    dimensions: [
      { name: "date" },
      { name: "sessionDefaultChannelGroup" },
      { name: "sessionSource" },
      { name: "sessionMedium" },
      { name: "sessionCampaignName" },
    ],
    metrics: [
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "engagedSessions" },
      { name: "engagementRate" },
      { name: "keyEvents" },
      { name: "sessionKeyEventRate" },
      { name: "totalRevenue" },
    ],
  });

  const campaignRows = (campaignRes.rows || []).map((row) => {
    const dims = (row.dimensionValues || []).map((d) => normDim(d.value));
    const m = (row.metricValues || []).map((v) => parseFloat(v.value || "0"));
    return {
      company_id: companyId,
      metric_date: dims[0] || "",
      channel_group: dims[1] || "(not set)",
      source: dims[2] || "(not set)",
      medium: dims[3] || "(not set)",
      campaign_name: dims[4] || "(not set)",
      active_users: Math.round(m[0] || 0),
      new_users: Math.round(m[1] || 0),
      sessions: Math.round(m[2] || 0),
      engaged_sessions: Math.round(m[3] || 0),
      engagement_rate: Number((m[4] || 0).toFixed(4)),
      key_events: Math.round(m[5] || 0),
      session_key_event_rate: Number((m[6] || 0).toFixed(4)),
      total_revenue: Number((m[7] || 0).toFixed(2)),
    };
  });

  // 3. Page Metrics
  const [pageRes] = await client.runReport({
    property: FORMATTED_PROPERTY,
    dateRanges,
    dimensions: [
      { name: "date" },
      { name: "landingPagePlusQueryString" },
      { name: "pagePathPlusQueryString" },
      { name: "pageTitle" },
    ],
    metrics: [
      { name: "screenPageViews" },
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "engagedSessions" },
      { name: "engagementRate" },
      { name: "userEngagementDuration" },
      { name: "keyEvents" },
      { name: "totalRevenue" },
    ],
  });

  const pageRows = (pageRes.rows || []).map((row) => {
    const dims = (row.dimensionValues || []).map((d) => normDim(d.value));
    const m = (row.metricValues || []).map((v) => parseFloat(v.value || "0"));
    return {
      company_id: companyId,
      metric_date: dims[0] || "",
      landing_page: dims[1] || "(not set)",
      page_path: dims[2] || "(not set)",
      page_title: dims[3] || "(not set)",
      screen_page_views: Math.round(m[0] || 0),
      active_users: Math.round(m[1] || 0),
      sessions: Math.round(m[2] || 0),
      engaged_sessions: Math.round(m[3] || 0),
      engagement_rate: Number((m[4] || 0).toFixed(4)),
      user_engagement_duration: Number((m[5] || 0).toFixed(2)),
      key_events: Math.round(m[6] || 0),
      total_revenue: Number((m[7] || 0).toFixed(2)),
    };
  });

  // 4. Audience Metrics
  const [audienceRes] = await client.runReport({
    property: FORMATTED_PROPERTY,
    dateRanges,
    dimensions: [
      { name: "date" },
      { name: "deviceCategory" },
      { name: "country" },
      { name: "region" },
      { name: "city" },
    ],
    metrics: [
      { name: "activeUsers" },
      { name: "newUsers" },
      { name: "sessions" },
      { name: "engagementRate" },
      { name: "keyEvents" },
      { name: "totalRevenue" },
    ],
  });

  const audienceRows = (audienceRes.rows || []).map((row) => {
    const dims = (row.dimensionValues || []).map((d) => normDim(d.value));
    const m = (row.metricValues || []).map((v) => parseFloat(v.value || "0"));
    return {
      company_id: companyId,
      metric_date: dims[0] || "",
      device_category: dims[1] || "(not set)",
      country: dims[2] || "(not set)",
      region: dims[3] || "(not set)",
      city: dims[4] || "(not set)",
      active_users: Math.round(m[0] || 0),
      new_users: Math.round(m[1] || 0),
      sessions: Math.round(m[2] || 0),
      engagement_rate: Number((m[3] || 0).toFixed(4)),
      key_events: Math.round(m[4] || 0),
      total_revenue: Number((m[5] || 0).toFixed(2)),
    };
  });

  // Batch upsert chunk data
  await batchUpsert(supabase, "daily_metrics", dailyRows);
  await batchUpsert(supabase, "campaign_metrics", campaignRows);
  await batchUpsert(supabase, "page_metrics", pageRows);
  await batchUpsert(supabase, "audience_metrics", audienceRows);

  const chunkRecords =
    dailyRows.length + campaignRows.length + pageRows.length + audienceRows.length;

  // Update metadata progress
  metadata.completedChunks += 1;
  metadata.currentChunkIndex += 1;
  metadata.totalRecords += chunkRecords;

  const isCompleted = metadata.completedChunks >= metadata.totalChunks;
  const status = isCompleted ? "success" : "running";

  // Update sync_logs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("sync_logs")
    .update({
      status,
      completed_at: isCompleted ? new Date().toISOString() : null,
      records_created: metadata.totalRecords,
      error_message: JSON.stringify(metadata),
    })
    .eq("id", currentLog.id);

  const percent = Number(
    ((metadata.completedChunks / metadata.totalChunks) * 100).toFixed(1)
  );

  return {
    success: true,
    status,
    syncLogId: currentLog.id,
    requestedDays: metadata.requestedDays,
    progress: {
      totalChunks: metadata.totalChunks,
      completedChunks: metadata.completedChunks,
      percent,
      recordsProcessed: metadata.totalRecords,
      lastProcessedRange: {
        startDate: chunk.startDate,
        endDate: chunk.endDate,
      },
    },
    hasMoreChunks: !isCompleted,
    message: isCompleted
      ? `Carga histórica completada exitosamente (${metadata.totalRecords} registros).`
      : `Bloque ${metadata.completedChunks} de ${metadata.totalChunks} procesado (${chunk.startDate} a ${chunk.endDate}).`,
  };
}
