import Link from "next/link";
import { StudioNav } from "@/components/studio/StudioNav";
import { STUDIO_SERVICES } from "@/lib/studio/services";

/**
 * Studio EightxFour is a branded environment inside EightByFour, not a
 * separate site: the master header, footer and mobile CTA above this all stay.
 * What this layout adds is the studio ground (.studio), the service nav and a
 * closing band that hands the visitor back to the catalogue.
 */
export default function StudioLayout({ children }: { children: React.ReactNode }) {
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
                className="flex items-baseline gap-2 border-b py-2 text-[13px] transition-colors hover:text-[var(--burgundy)]"
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
