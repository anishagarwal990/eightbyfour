import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { FurnitureConfigurator } from "@/components/studio/FurnitureConfigurator";
import { FaqList, ProcessSteps, ServiceHero, StudioSection, ThreeWaysIn } from "@/components/studio/ServiceShell";
import { buildMetadata } from "@/lib/seo";
import { FURNITURE_TYPES } from "@/lib/studio/furniture";
import { getService } from "@/lib/studio/services";

const service = getService("custom-furniture")!;

export const metadata: Metadata = buildMetadata({
  title: "Custom Furniture — Configure & Price | Studio EightxFour",
  description:
    "Configure a wardrobe, kitchen or storage unit by carcass, shutter, finish and hardware — carpenter made or factory modular — and see an indicative price with every material named.",
  path: "/studio/custom-furniture",
});

const FAQS = [
  {
    q: "Is this a real price?",
    a: "It is a real calculation on demo rates. The engine derives sheet counts, hinge counts and labour from your dimensions rather than looking up a slab rate, so the number moves for the right reasons — but material rates change weekly and no site is square. A verified quote follows site measurement.",
  },
  {
    q: "Why is factory modular more expensive here?",
    a: "On most specifications it is, and the difference is almost entirely edge banding and machining: factory panels are banded on all four edges and line-drilled to a 32 mm system. Carpenter work bands the visible edges. You are paying for a different product, not a different margin.",
  },
  {
    q: "Can I supply my own materials?",
    a: "Yes — that is what the Installation service is for. If you already have the boards and laminates, Studio EightxFour can quote fabrication and installation alone.",
  },
  {
    q: "What is not in this estimate?",
    a: "Electrical work, plumbing, civil changes, false ceilings, loose furniture and any scaffolding or lift charges specific to your building. Those appear on the verified quote once the site is seen.",
  },
  {
    q: "Do I have to take the whole thing from you?",
    a: "No. Materials can be bought from the EightByFour catalogue without any Studio service, and Studio services can be bought without buying the materials here. The quote is separated so either half stands on its own.",
  },
  {
    q: "Who actually does the work?",
    a: "Carpenter-made work is executed by studio carpenters at your site. Factory modular panels are machined at a partner facility and installed by the studio's own fitting team.",
  },
];

const PROCESS = [
  { title: "Configure", body: "Set the specification here and save it. Nothing is committed and no one calls you." },
  { title: "Verify", body: "Site measurement, material availability check and a fixed quote with a written scope." },
  { title: "Fabricate", body: "Carpentry at site, or CNC machining and pre-assembly in the factory." },
  { title: "Install", body: "Fitting, hardware adjustment, alignment and handover with the material record attached." },
];

export default function CustomFurniturePage() {
  return (
    <>
      <ServiceHero service={service} headline="Custom furniture, configured down to the hinge.">
        <ThreeWaysIn service={service} />
      </ServiceHero>

      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 pt-10 sm:px-7">
          <Reveal>
            <div
              className="flex flex-col gap-4 rounded-[3px] border p-5 sm:flex-row sm:items-center sm:justify-between"
              style={{ borderColor: "var(--burgundy)", background: "color-mix(in srgb, var(--burgundy) 4%, var(--paper))" }}
            >
              <div>
                <p className="tracked-caps text-[10px]" style={{ color: "var(--burgundy)" }}>
                  New
                </p>
                <h2 className="serif mt-1 text-[21px] leading-tight">Would you rather see it than fill it in?</h2>
                <p className="mt-1.5 max-w-[62ch] text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  Give a rough size and the furniture appears — a dimensioned elevation, a 3D model you can turn, and an
                  exploded view showing every panel. Fit out each compartment and the estimate follows.
                </p>
              </div>
              <Link
                href="/studio/custom-furniture/wardrobe/design"
                className="shrink-0 rounded-[3px] px-5 py-3 text-center text-[14px] font-semibold text-white"
                style={{ background: "var(--burgundy)" }}
              >
                Open the visual designer
              </Link>
            </div>
          </Reveal>
        </div>
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-7">
          <FurnitureConfigurator />
        </div>
      </section>

      <StudioSection
        index="Every type"
        title="The same engine, across the catalogue of furniture."
        intro="Each type carries its own board consumption, shutter density and labour rate — a vanity is not a wardrobe scaled down."
        tone="deep"
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {FURNITURE_TYPES.map((t) => (
            <Link
              key={t.id}
              href={`/studio/custom-furniture/${t.slug}`}
              className="rounded-[3px] p-4 shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
              style={{ background: "var(--paper)" }}
            >
              <p className="text-[15px] font-semibold">{t.label}</p>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                {t.blurb}
              </p>
              <p className="metric mt-3 text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
                Typical {t.defaults.width}′ × {t.defaults.height}′ × {t.defaults.depth}′
              </p>
            </Link>
          ))}
        </div>
      </StudioSection>

      <StudioSection
        index="Materials"
        title="Nothing on the quote is called “premium” and left at that."
        intro="Each line on the estimate points at a real catalogue category. If you want to check a board rate against what you would pay buying it yourself, the link is right there on the line."
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: "Plywood", href: "/products/plywood", body: "MR, BWP and fire-retardant grades in 8×4 sheets." },
            { name: "MDF & HDHMR", href: "/products/mdf-and-hdhmr", body: "Flat, machinable board for shutters and mouldings." },
            { name: "Laminates", href: "/products/laminates", body: "0.8 mm and 1 mm, searchable by shade code." },
            { name: "Adhesives", href: "/products/adhesive", body: "Press-grade and site-grade bonding." },
          ].map((c) => (
            <Link
              key={c.name}
              href={c.href}
              className="rounded-[3px] p-4 shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
              style={{ background: "var(--paper)" }}
            >
              <p className="text-[14px] font-semibold">{c.name}</p>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                {c.body}
              </p>
              <p className="mt-2.5 text-[12.5px] font-semibold" style={{ color: "var(--burgundy)" }}>
                Shop <span aria-hidden="true">→</span>
              </p>
            </Link>
          ))}
        </div>
      </StudioSection>

      <StudioSection index="How execution works" title="Four stages, and you can stop after the first." tone="deep">
        <ProcessSteps steps={PROCESS} />
      </StudioSection>

      <StudioSection index="Questions" title="What people ask before they commit.">
        <FaqList items={FAQS} />
        <Reveal>
          <div
            className="mt-10 flex flex-col gap-4 rounded-[3px] border p-6 sm:flex-row sm:items-center sm:justify-between"
            style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}
          >
            <div>
              <h3 className="serif text-[22px] leading-tight">Already have drawings?</h3>
              <p className="mt-1.5 max-w-[52ch] text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                Skip the configurator. Send elevations, a BOQ or a cutting list and get the whole scope priced back
                against the same rates.
              </p>
            </div>
            <Link
              href="/studio/project-execution"
              className="shrink-0 rounded-[3px] px-5 py-3 text-center text-[14px] font-semibold text-white"
              style={{ background: "var(--burgundy)" }}
            >
              Upload drawing / BOQ
            </Link>
          </div>
        </Reveal>
      </StudioSection>
    </>
  );
}
