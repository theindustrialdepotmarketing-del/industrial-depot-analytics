import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { ExternalAccountClient } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";
import type {
  TestGA4Response,
  GA4ReportRow,
  GA4SummaryMetrics,
} from "@/lib/types/analytics";

const WORKLOAD_IDENTITY_PROVIDER =
  process.env.GCP_WORKLOAD_IDENTITY_PROVIDER ||
  "projects/72682370676/locations/global/workloadIdentityPools/vercel/providers/vercel";

const SERVICE_ACCOUNT_EMAIL =
  process.env.GCP_SERVICE_ACCOUNT ||
  "ga4-dashboard-reader@industrial-depot-analytics.iam.gserviceaccount.com";

const DEFAULT_PROPERTY_ID =
  process.env.GA4_PROPERTY_ID || "properties/502218884";

export class OIDCNotAvailableError extends Error {
  constructor(
    message = "No se detectó el token Vercel OIDC (VERCEL_OIDC_TOKEN). La autenticación mediante Workload Identity Federation requiere ser ejecutada en un despliegue de Vercel."
  ) {
    super(message);
    this.name = "OIDCNotAvailableError";
  }
}

/**
 * Server-only Google Analytics 4 Authenticated Client.
 * Uses Vercel OIDC + Google Cloud Workload Identity Federation.
 * No private keys or service account JSON files are used.
 */
async function getGA4Client(): Promise<BetaAnalyticsDataClient> {
  let oidcToken: string | undefined;

  try {
    oidcToken = await getVercelOidcToken();
  } catch {
    // If not in Vercel environment or helper throws
  }

  if (!oidcToken && process.env.VERCEL_OIDC_TOKEN) {
    oidcToken = process.env.VERCEL_OIDC_TOKEN;
  }

  if (!oidcToken) {
    throw new OIDCNotAvailableError();
  }

  const audience = WORKLOAD_IDENTITY_PROVIDER.startsWith("//")
    ? WORKLOAD_IDENTITY_PROVIDER
    : `//iam.googleapis.com/${WORKLOAD_IDENTITY_PROVIDER}`;

  const authClient = ExternalAccountClient.fromJSON({
    type: "external_account",
    audience,
    subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
    token_url: "https://sts.googleapis.com/v1/token",
    service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${SERVICE_ACCOUNT_EMAIL}:generateAccessToken`,
    subject_token_supplier: {
      getSubjectToken: async () => oidcToken!,
    },
  });

  if (!authClient) {
    throw new Error("Error iniciando ExternalAccountClient para GCP Workload Identity Federation.");
  }

  return new BetaAnalyticsDataClient({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authClient: authClient as any,
  });
}

/**
 * Runs the overview report for the last 7 days from GA4 property.
 */
export async function runOverviewReport(
  propertyId: string = DEFAULT_PROPERTY_ID
): Promise<TestGA4Response> {
  const formattedProperty = propertyId.startsWith("properties/")
    ? propertyId
    : `properties/${propertyId}`;

  const client = await getGA4Client();

  const [response] = await client.runReport({
    property: formattedProperty,
    dateRanges: [
      {
        startDate: "7daysAgo",
        endDate: "today",
      },
    ],
    dimensions: [
      {
        name: "date",
      },
    ],
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
    orderBys: [
      {
        dimension: {
          dimensionName: "date",
        },
        desc: false,
      },
    ],
  });

  const rows: GA4ReportRow[] = (response.rows || []).map((row) => {
    const dimValue = row.dimensionValues?.[0]?.value || "";
    const metricValues = (row.metricValues || []).map((m) => parseFloat(m.value || "0"));

    return {
      date: dimValue,
      activeUsers: metricValues[0] || 0,
      newUsers: metricValues[1] || 0,
      sessions: metricValues[2] || 0,
      engagedSessions: metricValues[3] || 0,
      engagementRate: metricValues[4] || 0,
      averageSessionDuration: metricValues[5] || 0,
      keyEvents: metricValues[6] || 0,
      sessionKeyEventRate: metricValues[7] || 0,
      totalRevenue: metricValues[8] || 0,
    };
  });

  const rowCount = rows.length;
  const summary: GA4SummaryMetrics = rows.reduce(
    (acc, cur) => ({
      activeUsers: acc.activeUsers + cur.activeUsers,
      newUsers: acc.newUsers + cur.newUsers,
      sessions: acc.sessions + cur.sessions,
      engagedSessions: acc.engagedSessions + cur.engagedSessions,
      engagementRate: acc.engagementRate + cur.engagementRate,
      averageSessionDuration: acc.averageSessionDuration + cur.averageSessionDuration,
      keyEvents: acc.keyEvents + cur.keyEvents,
      sessionKeyEventRate: acc.sessionKeyEventRate + cur.sessionKeyEventRate,
      totalRevenue: acc.totalRevenue + cur.totalRevenue,
    }),
    {
      activeUsers: 0,
      newUsers: 0,
      sessions: 0,
      engagedSessions: 0,
      engagementRate: 0,
      averageSessionDuration: 0,
      keyEvents: 0,
      sessionKeyEventRate: 0,
      totalRevenue: 0,
    }
  );

  if (rowCount > 0) {
    summary.engagementRate = Number((summary.engagementRate / rowCount).toFixed(4));
    summary.averageSessionDuration = Number((summary.averageSessionDuration / rowCount).toFixed(2));
    summary.sessionKeyEventRate = Number((summary.sessionKeyEventRate / rowCount).toFixed(4));
  }

  return {
    success: true,
    propertyId: formattedProperty,
    period: {
      startDate: "7daysAgo",
      endDate: "today",
      description: "Últimos 7 días",
    },
    rowCount,
    summary,
    rows,
    timestamp: new Date().toISOString(),
  };
}
