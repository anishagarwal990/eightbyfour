import { createClient } from "@supabase/supabase-js";

// Untyped client — row shapes are declared explicitly in lib/data/* instead
// of fighting a hand-maintained Database generic against supabase-js's types.
export function createBrowserSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
