import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types/database";

export const runtime = "nodejs";

/**
 * GET /api/supabase/test
 * Protected administrative route to test Supabase database connection.
 * Searches for the company with ga4_property_id = "502218884" in the `companies` table.
 * Returns only normalized public fields — NEVER keys, tokens or secrets.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        error: "UNAUTHORIZED",
        message: "Se requiere sesión administrativa válida para probar la conexión con Supabase.",
        databaseConnected: false,
      },
      { status: 401 }
    );
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        error: "SUPABASE_NOT_CONFIGURED",
        message:
          "Supabase no está configurado. Define NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en las variables de entorno de Vercel.",
        databaseConnected: false,
      },
      { status: 200 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .eq("ga4_property_id", "502218884")
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: "QUERY_FAILED",
          message: `Error consultando la tabla 'companies': ${error.message}`,
          databaseConnected: true,
        },
        { status: 400 }
      );
    }

    const company = data as Company | null;

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          error: "COMPANY_NOT_FOUND",
          message:
            "Conexión con Supabase exitosa, pero no se encontró un registro en la tabla 'companies' con ga4_property_id = '502218884'.",
          databaseConnected: true,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        companyName: company.name,
        propertyId: company.ga4_property_id,
        timezone: company.timezone || "UTC",
        databaseConnected: true,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido de conexión";
    return NextResponse.json(
      {
        success: false,
        error: "SUPABASE_CONNECTION_ERROR",
        message: `Error de conexión con Supabase: ${message}`,
        databaseConnected: false,
      },
      { status: 500 }
    );
  }
}
