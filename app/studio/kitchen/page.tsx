import type { Metadata } from "next";
import Link from "next/link";
import { KitchenStudio } from "@/components/studio/kitchen/KitchenStudio";
import { ProcessSteps, StudioSection } from "@/components/studio/ServiceShell";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Design Your Kitchen — Studio Kitchen | Studio EightxFour",
  description:
    "Give Studio your room size and how you cook. It proposes a layout, fills it with cabinets, and shows the plan, the elevations, a 3D model, the BOQ and an indicative price — with every material named.",
  path: "/studio/kitchen",
});

const PROCESS = [
  { title: "Design", body: "Room, brief, layout, cabinets and materials. Nothing is committed and no one calls you." },
  { title: "Verify", body: "Site measurement, service positions checked against what exists, and a fixed quote." },
  { title: "Fabricate", body: "Machined in the factory or built at your site — whichever method you chose." },
  { title: "Install", body: "Fitted, aligned and handed over against a written scope and the material record." },
];

export default function KitchenStudioPage() {
  return (
    <>
      <section className="studio-grid border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-7">
          <nav className="flex flex-wrap items-center gap-2 text-[12px]" style={{ color: "var(--ink-faint)" }} aria-label="Breadcrumb">
            <Link href="/studio" className="transition-colors hover:text-[var(--burgundy)]">
              Studio
            </Link>
            <span aria-hidden="true">/</span>
            <span style={{ color: "var(--ink-soft)" }}>Kitchen</span>
          </nav>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="serif text-[clamp(28px,4vw,44px)] leading-[1.05] tracking-[-0.02em]">Design your kitchen</h1>
              <p className="mt-2.5 max-w-[64ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                Start with rough dimensions and how you actually cook. Studio proposes a layout, fills it with cabinets,
                and shows you the plan, the elevations, a 3D model you can take apart, the bill of quantities and a price
                — with every board, laminate and hinge named.
              </p>
            </div>
            <Link
              href="/studio/custom-furniture"
              className="shrink-0 rounded-[3px] border px-4 py-2.5 text-[13px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
              style={{ borderColor: "var(--studio-line-strong)" }}
            >
              Other furniture
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1440px] px-4 py-8 sm:px-7">
          <KitchenStudio />
        </div>
      </section>

      <StudioSection
        index="What this is"
        title="An approximate design, not a manufacturing drawing."
        intro="What Studio produces here is a layout, a specification and an indicative price built from rough measurements. It is not a production drawing or a cutting list, and nothing is cut against it."
        tone="deep"
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { t: "Rough is enough", b: "Measure to the nearest inch. The layout engine works in millimetres from there." },
            { t: "Every decision is explained", b: "Where Studio places something itself, it says why on the cabinet." },
            { t: "The material stays named", b: "Board, laminate and hardware keep their brand and their catalogue page." },
            { t: "Verified before production", b: "Site measurement and live rates turn this into a fixed quote." },
          ].map((c) => (
            <div key={c.t} className="rounded-[3px] p-4 shadow-[var(--shadow-sm)]" style={{ background: "var(--paper)" }}>
              <p className="text-[14px] font-semibold">{c.t}</p>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                {c.b}
              </p>
            </div>
          ))}
        </div>
      </StudioSection>

      <StudioSection index="How execution works" title="Four stages, and you can stop after the first.">
        <ProcessSteps steps={PROCESS} />
      </StudioSection>
    </>
  );
}
