import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * PATCH /api/analytics/pages/404
 * Admin route to create or update management fields for a confirmed 404 URL.
 * Fields: page_path, replacement_url, replacement_type, verified_http_status, correction_status, notes, assigned_to
 */
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Se requiere sesión activa." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "SUPABASE_ERROR" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const {
      page_path,
      replacement_url,
      replacement_type,
      verified_http_status,
      correction_status,
      notes,
      assigned_to,
    } = body;

    if (!page_path) {
      return NextResponse.json({ success: false, message: "page_path es obligatorio." }, { status: 400 });
    }

    // 1. Get company_id for property 502218884
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: company } = await (supabase as any)
      .from("companies")
      .select("id")
      .eq("ga4_property_id", "502218884")
      .maybeSingle();

    const companyId = company?.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedRecord, error } = await (supabase as any)
      .from("url_corrections_404")
      .upsert(
        {
          company_id: companyId,
          page_path,
          replacement_url: replacement_url ?? "",
          replacement_type: replacement_type ?? "unknown",
          verified_http_status: verified_http_status ?? 404,
          correction_status: correction_status ?? "pending_review",
          notes: notes ?? "",
          assigned_to: assigned_to ?? "",
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,page_path" }
      )
      .select("*")
      .single();

    if (error) {
      console.error("[PATCH /api/analytics/pages/404 Error]", { code: error.code, message: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, correction: updatedRecord }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error actualizando corrección de URL 404";
    return NextResponse.json({ success: false, error: "404_CORRECTION_FAILED", message }, { status: 500 });
  }
}
