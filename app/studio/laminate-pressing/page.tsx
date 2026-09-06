import type { Metadata } from "next";
import Link from "next/link";
import { PressingConfigurator } from "@/components/studio/PressingConfigurator";
import { FaqList, ProcessSteps, ServiceHero, StudioSection, ThreeWaysIn } from "@/components/studio/ServiceShell";
import { buildMetadata } from "@/lib/seo";
import { getService } from "@/lib/studio/services";

const service = getService("laminate-pressing")!;

export const metadata: Metadata = buildMetadata({
  title: "Laminate Pressing — Board + Laminate, Pressed | Studio EightxFour",
  description:
    "Choose a board and a laminate from the EightByFour catalogue and have them pressed before delivery. Single or double side, cut to size, edge banded.",
  path: "/studio/laminate-pressing",
});

const FAQS = [
  {
    q: "Why press at a workshop instead of on site?",
    a: "Even pressure and even glue spread. A hot press applies both across the whole sheet at once; a site press applies neither. The visible consequences are bubbles at the edges, a wavy face under raking light, and laminate that lifts at a corner two years later.",
  },
  {
    q: "Do I have to press both sides?",
    a: "Not always, but for anything that is not fixed flat against a wall, yes. A sheet pressed on one face cups towards that face as the adhesive cures. The balancing laminate on the reverse is not decorative — it is what holds the panel flat.",
  },
  {
    q: "Can I use my own laminate?",
    a: "Yes. Bring the laminate and buy the board here, bring both, or buy both here. The pressing charge is the same either way; only the material lines change.",
  },
  {
    q: "What sizes can you press?",
    a: "Standard 8 × 4 ft sheets are routine. Larger formats depend on the press bed — send the size before ordering and we will confirm.",
  },
  {
    q: "How long does it take?",
    a: "Pressing is same-day once material is in. Allow a curing period before cutting; panels are despatched cured, not warm off the press.",
  },
  {
    q: "Can you cut and edge band as well?",
    a: "Yes — that is Panel Processing, and it can run straight after pressing on the same order so the panels arrive sized and banded.",
  },
];

const PROCESS = [
  { title: "Choose", body: "Board and laminate from the catalogue, single or double side, quantity." },
  { title: "Press", body: "Hot pressed under even pressure, then trimmed flush on all four edges." },
  { title: "Cure", body: "Panels rest before cutting so the bond is stable when they reach a saw." },
  { title: "Deliver", body: "Flat-stacked and protected, straight to your site or your workshop." },
];

export default function LaminatePressingPage() {
  return (
    <>
      <ServiceHero service={service} headline="Buy the board. Choose the laminate. It arrives pressed.">
        <ThreeWaysIn service={service} />
      </ServiceHero>

      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-7">
          <PressingConfigurator />
        </div>
      </section>

      <StudioSection index="How it works" title="Four steps, and none of them happen on your floor." tone="deep">
        <ProcessSteps steps={PROCESS} />
      </StudioSection>

      <StudioSection index="Questions" title="What carpenters and contractors ask.">
        <FaqList items={FAQS} />
        <div className="mt-8 flex flex-wrap gap-5">
          <Link href="/products/plywood" className="text-[14px] font-semibold" style={{ color: "var(--burgundy)" }}>
            Browse boards <span aria-hidden="true">→</span>
          </Link>
          <Link href="/products/laminates" className="text-[14px] font-semibold" style={{ color: "var(--burgundy)" }}>
            Browse laminates <span aria-hidden="true">→</span>
          </Link>
          <Link href="/studio/panel-processing" className="text-[14px] font-semibold" style={{ color: "var(--burgundy)" }}>
            Add cutting & edge banding <span aria-hidden="true">→</span>
          </Link>
        </div>
      </StudioSection>
    </>
  );
}
