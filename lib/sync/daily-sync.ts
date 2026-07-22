import "server-only";
import { getGA4ClientWithDiagnostics } from "@/lib/google/analytics";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SyncResult, Company, SyncLog } from "@/lib/types/database";

const PROPERTY_ID = process.env.GA4_PROPERTY_ID || "properties/502218884";
const FORMATTED_PROPERTY = PROPERTY_ID.startsWith("properties/")
  ? PROPERTY_ID
  : `properties/${PROPERTY_ID}`;

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
      console.error(`[Sync Batch Error] ${tableName}:`, error.message);
    }
  }
}

/**
 * Reusable server-side service for daily GA4 -> Supabase synchronization.
 * Idempotent: uses upserts to prevent duplicate entries.
 */
export async function runDailySync(
  syncType: "daily" | "manual" = "daily"
): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    throw new Error(
      "No se pudo instanciar el cliente de Supabase. Revisa las variables de entorno."
    );
  }

  // 1. Fetch Company ID
  const { data: companyData } = await supabase
    .from("companies")
    .select("*")
    .eq("ga4_property_id", "502218884")
    .maybeSingle();

  const company = companyData as Company | null;
  const companyId = company?.id || "industrial_depot_company";

  // 2. Log initial sync status
  let syncLogId: string | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: syncLogData } = await (supabase as any)
      .from("sync_logs")
      .insert({
        company_id: companyId,
        sync_type: syncType,
        status: "running",
        started_at: startedAt,
      })
      .select("*")
      .maybeSingle();

    const syncLog = syncLogData as SyncLog | null;
    syncLogId = syncLog?.id;
  } catch {
    // Continue even if logging table insert fails
  }

  try {
    // 3. Authenticate with GA4
    const { client } = await getGA4ClientWithDiagnostics();

    // 4. Query GA4 Reports for 'yesterday'
    const dateRanges = [{ startDate: "yesterday", endDate: "yesterday" }];

    // A. Daily Metrics Report
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

    // B. Campaign / Acquisition Report
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

    // C. Landing Pages Report
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

    // D. Audience / Geography Report
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

    // 5. Upsert to Supabase
    await batchUpsert(supabase, "daily_metrics", dailyRows);
    await batchUpsert(supabase, "campaign_metrics", campaignRows);
    await batchUpsert(supabase, "page_metrics", pageRows);
    await batchUpsert(supabase, "audience_metrics", audienceRows);

    const totalRecords =
      dailyRows.length + campaignRows.length + pageRows.length + audienceRows.length;

    const completedAt = new Date().toISOString();

    // 6. Update sync_logs
    if (syncLogId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("sync_logs")
        .update({
          status: "success",
          completed_at: completedAt,
          records_created: totalRecords,
          records_updated: 0,
        })
        .eq("id", syncLogId);
    }

    return {
      success: true,
      status: "success",
      syncedDate: "yesterday",
      recordsProcessed: totalRecords,
      recordsCreated: totalRecords,
      recordsUpdated: 0,
      details: {
        dailyMetrics: dailyRows.length,
        campaignMetrics: campaignRows.length,
        pageMetrics: pageRows.length,
        audienceMetrics: audienceRows.length,
      },
      startedAt,
      completedAt,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error durante la sincronización diaria";

    if (syncLogId) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("sync_logs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: errorMsg,
          })
          .eq("id", syncLogId);
      } catch {
        // Suppress logging error
      }
    }

    throw err;
  }
}
