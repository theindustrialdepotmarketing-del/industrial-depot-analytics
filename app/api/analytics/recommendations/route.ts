import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "UNAUTHORIZED", message: "Se requiere sesión activa." },
      { status: 401 }
    );
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "SUPABASE_ERROR", message: "Cliente Supabase no inicializado." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "pending"; // Default: pending (Requisito 8)

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any).from("recommendations").select("*");

    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        query = query.in("status", ["pending", "in_progress"]);
      } else {
        query = query.eq("status", statusFilter);
      }
    }

    const { data: recommendationsData, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[GET /api/analytics/recommendations Supabase Error]", { code: error.code, message: error.message });
      // Requisito 17: Mostrar errores reales de consulta en lugar de fingir éxito con arreglo vacío
      return NextResponse.json(
        { success: false, error: error.code || "SUPABASE_QUERY_ERROR", message: error.message },
        { status: 500 }
      );
    }

    // Sort by priority rank then created_at
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sortedRecommendations = (recommendationsData || []).sort((a: any, b: any) => {
      const rankA = PRIORITY_ORDER[a.priority] || 0;
      const rankB = PRIORITY_ORDER[b.priority] || 0;
      if (rankB !== rankA) return rankB - rankA;
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return NextResponse.json(
      {
        success: true,
        recommendations: sortedRecommendations,
        total: sortedRecommendations.length,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error consultando recomendaciones";
    return NextResponse.json({ success: false, error: "RECOMMENDATIONS_FETCH_FAILED", message }, { status: 500 });
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updatedRec, error } = await (supabase as any)
      .from("recommendations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[PATCH /api/analytics/recommendations Error]", { code: error.code, message: error.message });
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, recommendation: updatedRec }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error actualizando recomendación";
    return NextResponse.json({ success: false, error: "RECOMMENDATION_UPDATE_FAILED", message }, { status: 500 });
  }
}
