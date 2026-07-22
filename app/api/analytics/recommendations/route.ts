import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: false, error: "SUPABASE_ERROR" }, { status: 500 });
  }

  try {
    const { data: recommendationsData } = await supabase
      .from("recommendations")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json(
      {
        success: true,
        recommendations: recommendationsData || [],
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
    const { data: updatedRec } = await (supabase as any)
      .from("recommendations")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    return NextResponse.json({ success: true, recommendation: updatedRec }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error actualizando recomendación";
    return NextResponse.json({ success: false, error: "RECOMMENDATION_UPDATE_FAILED", message }, { status: 500 });
  }
}
