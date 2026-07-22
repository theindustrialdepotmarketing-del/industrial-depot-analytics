import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Alert } from "@/lib/types/database";

export const runtime = "nodejs";

const SEVERITY_WEIGHTS: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

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
    const { data: alertsData, error } = await supabase
      .from("alerts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/analytics/alerts Error]", { code: error.code, message: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const rawAlerts = (alertsData || []) as Alert[];

    // Sort by severity rank (critical > high > medium > low > info) and then by created_at desc
    const sortedAlerts = [...rawAlerts].sort((a, b) => {
      const wA = SEVERITY_WEIGHTS[a.severity] ?? 0;
      const wB = SEVERITY_WEIGHTS[b.severity] ?? 0;
      if (wB !== wA) return wB - wA;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return NextResponse.json(
      {
        success: true,
        alerts: sortedAlerts,
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
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, message: "ID y estado requeridos" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      status,
    };
    if (status === "resolved") {
      updates.resolved_at = new Date().toISOString();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedAlert, error } = await (supabase as any)
      .from("alerts")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[PATCH /api/analytics/alerts Error]", { code: error.code, message: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, alert: updatedAlert }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error actualizando alerta";
    return NextResponse.json({ success: false, error: "ALERT_UPDATE_FAILED", message }, { status: 500 });
  }
}
