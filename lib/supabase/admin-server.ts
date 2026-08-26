import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Session-bound client for the admin area.
//
// Deliberately NOT the service-role key. Writes go through the signed-in
// user's own JWT so Postgres RLS is the thing deciding what they may touch —
// a bug in a route handler cannot become full catalogue write access, and
// every write carries a real `auth.uid()` for the audit trail. The service
// role key stays in scripts/, where it is run by a human at a terminal.
export async function createAdminSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Harmless: middleware.ts refreshes the session on every request,
          // so the write here is only ever a redundant second attempt.
        }
      },
    },
  });
}

/**
 * The signed-in user, or null.
 *
 * Uses getUser() rather than getSession(): getSession() returns whatever is
 * in the cookie without verifying it, so it can be forged. getUser()
 * revalidates the JWT against the auth server, which is what an
 * authentication check needs.
 *
 * Being signed in is NOT authorization — see requireAdmin below.
 */
export async function getAdminUser() {
  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export type AdminCheck =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getAdminUser>>> }
  | { ok: false; reason: "signed-out" | "not-allowlisted" | "allowlist-missing"; message: string };

/**
 * Authorization, not authentication.
 *
 * `authenticated` in Postgres means any signed-in user on the project, which
 * is not the same as an admin. The real gate is the `admin_users` allowlist
 * installed by supabase/admin-hardening.sql, checked here through the
 * `is_admin()` function so the app and the RLS policies agree on one answer.
 *
 * Fails CLOSED when that function is missing: an app running against the
 * un-hardened policies would hand full catalogue write access to anyone able
 * to create an account on the project, so refusing to work until the
 * migration is applied is the safe default, not an inconvenience.
 */
export async function requireAdmin(): Promise<AdminCheck> {
  const user = await getAdminUser();
  if (!user) return { ok: false, reason: "signed-out", message: "Not signed in." };

  const supabase = await createAdminSupabaseClient();
  const { data, error } = await supabase.rpc("is_admin");

  if (error) {
    return {
      ok: false,
      reason: "allowlist-missing",
      message: "Admin allowlist is not installed. Run supabase/admin-hardening.sql, then add this account to admin_users.",
    };
  }
  if (data !== true) {
    return { ok: false, reason: "not-allowlisted", message: `${user.email ?? "This account"} is not on the admin allowlist.` };
  }
  return { ok: true, user };
}
