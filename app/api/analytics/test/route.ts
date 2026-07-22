import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { runOverviewReport, OIDCNotAvailableError } from "@/lib/google/analytics";

export const runtime = "nodejs";

/**
 * GET /api/analytics/test
 * Protected route to test real GA4 connection using Vercel OIDC + WIF.
 * Requires an authenticated admin session.
 * Exclusively executes server-side on Node.js runtime.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
        message: "Se requiere sesión administrativa para probar la conexión.",
      },
      { status: 401 }
    );
  }

  try {
    const reportData = await runOverviewReport();
    return NextResponse.json(reportData, { status: 200 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido consultando GA4";

    if (err instanceof OIDCNotAvailableError) {
      return NextResponse.json(
        {
          success: false,
          isLocalEnv: true,
          error: "OIDC_NOT_AVAILABLE",
          message:
            "La prueba de autenticación OIDC + Workload Identity Federation debe ejecutarse desde un deployment en Vercel. En desarrollo local no existe token OIDC activo.",
          timestamp: new Date().toISOString(),
        },
        { status: 200 } // Return 200 with isLocalEnv indicator so Settings UI can display a clear, friendly notice
      );
    }

    // Handle GA4 / GCP errors safely without exposing tokens
    let statusCode = 500;
    if (errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("403")) {
      statusCode = 403;
    } else if (errorMessage.includes("NOT_FOUND") || errorMessage.includes("404")) {
      statusCode = 404;
    }

    return NextResponse.json(
      {
        success: false,
        error: "GA4_QUERY_FAILED",
        message: `Error consultando Google Analytics 4: ${errorMessage}`,
        timestamp: new Date().toISOString(),
      },
      { status: statusCode }
    );
  }
}
