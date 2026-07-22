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
    const { data: tasksData } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json(
      {
        success: true,
        tasks: tasksData || [],
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error consultando tareas";
    return NextResponse.json({ success: false, error: "TASKS_FETCH_FAILED", message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const { title, description, category, priority, due_date, target_metric, recommendation_id } = body;

    if (!title) {
      return NextResponse.json({ success: false, message: "Título de la tarea requerido" }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newTask } = await (supabase as any)
      .from("tasks")
      .insert({
        recommendation_id,
        title,
        description: description || "",
        category: category || "general",
        status: "pending",
        priority: priority || "medium",
        due_date: due_date || null,
        target_metric,
        created_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    // If recommendation_id is provided, update recommendation status to in_progress
    if (recommendation_id) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any)
          .from("recommendations")
          .update({ status: "in_progress" })
          .eq("id", recommendation_id);
      } catch {
        // Suppress recommendation update error
      }
    }

    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creando tarea";
    return NextResponse.json({ success: false, error: "TASK_CREATE_FAILED", message }, { status: 500 });
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
    const { data: updatedTask } = await (supabase as any)
      .from("tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single();

    return NextResponse.json({ success: true, task: updatedTask }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error actualizando tarea";
    return NextResponse.json({ success: false, error: "TASK_UPDATE_FAILED", message }, { status: 500 });
  }
}
