import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { ExternalAccountClient, Impersonated } from "google-auth-library";
import { getVercelOidcToken } from "@vercel/oidc";
import type {
  TestGA4Response,
  GA4ReportRow,
  GA4SummaryMetrics,
  GA4Diagnostics,
} from "@/lib/types/analytics";

export const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/cloud-platform",
];

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

export class STSExchangeError extends Error {
  constructor(message = "El intercambio STS mediante Workload Identity Federation ha fallado.") {
    super(message);
    this.name = "STSExchangeError";
  }
}

export class ImpersonationError extends Error {
  constructor(message = "Falló la impersonación de la cuenta de servicio de Google Cloud.") {
    super(message);
    this.name = "ImpersonationError";
  }
}

export class InsufficientScopesError extends Error {
  constructor(
    message = "PERMISSION_DENIED: Request had insufficient authentication scopes. La credencial impersonada requiere el OAuth scope https://www.googleapis.com/auth/analytics.readonly."
  ) {
    super(message);
    this.name = "InsufficientScopesError";
  }
}

export class GA4AccessDeniedError extends Error {
  constructor(
    message = `PERMISSION_DENIED: La cuenta de servicio ${SERVICE_ACCOUNT_EMAIL} no tiene permisos de lectura sobre la propiedad GA4.`
  ) {
    super(message);
    this.name = "GA4AccessDeniedError";
  }
}

export class GA4PropertyNotFoundError extends Error {
  constructor(message = "NOT_FOUND: La propiedad de Google Analytics 4 especificada no existe o el ID es incorrecto.") {
    super(message);
    this.name = "GA4PropertyNotFoundError";
  }
}

/**
 * Creates authenticated BetaAnalyticsDataClient with targetScopes explicitly attached
 * to Impersonated credentials for Google Cloud Workload Identity Federation.
 */
export async function getGA4ClientWithDiagnostics(): Promise<{
  client: BetaAnalyticsDataClient;
  diagnostics: GA4Diagnostics;
}> {
  const diagnostics: GA4Diagnostics = {
    oidcTokenReceived: false,
    workloadIdentityExchange: "failed",
    serviceAccountImpersonation: "failed",
    analyticsScopeConfigured: true,
    ga4Query: "failed",
  };

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

  diagnostics.oidcTokenReceived = true;

  const audience = WORKLOAD_IDENTITY_PROVIDER.startsWith("//")
    ? WORKLOAD_IDENTITY_PROVIDER
    : `//iam.googleapis.com/${WORKLOAD_IDENTITY_PROVIDER}`;

  let externalClient: ReturnType<typeof ExternalAccountClient.fromJSON>;
  try {
    externalClient = ExternalAccountClient.fromJSON({
      type: "external_account",
      audience,
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      token_url: "https://sts.googleapis.com/v1/token",
      scopes: REQUIRED_SCOPES,
      subject_token_supplier: {
        getSubjectToken: async () => oidcToken!,
      },
    });

    if (!externalClient) {
      throw new Error("No se pudo instanciar ExternalAccountClient");
    }
    diagnostics.workloadIdentityExchange = "success";
  } catch (err: unknown) {
    diagnostics.workloadIdentityExchange = "failed";
    throw new STSExchangeError(
      `Error en intercambio WIF/STS: ${err instanceof Error ? err.message : "Desconocido"}`
    );
  }

  let impersonatedClient: Impersonated;
  try {
    impersonatedClient = new Impersonated({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sourceClient: externalClient as any,
      targetPrincipal: SERVICE_ACCOUNT_EMAIL,
      targetScopes: REQUIRED_SCOPES,
    });
    diagnostics.serviceAccountImpersonation = "success";
  } catch (err: unknown) {
    diagnostics.serviceAccountImpersonation = "failed";
    throw new ImpersonationError(
      `Error impersonando cuenta de servicio (${SERVICE_ACCOUNT_EMAIL}): ${err instanceof Error ? err.message : "Desconocido"}`
    );
  }

  const client = new BetaAnalyticsDataClient({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    authClient: impersonatedClient as any,
  });

  return { client, diagnostics };
}

/**
 * Runs the overview report for the last 7 full days (7daysAgo to yesterday) from GA4 property properties/502218884.
 */
export async function runOverviewReport(
  propertyId: string = DEFAULT_PROPERTY_ID
): Promise<TestGA4Response> {
  const formattedProperty = propertyId.startsWith("properties/")
    ? propertyId
    : `properties/${propertyId}`;

  const { client, diagnostics } = await getGA4ClientWithDiagnostics();

  try {
    const [response] = await client.runReport({
      property: formattedProperty,
      dateRanges: [
        {
          startDate: "7daysAgo",
          endDate: "yesterday",
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

    diagnostics.ga4Query = "success";

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
        endDate: "yesterday",
        description: "Últimos 7 días (completos)",
      },
      rowCount,
      summary,
      rows,
      diagnostics,
      timestamp: new Date().toISOString(),
    };
  } catch (err: unknown) {
    diagnostics.ga4Query = "failed";
    const msg = err instanceof Error ? err.message : String(err);

    if (msg.includes("insufficient authentication scopes") || msg.includes("scope")) {
      throw new InsufficientScopesError(
        `PERMISSION_DENIED: Request had insufficient authentication scopes. La credencial impersonada requiere el OAuth scope https://www.googleapis.com/auth/analytics.readonly.`
      );
    }

    if (msg.includes("PERMISSION_DENIED") || msg.includes("403")) {
      throw new GA4AccessDeniedError(
        `PERMISSION_DENIED: La cuenta de servicio ${SERVICE_ACCOUNT_EMAIL} no tiene permisos de acceso a la propiedad ${formattedProperty}. Asegúrate de haberla agregado con rol Lector en GA4.`
      );
    }

    if (msg.includes("NOT_FOUND") || msg.includes("404") || msg.includes("invalid property")) {
      throw new GA4PropertyNotFoundError(
        `NOT_FOUND: La propiedad GA4 ${formattedProperty} no fue encontrada.`
      );
    }

    throw err;
  }
}
