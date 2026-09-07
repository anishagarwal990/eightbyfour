import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FurnitureConfigurator } from "@/components/studio/FurnitureConfigurator";
import { WardrobeEstimator } from "@/components/studio/WardrobeEstimator";
import { ProcessSteps, StudioSection } from "@/components/studio/ServiceShell";
import { buildMetadata } from "@/lib/seo";
import { FURNITURE_TYPES } from "@/lib/studio/furniture";

/**
 * Per-type configurator routes — /studio/custom-furniture/wardrobe and its
 * siblings. These exist because "modular kitchen price Hyderabad" and
 * "wardrobe cost" are different searches with different intent, and because
 * the configurator should open already pointed at what the visitor came for.
 * The registry drives the routes, so a new furniture type is one array entry.
 */

export function generateStaticParams() {
  return FURNITURE_TYPES.map((t) => ({ item: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ item: string }> }): Promise<Metadata> {
  const { item } = await params;
  const type = FURNITURE_TYPES.find((t) => t.slug === item);
  if (!type) return {};
  return buildMetadata({
    title: `${type.label} — Configure & Price | Studio EightxFour`,
    description: `Configure a ${type.label.toLowerCase()} by carcass, shutter, finish and hardware, carpenter made or factory modular, and see an indicative price with every material named.`,
    path: `/studio/custom-furniture/${type.slug}`,
  });
}

const PROCESS = [
  { title: "Configure", body: "Set the specification and keep it. Nothing is committed at this stage." },
  { title: "Verify", body: "Site measurement and live material rates turn the estimate into a fixed quote." },
  { title: "Fabricate", body: "At your site or in the factory — whichever build method you chose." },
  { title: "Install", body: "Fitted, adjusted and handed over against a written scope." },
];

export default async function FurnitureTypePage({ params }: { params: Promise<{ item: string }> }) {
  const { item } = await params;
  const type = FURNITURE_TYPES.find((t) => t.slug === item);
  if (!type) notFound();

  const others = FURNITURE_TYPES.filter((t) => t.id !== type.id);

  return (
    <>
      <section className="studio-grid border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-7">
          <nav className="flex items-center gap-2 text-[12px]" style={{ color: "var(--ink-faint)" }} aria-label="Breadcrumb">
            <Link href="/studio" className="transition-colors hover:text-[var(--burgundy)]">
              Studio
            </Link>
            <span aria-hidden="true">/</span>
            <Link href="/studio/custom-furniture" className="transition-colors hover:text-[var(--burgundy)]">
              Custom Furniture
            </Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: "var(--ink-soft)" }}>{type.label}</span>
          </nav>
          <h1 className="serif mt-4 text-[clamp(30px,4.2vw,50px)] leading-[1.05] tracking-[-0.02em]">{type.label}</h1>
          <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {type.blurb} Configured below at a typical {type.defaults.width}′ × {type.defaults.height}′ ×{" "}
            {type.defaults.depth}′ — change anything and the estimate moves with it.
          </p>
          <Link
            href={`/studio/custom-furniture/${type.slug}/design`}
            className="mt-5 inline-flex items-center gap-2 rounded-[3px] px-4 py-2.5 text-[13.5px] font-semibold text-white transition-colors"
            style={{ background: "var(--burgundy)" }}
          >
            Design it visually
            <span aria-hidden="true">→</span>
          </Link>
          <p className="mt-2 text-[12.5px]" style={{ color: "var(--ink-faint)" }}>
            See it as a dimensioned elevation and a 3D model, and fit out the inside compartment by compartment.
          </p>
        </div>
      </section>

      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-7">
          {/* Wardrobe runs the V1 component-based estimator (elevation area
              × seven independent buckets). Every other type stays on the
              original shared configurator until its own model is built. */}
          {type.id === "wardrobe" ? (
            <WardrobeEstimator />
          ) : (
            <FurnitureConfigurator initialTypeId={type.id} />
          )}
        </div>
      </section>

      <StudioSection index="How execution works" title="Four stages, and you can stop after the first." tone="deep">
        <ProcessSteps steps={PROCESS} />
      </StudioSection>

      <StudioSection index="Also configurable" title="Other furniture on the same engine.">
        <div className="flex flex-wrap gap-2">
          {others.map((t) => (
            <Link
              key={t.id}
              href={`/studio/custom-furniture/${t.slug}`}
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
