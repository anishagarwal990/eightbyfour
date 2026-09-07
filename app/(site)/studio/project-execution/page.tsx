import type { Metadata } from "next";
import Link from "next/link";
import { FaqList, ProcessSteps, ServiceHero, StudioSection, ThreeWaysIn } from "@/components/studio/ServiceShell";
import { UploadDesk } from "@/components/studio/UploadDesk";
import { buildMetadata } from "@/lib/seo";
import { getService } from "@/lib/studio/services";

const service = getService("project-execution")!;

export const metadata: Metadata = buildMetadata({
  title: "Project Execution — Upload a BOQ or Drawing | Studio EightxFour",
  description:
    "For architects, designers, contractors and rollout teams: upload a BOQ, drawing set, material schedule or cutting list and get materials, fabrication, installation and logistics priced separately.",
  path: "/studio/project-execution",
});

const AUDIENCES = [
  { label: "Architects", need: "Specification held exactly as drawn, with substitutions flagged rather than made quietly." },
  { label: "Interior designers", need: "Finish schedules honoured, shade codes tracked, samples before commitment." },
  { label: "Contractors", need: "Rates you can check line by line against your own estimate." },
  { label: "Retail rollouts", need: "The same fixture, repeatably, across sites and phases." },
  { label: "Hospitality", need: "Programme-driven delivery with phased despatch to the floor being worked." },
  { label: "Corporate interiors", need: "Workstations and storage walls at volume, on a fixed handover date." },
  { label: "Builders & developers", need: "Per-unit specifications repeated across a block, priced once." },
];

const FAQS = [
  {
    q: "What do you need from me to quote?",
    a: "Whatever you already have. A BOQ is ideal, a drawing set works, and a material schedule plus rough areas is enough for a first pass. Assumptions we had to make are listed on the quote so you can correct them rather than discover them.",
  },
  {
    q: "Will you substitute brands?",
    a: "Not silently. Where a specified product is unavailable we quote the specification as drawn and put the alternative beside it, with the price difference and the reason. Substitution is your decision, not ours.",
  },
  {
    q: "Can you price materials only?",
    a: "Yes. Materials, fabrication, installation and logistics are quoted as separate blocks precisely so you can take any of them and leave the rest.",
  },
  {
    q: "How do you handle phased sites?",
    a: "Despatch is planned against your programme rather than dumped in one delivery. On rollouts that usually means a fixed kit per site and a schedule of dates.",
  },
  {
    q: "What about variations?",
    a: "Variations are priced against the same rate card as the original quote, so a change mid-project does not become a renegotiation.",
  },
  {
    q: "How long does a quote take?",
    a: "A clean BOQ typically comes back within two working days. A drawing set that has to be taken off takes longer, and we tell you which one yours is when it arrives.",
  },
];

const PROCESS = [
  { title: "Upload", body: "BOQ, drawings, material schedule or cutting list — as many files as you have." },
  { title: "Take off", body: "Quantities checked against the drawings, assumptions listed openly." },
  { title: "Quote", body: "Materials, fabrication, installation and logistics returned as separate blocks." },
  { title: "Execute", body: "Phased supply, fabrication and installation against your programme." },
];

export default function ProjectExecutionPage() {
  return (
    <>
      <ServiceHero service={service} headline="Send the drawing. We'll price the materials and the execution.">
        <ThreeWaysIn service={service} />
      </ServiceHero>

      <StudioSection
        index="01 — Upload"
        title="Everything you already have, in the format you already have it."
        intro="Nothing here is a lead-capture form. Drop the files, see how they are classified, and see the shape of the quote that comes back before you hand over a phone number."
      >
        <UploadDesk />
      </StudioSection>

      <StudioSection index="Who this is for" title="Professionals working from documents, not configurators." tone="deep">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {AUDIENCES.map((a) => (
            <div key={a.label} className="rounded-[3px] border p-4" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
              <p className="text-[14px] font-semibold">{a.label}</p>
              <p className="mt-1 text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                {a.need}
              </p>
            </div>
          ))}
        </div>
      </StudioSection>

      <StudioSection index="How it works" title="From file to programme.">
        <ProcessSteps steps={PROCESS} />
      </StudioSection>

      <StudioSection index="Questions" title="What project teams ask first." tone="deep">
        <FaqList items={FAQS} />
        <div className="mt-8">
          <Link href="/studio/custom-furniture" className="text-[14px] font-semibold" style={{ color: "var(--burgundy)" }}>
            Price one wardrobe first, to sanity-check the rates <span aria-hidden="true">→</span>
          </Link>
        </div>
      </StudioSection>
    </>
  );
}
