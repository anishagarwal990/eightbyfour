import { createClient } from "@supabase/supabase-js";

// Server components fetch with the same public anon key (RLS already
// scopes reads to public data) — no cookies/session needed for this site.
export function createServerSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
}
