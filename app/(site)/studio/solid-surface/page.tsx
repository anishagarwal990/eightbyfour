import type { Metadata } from "next";
import Link from "next/link";
import { FaqList, ProcessSteps, ServiceHero, StudioSection, ThreeWaysIn } from "@/components/studio/ServiceShell";
import { SurfaceConfigurator } from "@/components/studio/SurfaceConfigurator";
import { buildMetadata } from "@/lib/seo";
import { getService } from "@/lib/studio/services";

const service = getService("solid-surface")!;

export const metadata: Metadata = buildMetadata({
  title: "Solid Surface Fabrication & Installation | Studio EightxFour",
  description:
    "Configure an acrylic solid surface counter — sheet, run length, edge profile, cut-outs and installation — and see fabrication priced separately from material.",
  path: "/studio/solid-surface",
});

const FAQS = [
  {
    q: "Is this only Corian?",
    a: "No. Corian is one brand of acrylic solid surface; HIMACS, Staron, Durasein and Durian are the same material class and are all fabricated the same way. The configurator prices whichever sheet you choose.",
  },
  {
    q: "Why is the fabrication more than the sheet?",
    a: "Because a counter is not a sheet. Cutting, edge build-up, thermoforming, seaming, cut-outs and polishing are hours of skilled work, and a seamless joint is the single most technical part of the job. A quote that hides this behind a per-square-foot rate is hiding the part that varies most.",
  },
  {
    q: "What does “seamless” actually mean?",
    a: "Two pieces are routed to a matched edge, bonded with a colour-matched two-part adhesive, then sanded and polished flat. Done properly the joint is invisible and non-porous — which is why solid surface is specified in healthcare and food service.",
  },
  {
    q: "Can you match an existing counter?",
    a: "Sometimes. Shade ranges change over time and a five-year-old counter has aged. Send a photo and the shade code if you have it, and we will tell you honestly whether it will match or read as a repair.",
  },
  {
    q: "Do I need a plywood sub-top?",
    a: "For 12 mm sheet over a cabinet run, yes — the sub-top carries the load and the solid surface carries the surface. It is priced on the estimate as a material line, not hidden in the rate.",
  },
  {
    q: "How long does it take?",
    a: "Template to installation is typically 8–12 days on a residential kitchen. Thermoformed or curved work takes longer because the shape has to be made before it can be finished.",
  },
];

const PROCESS = [
  { title: "Configure", body: "Pick the sheet, the run length and the cut-outs to get an indicative number today." },
  { title: "Template", body: "A physical or laser template is taken on site once the cabinets are in place." },
  { title: "Fabricate", body: "Cut, edge built up, cut-outs machined, joints bonded and the whole piece polished." },
  { title: "Install", body: "Delivered, seated, seamed in place where needed, and polished after fitting." },
];

export default function SolidSurfacePage() {
  return (
    <>
      <ServiceHero service={service} headline="Seamless surfaces, priced by the joint — not by the brochure.">
        <ThreeWaysIn service={service} />
      </ServiceHero>

      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-7">
          <SurfaceConfigurator />
        </div>
      </section>

      <StudioSection
        index="Where it goes"
        title="The same material, six different jobs."
        intro="Complexity is what changes between them: a straight kitchen run and a curved reception desk use identical sheets and take very different amounts of skilled time."
        tone="deep"
      >
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {service.scope.map((s) => (
            <div key={s} className="rounded-[3px] border p-4" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
              <p className="text-[13.5px] font-semibold">{s}</p>
            </div>
          ))}
        </div>
      </StudioSection>

      <StudioSection index="How execution works" title="Template first. Everything else follows it.">
        <ProcessSteps steps={PROCESS} />
      </StudioSection>

      <StudioSection index="Questions" title="What people ask about solid surface." tone="deep">
        <FaqList items={FAQS} />
        <div className="mt-8">
          <Link href="/products/corian-acrylic-solid-surface" className="text-[14px] font-semibold" style={{ color: "var(--burgundy)" }}>
            Browse solid surface sheets in the catalogue <span aria-hidden="true">→</span>
          </Link>
        </div>
      </StudioSection>
    </>
  );
}
