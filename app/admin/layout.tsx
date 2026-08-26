import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/admin-server";
import { SignOutButton } from "@/components/admin/SignOutButton";

// Belt and braces with robots.ts — a noindex header on the area itself means
// an admin URL pasted into a chat or a referrer log can never be indexed.
export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

// The admin area reads live rows and must never be served from a build-time
// cache, or an editor saves a change and the list still shows the old value.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // middleware.ts only checks that someone is signed in. This is the
  // authorization check — signed in is not the same as allowlisted, and a
  // matcher mistake must not be the only thing standing between a stranger
  // and the catalogue.
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

  return (
    <div className="min-h-screen" style={{ background: "var(--paper)" }}>
      {user ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b px-6 py-3" style={{ borderColor: "var(--line)" }}>
          <div className="flex items-center gap-5">
            <Link href="/admin" className="serif text-lg">
              Catalogue admin
            </Link>
            <Link href="/" className="text-xs hover:opacity-70" style={{ color: "var(--line-strong)" }}>
              View site
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs" style={{ color: "var(--line-strong)" }}>
            <span>{user.email}</span>
            <SignOutButton />
          </div>
        </header>
      ) : null}
      {children}
    </div>
  );
}
