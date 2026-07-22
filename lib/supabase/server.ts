import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

/**
 * Server-Side Only Administrative Supabase Client.
 * Uses SUPABASE_SECRET_KEY with fallback to SUPABASE_SERVICE_ROLE_KEY.
 * NEVER import this file into Client Components or expose credentials to the browser.
 */
export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Primary: SUPABASE_SECRET_KEY, Fallback: SUPABASE_SERVICE_ROLE_KEY
  const secretKey =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    return null;
  }

  return createClient<Database>(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
