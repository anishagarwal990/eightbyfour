import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { StudioNav } from "@/components/studio/StudioNav";
import { requireAdmin } from "@/lib/supabase/admin-server";
import { STUDIO_SERVICES } from "@/lib/studio/services";

/**
 * Studio EightxFour is a branded environment inside EightByFour, not a
 * separate site: the master header, footer and mobile CTA above this all stay.
 * What this layout adds is the studio ground (.studio), the service nav and a
 * closing band that hands the visitor back to the catalogue.
 *
 * ACCESS: not public yet. middleware.ts turns anonymous visitors away at the
 * door; this is the authorization check, because being signed in to the
 * Supabase project is not the same as being on the admin allowlist. Same
 * reasoning — and the same `requireAdmin()` — as the catalogue admin.
 *
 * Why it is gated at all: every configurator under here quotes real rupees
 * from rates that have not been validated against a single supplier
 * quotation (docs/STUDIO-PRICING-VALIDATION.md). A number a stranger can
 * screenshot is a number we can be held to.
 */

// Every page below reads the session, so none of them can be statically
// rendered. Declared rather than left to inference so a future page that
// forgets to read cookies is not silently cached and served to anyone.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  // Belt and braces with robots.ts: a crawler that reaches these only ever
  // gets a login redirect, but a gated page must never be an indexable one.
  robots: { index: false, follow: false },
};

export default async function StudioLayout({ children }: { children: React.ReactNode }) {
  const check = await requireAdmin();

  if (!check.ok) {
    // Signed out should already have been caught by middleware; if the
    // matcher is ever wrong, fail closed here rather than render.
    if (check.reason === "signed-out") redirect("/admin/login?next=/studio");

    return (
      <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Studio is not open yet
        </h1>
        <p className="mt-3 text-sm" style={{ color: "var(--line-strong)" }}>
          {check.message}
        </p>
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <SignOutButton />
          <Link href="/" className="text-sm underline">
            Back to the catalogue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="studio flex-1">
      <StudioNav />
      {children}
      <section className="studio-rule" style={{ background: "var(--stone-deep)" }}>
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-12 sm:px-7 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              Studio EightxFour
            </p>
            <h2 className="serif mt-2 text-[clamp(24px,3vw,32px)] leading-tight">
              The materials come from the same place the studio builds with.
            </h2>
            <p className="mt-3 max-w-[54ch] text-[14px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Every board, laminate and hinge on a Studio quote is a product you can open in the EightByFour catalogue
              and price yourself. That is the whole idea — the material does not disappear inside the quotation.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/products"
                className="rounded-[3px] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors"
                style={{ background: "var(--burgundy)" }}
              >
                Shop materials
              </Link>
              <Link
                href="/studio/project-execution"
                className="rounded-[3px] border px-4 py-2.5 text-[13px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                style={{ borderColor: "var(--studio-line-strong)" }}
              >
                Upload a BOQ
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 self-end">
            {STUDIO_SERVICES.map((s) => (
              <Link
                key={s.slug}
                href={`/studio/${s.slug}`}
                className="flex min-h-11 items-center gap-2 border-b text-[13px] transition-colors hover:text-[var(--burgundy)]"
                style={{ borderColor: "var(--studio-line)" }}
              >
                <span className="metric text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  {s.index}
                </span>
                {s.navLabel}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
