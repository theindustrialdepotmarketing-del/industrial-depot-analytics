import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
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
    const { data: alertsData } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json(
      {
        success: true,
        alerts: alertsData || [],
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error consultando alertas";
    return NextResponse.json({ success: false, error: "ALERTS_FETCH_FAILED", message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "SUPABASE_ERROR" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { id, is_resolved, is_read } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: "ID de alerta requerido" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    if (typeof is_resolved === "boolean") {
      updates.is_resolved = is_resolved;
      if (is_resolved) updates.resolved_at = new Date().toISOString();
    }
    if (typeof is_read === "boolean") {
      updates.is_read = is_read;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedAlert } = await (supabase as any)
      .from("alerts")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    return NextResponse.json({ success: true, alert: updatedAlert }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error actualizando alerta";
    return NextResponse.json({ success: false, error: "ALERT_UPDATE_FAILED", message }, { status: 500 });
  }
}
