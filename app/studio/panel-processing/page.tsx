import type { Metadata } from "next";
import Link from "next/link";
import { PanelListBuilder } from "@/components/studio/PanelListBuilder";
import { FaqList, ProcessSteps, ServiceHero, StudioSection, ThreeWaysIn } from "@/components/studio/ServiceShell";
import { UploadDesk } from "@/components/studio/UploadDesk";
import { buildMetadata } from "@/lib/seo";
import { getService } from "@/lib/studio/services";

const service = getService("panel-processing")!;

export const metadata: Metadata = buildMetadata({
  title: "Panel Processing — Cutting, Edge Banding & CNC | Studio EightxFour",
  description:
    "Send a cutting list and get panels sized, edge banded, grooved and line-drilled to a 32 mm system before delivery. Built for carpenters and contractors.",
  path: "/studio/panel-processing",
});

const FAQS = [
  {
    q: "Why factory-band all four edges?",
    a: "Because the two edges nobody bands are the two that fail. An unsealed panel edge takes on moisture, swells and lifts the laminate above it. Factory banding is applied hot to all four sides in one pass, which is the single clearest visible difference between site-made and factory-made furniture.",
  },
  {
    q: "What is 32 mm line drilling?",
    a: "A standard grid of shelf-pin and fitting holes at 32 mm centres. It means shelves are repositionable later and hardware from any manufacturer lands where it expects to.",
  },
  {
    q: "What format should the cutting list be in?",
    a: "Whatever you already keep it in. Excel, CSV, a PDF from your design software, or a photograph of a handwritten list. If it has panel sizes and quantities on it, it can be priced.",
  },
  {
    q: "Do you supply the boards too?",
    a: "You can buy them from the EightByFour catalogue on the same order, have them pressed, and have them machined — one order, one delivery. Or send your own boards and buy the machining alone.",
  },
  {
    q: "What tolerance do you hold?",
    a: "Panel sizing on a beam saw holds around ±0.2 mm, which is what makes factory modules line up. Hand-cut panels on site are typically an order of magnitude looser.",
  },
  {
    q: "Is there a minimum order?",
    a: "There is a handling minimum rather than a panel-count minimum — a very short list costs more per panel because the setup is the same. Regular volume moves onto a running rate card.",
  },
];

const PROCESS = [
  { title: "Send the list", body: "Upload it, or type the panels in below. Sizes and quantities are all that is needed." },
  { title: "Optimise", body: "Panels are nested onto sheets to cut wastage, and the yield is shown back to you." },
  { title: "Machine", body: "Sized on a beam saw, banded, drilled and grooved in one run." },
  { title: "Deliver", body: "Labelled by panel, stacked in assembly order, delivered flat." },
];

export default function PanelProcessingPage() {
  return (
    <>
      <ServiceHero service={service} headline="Send the cutting list. Get panels, sized and banded.">
        <ThreeWaysIn service={service} />
      </ServiceHero>

      <StudioSection
        index="01 — Build the list"
        title="Type the panels, or upload what you already have."
        intro="Rates are per running foot of cut and band, which is how a machine shop actually charges — not a flat per-panel figure that quietly overcharges small panels."
      >
        <PanelListBuilder />
      </StudioSection>

      <StudioSection index="02 — Or upload it" title="A cutting list in any format you already keep it in." tone="deep">
        <UploadDesk />
      </StudioSection>

      <StudioSection index="Services" title="Everything that can happen to a panel before it reaches you.">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {service.scope.map((s) => (
            <div key={s} className="rounded-[3px] border p-4" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
              <p className="text-[13.5px] font-semibold">{s}</p>
            </div>
          ))}
        </div>
      </StudioSection>

      <StudioSection index="How it works" title="Four steps from list to labelled stack." tone="deep">
        <ProcessSteps steps={PROCESS} />
      </StudioSection>

      <StudioSection index="Questions" title="What the trade asks.">
        <FaqList items={FAQS} />
        <div className="mt-8 flex flex-wrap gap-5">
          <Link href="/studio/laminate-pressing" className="text-[14px] font-semibold" style={{ color: "var(--burgundy)" }}>
            Press the boards first <span aria-hidden="true">→</span>
          </Link>
          <Link href="/products/plywood" className="text-[14px] font-semibold" style={{ color: "var(--burgundy)" }}>
            Buy the boards <span aria-hidden="true">→</span>
          </Link>
        </div>
      </StudioSection>
    </>
  );
}
