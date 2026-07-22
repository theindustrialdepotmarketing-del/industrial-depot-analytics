import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/* ─── Public Supabase Client (No administrative privileges) ─── */
let browserClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Primary: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, Fallback: NEXT_PUBLIC_SUPABASE_ANON_KEY
  const publicKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !publicKey) {
    return null;
  }

  browserClient = createClient<Database>(url, publicKey);
  return browserClient;
}
