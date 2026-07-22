import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Company } from "@/lib/types/database";

export const runtime = "nodejs";

/**
 * GET /api/supabase/test
 * Protected administrative route to test Supabase database connection.
 * Searches for the company with ga4_property_id = "502218884" in public.companies.
 * Returns strictly normalized fields — NEVER keys, tokens, or internal Postgres traces.
 */
export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      {
        success: false,
        databaseConnected: false,
        message: "Acceso no autorizado. Se requiere sesión administrativa.",
      },
      { status: 401 }
    );
  }

  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        success: false,
        databaseConnected: false,
        message: "Base de datos Supabase no configurada en las variables de entorno.",
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
          databaseConnected: true,
          message: "Error realizando la consulta en la tabla de empresas.",
        },
        { status: 400 }
      );
    }

    const company = data as Company | null;

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          databaseConnected: true,
          message: "Conexión a la base de datos establecida, pero la empresa con Property ID 502218884 no fue encontrada.",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        databaseConnected: true,
        companyName: company.name,
        propertyId: company.ga4_property_id,
        timezone: company.timezone || "UTC",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      {
        success: false,
        databaseConnected: false,
        message: "Error de conexión con la base de datos de Supabase.",
      },
      { status: 500 }
    );
  }
}
