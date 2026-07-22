import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import {
  runOverviewReport,
  OIDCNotAvailableError,
  STSExchangeError,
  ImpersonationError,
  InsufficientScopesError,
  GA4AccessDeniedError,
  GA4PropertyNotFoundError,
} from "@/lib/google/analytics";

export const runtime = "nodejs";

/**
 * GET /api/analytics/test
 * Protected route to test GA4 connection using Vercel OIDC + WIF + targetScopes.
 * Differentiates exact failure causes cleanly without leaking tokens or private data.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED",
        message: "Se requiere sesión administrativa válida para realizar la prueba de conexión.",
      },
      { status: 401 }
    );
  }

  try {
    const reportData = await runOverviewReport();
    return NextResponse.json(reportData, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido consultando GA4";

    // 1. OIDC Not Available (Local Development)
    if (err instanceof OIDCNotAvailableError) {
      return NextResponse.json(
        {
          success: false,
          isLocalEnv: true,
          error: "OIDC_NOT_AVAILABLE",
          message:
            "La prueba de autenticación OIDC + Workload Identity Federation debe ejecutarse desde un deployment en Vercel. En desarrollo local no existe token OIDC activo.",
          diagnostics: {
            oidcTokenReceived: false,
            workloadIdentityExchange: "failed",
            serviceAccountImpersonation: "failed",
            analyticsScopeConfigured: true,
            ga4Query: "failed",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    // 2. STS / WIF Exchange Failed
    if (err instanceof STSExchangeError) {
      return NextResponse.json(
        {
          success: false,
          error: "STS_EXCHANGE_FAILED",
          message: `El intercambio de token Vercel OIDC por credenciales GCP mediante Workload Identity Federation ha fallado. Verifica la configuración del proveedor 'vercel' en el Pool de GCP. Detalle: ${message}`,
          diagnostics: {
            oidcTokenReceived: true,
            workloadIdentityExchange: "failed",
            serviceAccountImpersonation: "failed",
            analyticsScopeConfigured: true,
            ga4Query: "failed",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // 3. Service Account Impersonation Failed
    if (err instanceof ImpersonationError) {
      return NextResponse.json(
        {
          success: false,
          error: "IMPERSONATION_FAILED",
          message: `Falló la impersonación de la cuenta de servicio (ga4-dashboard-reader@industrial-depot-analytics.iam.gserviceaccount.com). Asegúrate de otorgar el rol 'Service Account Token Creator' al Pool de WIF. Detalle: ${message}`,
          diagnostics: {
            oidcTokenReceived: true,
            workloadIdentityExchange: "success",
            serviceAccountImpersonation: "failed",
            analyticsScopeConfigured: true,
            ga4Query: "failed",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // 4. Insufficient OAuth Scopes
    if (err instanceof InsufficientScopesError) {
      return NextResponse.json(
        {
          success: false,
          error: "INSUFFICIENT_SCOPES",
          message: `7 PERMISSION_DENIED: Request had insufficient authentication scopes. La credencial impersonada requiere el OAuth scope 'https://www.googleapis.com/auth/analytics.readonly'.`,
          diagnostics: {
            oidcTokenReceived: true,
            workloadIdentityExchange: "success",
            serviceAccountImpersonation: "success",
            analyticsScopeConfigured: true,
            ga4Query: "failed",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // 5. GA4 Property Access Denied
    if (err instanceof GA4AccessDeniedError) {
      return NextResponse.json(
        {
          success: false,
          error: "GA4_ACCESS_DENIED",
          message: `PERMISSION_DENIED: La cuenta de servicio 'ga4-dashboard-reader@industrial-depot-analytics.iam.gserviceaccount.com' fue autenticada pero carece de permisos sobre la propiedad GA4 502218884. Agrega esta cuenta como Lector en el panel de GA4.`,
          diagnostics: {
            oidcTokenReceived: true,
            workloadIdentityExchange: "success",
            serviceAccountImpersonation: "success",
            analyticsScopeConfigured: true,
            ga4Query: "failed",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 403 }
      );
    }

    // 6. Property Not Found / Invalid ID
    if (err instanceof GA4PropertyNotFoundError) {
      return NextResponse.json(
        {
          success: false,
          error: "PROPERTY_NOT_FOUND",
          message: `NOT_FOUND: La propiedad de Google Analytics 4 (properties/502218884) no existe o el ID es incorrecto.`,
          diagnostics: {
            oidcTokenReceived: true,
            workloadIdentityExchange: "success",
            serviceAccountImpersonation: "success",
            analyticsScopeConfigured: true,
            ga4Query: "failed",
          },
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    // Generic fallback for unhandled errors
    return NextResponse.json(
      {
        success: false,
        error: "GA4_QUERY_FAILED",
        message: `Error inesperado consultando GA4: ${message}`,
        diagnostics: {
          oidcTokenReceived: true,
          workloadIdentityExchange: "success",
          serviceAccountImpersonation: "success",
          analyticsScopeConfigured: true,
          ga4Query: "failed",
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
