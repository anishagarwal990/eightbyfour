import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VisualFurnitureConfigurator } from "@/components/studio/VisualFurnitureConfigurator";
import { StudioSection } from "@/components/studio/ServiceShell";
import { buildMetadata } from "@/lib/seo";
import { FURNITURE_TYPES } from "@/lib/studio/furniture";

/**
 * The visual designer, one route per furniture type. Same registry as the form
 * configurator drives it, so a new furniture type gets a visual designer for
 * free — the archetype registry supplies the fittings and presets, and falls
 * back to a sensible default if nobody has written one yet.
 */

export function generateStaticParams() {
  return FURNITURE_TYPES.map((t) => ({ item: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ item: string }> }): Promise<Metadata> {
  const { item } = await params;
  const type = FURNITURE_TYPES.find((t) => t.slug === item);
  if (!type) return {};
  return buildMetadata({
    title: `Design a ${type.label} — Visual Configurator | Studio EightxFour`,
    description: `Enter rough dimensions and see your ${type.label.toLowerCase()} as a dimensioned elevation and a 3D model. Add shelves, drawers and hanging, change materials, and watch the estimate move with every decision.`,
    path: `/studio/custom-furniture/${type.slug}/design`,
  });
}

export default async function DesignPage({ params }: { params: Promise<{ item: string }> }) {
  const { item } = await params;
  const type = FURNITURE_TYPES.find((t) => t.slug === item);
  if (!type) notFound();

  return (
    <>
      <section className="studio-grid border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-7">
          <nav className="flex flex-wrap items-center gap-2 text-[12px]" style={{ color: "var(--ink-faint)" }} aria-label="Breadcrumb">
            <Link href="/studio" className="transition-colors hover:text-[var(--burgundy)]">
              Studio
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/studio/custom-furniture" className="transition-colors hover:text-[var(--burgundy)]">
              Custom Furniture
            </Link>
            <span aria-hidden="true">/</span>
            <Link href={`/studio/custom-furniture/${type.slug}`} className="transition-colors hover:text-[var(--burgundy)]">
              {type.label}
            </Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: "var(--ink-soft)" }}>Design</span>
          </nav>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="serif text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.02em]">
                Design your {type.label.toLowerCase()}
              </h1>
              <p className="mt-2.5 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                Give it a rough size and it appears — as a dimensioned elevation, as a model you can turn, and as a
                priced specification. Change the inside, change the materials, and the estimate follows.
              </p>
            </div>
            <Link
              href={`/studio/custom-furniture/${type.slug}`}
              className="shrink-0 rounded-[3px] border px-4 py-2.5 text-[13px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
              style={{ borderColor: "var(--studio-line-strong)" }}
            >
              Use the form instead
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-7">
          <VisualFurnitureConfigurator typeId={type.id} />
        </div>
      </section>

      <StudioSection
        index="What this is"
        title="A rough visual configuration — not a shop drawing."
        intro="What you produce here is a concept visual and an indicative price, built from rough measurements. It is not a production drawing, a cutting list or an approval drawing, and nothing here is cut against."
        tone="deep"
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Rough is fine", b: "Measurements to the nearest inch are enough to size and price the unit." },
            { t: "Everything is counted", b: "Each shelf, drawer, partition and rail in the model is a line on the estimate." },
            { t: "Materials stay named", b: "Board, laminate and hardware keep their brand and link back to the catalogue." },
            { t: "Verified before production", b: "Site measurement and live rates turn this into a fixed quote and a real drawing." },
          ].map((c) => (
            <div
              key={c.t}
              className="rounded-[3px] border p-4"
              style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}
            >
              <p className="text-[14px] font-semibold">{c.t}</p>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                {c.b}
              </p>
            </div>
          ))}
        </div>
      </StudioSection>

      <StudioSection index="Also designable" title="The same engine, other furniture.">
        <div className="flex flex-wrap gap-2">
          {FURNITURE_TYPES.filter((t) => t.id !== type.id).map((t) => (
            <Link
              key={t.id}
              href={`/studio/custom-furniture/${t.slug}/design`}
              className="rounded-[3px] border px-3.5 py-2 text-[13px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
              style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </StudioSection>
    </>
  );
}
