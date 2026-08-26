"use client";

import { createBrowserClient } from "@supabase/ssr";

// Browser client for the admin login form only. Sign-in has to happen
// client-side so the auth cookies land in the browser; every subsequent read
// and write goes through a Server Action against the session client.
export function createAdminBrowserClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
