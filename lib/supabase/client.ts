import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/* ─── Browser Supabase Client (anon key only) ─── */
let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Return null — handled gracefully in components via empty states
    return null;
  }

  browserClient = createClient<Database>(url, anonKey);
  return browserClient;
}
