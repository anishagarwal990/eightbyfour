import { createClient } from "@supabase/supabase-js";

// Cloudflare in front of Supabase occasionally returns a transient 5xx
// (522 connection timeout, 525 SSL handshake failed) during `next build`'s
// parallel static generation across 1000+ product pages — this killed the
// whole build over a single flaky request several times. Retry with
// exponential backoff instead of failing the entire build; the longer tail
// (up to ~7s total) gives Supabase room to recover from a sustained rough
// patch, not just an isolated blip.
async function fetchWithRetry(input: RequestInfo | URL, init?: RequestInit, attempt = 1): Promise<Response> {
  const maxAttempts = 4;
  try {
    const res = await fetch(input, init);
    if (!res.ok && res.status >= 500 && attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500));
      return fetchWithRetry(input, init, attempt + 1);
    }
    return res;
  } catch (err) {
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 500));
      return fetchWithRetry(input, init, attempt + 1);
    }
    throw err;
  }
}

// Server components fetch with the same public anon key (RLS already
// scopes reads to public data) — no cookies/session needed for this site.
export function createServerSupabaseClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { fetch: fetchWithRetry },
  });
}
