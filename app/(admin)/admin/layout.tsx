import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-server";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/AdminNav";

// The admin area reads live rows and must never be served from a build-time
// cache, or an editor saves a change and the list still shows the old value.
export const dynamic = "force-dynamic";

// NOTE: title/robots metadata and <html>/<body> live in the (admin) root layout
// one level up. This file is only the authenticated application shell.

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // middleware.ts only checks that someone is signed in. This is the
  // authorization check — signed in is not the same as allowlisted, and a
  // matcher mistake must not be the only thing standing between a stranger
  // and the catalogue. Unchanged by the shell rework.
  const check = await requireAdmin();

  if (!check.ok && check.reason !== "signed-out") {
    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          No access
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--line-strong)" }}>
          {check.message}
        </p>
        <div className="mt-5">
          <SignOutButton />
        </div>
      </main>
    );
  }

  const user = check.ok ? check.user : null;

  // Signed out (the login page renders through here) — no shell, just the form.
  if (!user) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className="relative flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2"
        style={{ borderColor: "var(--line)", background: "var(--paper)" }}
      >
        <div className="flex items-center gap-3">
          <AdminMobileNav />
          <Link href="/admin" className="flex items-baseline gap-2">
            <span className="serif text-base leading-none">EightxFour</span>
            <span className="tracked-caps text-[10px]" style={{ color: "var(--line-strong)" }}>
              Operations
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--line-strong)" }}>
          <span className="hidden max-w-[180px] truncate sm:inline">{user.email}</span>
          <SignOutButton />
        </div>
      </header>

      <div className="flex flex-1 items-stretch">
        <AdminSidebar />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
