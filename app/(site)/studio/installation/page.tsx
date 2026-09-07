import type { Metadata } from "next";
import Link from "next/link";
import { InstallationPicker } from "@/components/studio/InstallationPicker";
import { FaqList, ProcessSteps, ServiceHero, StudioSection, ThreeWaysIn } from "@/components/studio/ServiceShell";
import { buildMetadata } from "@/lib/seo";
import { getService } from "@/lib/studio/services";

const service = getService("installation")!;

export const metadata: Metadata = buildMetadata({
  title: "Installation Services — Laminate, Veneer, Panels & Hardware | Studio EightxFour",
  description:
    "Installation-only scope for material you already have: laminate, veneer, wall panels, louvers, solid surface, hardware and doors — priced by area or unit.",
  path: "/studio/installation",
});

const FAQS = [
  {
    q: "Do I have to buy the material from you?",
    a: "No. This service exists precisely for people who already have it. Material bought elsewhere is fitted at the same rate; we just ask to see it before the crew is scheduled, because a warped sheet is not an installation problem you want discovered on the day.",
  },
  {
    q: "Why does site condition change the price?",
    a: "Because it changes the work. A prepared, empty room lets a crew work continuously. A live site with residents, restricted hours and furniture to protect takes longer for identical output, and pretending otherwise is how quotes turn into arguments.",
  },
  {
    q: "What if the substrate is bad?",
    a: "We tell you before starting, not after. Making-good of damaged or uneven substrates is quoted separately, because it is genuinely a different job from fitting a finish over a sound one.",
  },
  {
    q: "Is there a minimum charge?",
    a: "Yes, per scope. Below a certain quantity the crew visit costs more than the work does, and the estimate shows you when you have hit that floor rather than hiding it.",
  },
];

const PROCESS = [
  { title: "Scope", body: "What is being fitted, how much of it, and what state the site is in." },
  { title: "Check", body: "Material inspected and the substrate assessed before anything is scheduled." },
  { title: "Fit", body: "Installed by the studio's own crew against a written scope." },
  { title: "Hand over", body: "Adjusted, cleaned and recorded against the job." },
];

export default function InstallationPage() {
  return (
    <>
      <ServiceHero service={service} headline="You already have the material. This is the crew that fits it.">
        <ThreeWaysIn service={service} />
      </ServiceHero>

      <StudioSection
        index="01 — Scope and area"
        title="Pick what needs fitting and how much of it."
        intro="Rates are per square foot, per running foot or per unit — whichever is how that trade is actually measured."
      >
        <InstallationPicker />
      </StudioSection>

      <StudioSection index="Scope" title="What installation covers today." tone="deep">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {service.scope.map((s) => (
            <div key={s} className="rounded-[3px] border p-4" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
              <p className="text-[13.5px] font-semibold">{s}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-[13px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
          The list grows. If what you need fitting is a surface or a fixture and it is not here, ask — the architecture
          is built to add scopes, not to route you elsewhere.
        </p>
      </StudioSection>

      <StudioSection index="How it works" title="Nothing is scheduled before the material is seen.">
        <ProcessSteps steps={PROCESS} />
      </StudioSection>

      <StudioSection index="Questions" title="What people ask about installation-only work." tone="deep">
        <FaqList items={FAQS} />
        <div className="mt-8 flex flex-wrap gap-5">
          <Link href="/studio/custom-furniture" className="text-[14px] font-semibold" style={{ color: "var(--burgundy)" }}>
            Need it made as well? <span aria-hidden="true">→</span>
          </Link>
          <Link href="/products" className="text-[14px] font-semibold" style={{ color: "var(--burgundy)" }}>
            Buy the material <span aria-hidden="true">→</span>
          </Link>
        </div>
      </StudioSection>
    </>
  );
}
