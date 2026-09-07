import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { MiniConfigurator } from "@/components/studio/MiniConfigurator";
import { SpecPriceDemo } from "@/components/studio/SpecPriceDemo";
import { MaterialLadder } from "@/components/studio/MaterialLadder";
import { PriceComposition } from "@/components/studio/PriceComposition";
import { StartingPoints } from "@/components/studio/StartingPoints";
import { buildMetadata } from "@/lib/seo";
import { STUDIO_ASSURANCES, STUDIO_SERVICES } from "@/lib/studio/services";
import { inr } from "@/lib/studio/format";
import { BUILD_METHODS } from "@/lib/studio/furniture";

export const metadata: Metadata = buildMetadata({
  title: "Studio EightxFour — Configure Interior Fabrication & Installation",
  description:
    "Configure furniture, solid surface, laminate pressing and panel processing against real materials — and see an indicative execution price before you speak to anyone.",
  path: "/studio",
});

const JOURNEY = [
  { step: "Source", side: "EightByFour", items: ["Plywood", "MDF & HDHMR", "Laminates", "Veneers", "Hardware", "Solid surface"] },
  { step: "Configure", side: "Studio", items: ["Dimensions", "Carcass & shutters", "Finish", "Hardware tier", "Build method"] },
  { step: "Fabricate", side: "Studio", items: ["Cut", "Press", "Machine", "Edge band", "Build"] },
  { step: "Install", side: "Studio", items: ["Deliver", "Fit", "Align", "Finish", "Hand over"] },
];

const BUNDLES = [
  {
    materials: ["19 mm BWP Plywood", "1 mm Greenlam laminate", "Balancing laminate"],
    service: "Laminate pressing",
    result: "Finished panel, delivered pressed",
    href: "/studio/laminate-pressing",
    cta: "Build a pressed panel",
  },
  {
    materials: ["12 mm HIMACS sheet", "Colour-matched adhesive", "Ply sub-top"],
    service: "Solid surface fabrication",
    result: "Seamless counter, fitted",
    href: "/studio/solid-surface",
    cta: "Configure a counter",
  },
  {
    materials: ["BWP ply carcass", "MDF shutters", "Hettich hardware"],
    service: "Carpentry + installation",
    result: "Wardrobe, installed",
    href: "/studio/custom-furniture",
    cta: "Configure furniture",
  },
];

const HOW_IT_WORKS = [
  { n: "01", title: "Configure", body: "Build the specification yourself and watch the estimate move. No form, no callback, no waiting." },
  { n: "02", title: "Verify", body: "Send it in. Site measurement and live material rates turn the estimate into a fixed quotation with a written scope." },
  { n: "03", title: "Fabricate", body: "Materials are drawn from EightByFour supply and worked either at your site or in the factory — whichever you chose." },
  { n: "04", title: "Install", body: "Fitted, aligned and handed over, with the material record attached to the same order." },
];

export default function StudioLandingPage() {
  return (
    <>
      {/* ---------------------------------------------------------- hero -- */}
      <section className="studio-grid border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-12 sm:px-7 lg:grid-cols-[1.05fr_minmax(0,420px)] lg:items-center lg:py-20">
          <Reveal>
            <p className="tracked-caps text-[11px]" style={{ color: "var(--burgundy)" }}>
              Studio EightxFour · Fabrication. Installation. Execution.
            </p>
            <h1 className="serif mt-4 text-[clamp(38px,5.4vw,68px)] leading-[1.03] tracking-[-0.02em]">
              Built around
              <br />
              your room.
            </h1>
            <p className="mt-5 max-w-[56ch] text-[16px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Custom furniture, priced the way it is actually built. Give Studio your dimensions, choose the board,
              the fronts and the hardware, and watch the estimate move with every decision — with every material
              named. No package, no consultation required to see a number.
            </p>
            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                href="/studio/custom-furniture/wardrobe/design"
                className="rounded-[3px] px-5 py-3 text-[14px] font-semibold text-white transition-colors"
                style={{ background: "var(--burgundy)" }}
              >
                Design your furniture
              </Link>
              <Link
                href="/studio/custom-furniture/wardrobe"
                className="rounded-[3px] border px-5 py-3 text-[14px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                style={{ borderColor: "var(--studio-line-strong)" }}
              >
                Get an instant estimate
              </Link>
            </div>
            <p className="mt-4 text-[13px]" style={{ color: "var(--ink-soft)" }}>
              Planning a kitchen?{" "}
              <Link href="/studio/kitchen" className="font-semibold underline decoration-[var(--studio-line-strong)] underline-offset-2 transition-colors hover:text-[var(--burgundy)]" style={{ color: "var(--burgundy)" }}>
                Start from the room
              </Link>
            </p>
            <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px]" style={{ color: "var(--ink-faint)" }}>
              <span>One unit or a hundred.</span>
              <span className="hidden sm:block" aria-hidden="true">·</span>
              <span>Homes, offices, retail.</span>
            </p>
          </Reveal>

          <Reveal strong>
            <MiniConfigurator />
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------ materials -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              Start with the board
            </p>
            <h2 className="serif mt-2 max-w-[24ch] text-[clamp(26px,3.6vw,42px)] leading-[1.08]">
              Every board we build with, and what each one is actually for.
            </h2>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              This is the decision that moves the price most, and the one customers are usually asked to take on
              trust. Cheapest first.
            </p>
          </Reveal>
          <div className="mt-8">
            <MaterialLadder />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------- where to start -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              Not sure where to start
            </p>
            <h2 className="serif mt-2 max-w-[26ch] text-[clamp(26px,3.6vw,42px)] leading-[1.08]">
              Four sensible places to begin, and why.
            </h2>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Real material combinations priced on the same 8′ × 8′ wardrobe, so they compare. Change anything once
              you are inside.
            </p>
          </Reveal>
          <div className="mt-8">
            <StartingPoints />
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- price composition -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              Where the number comes from
            </p>
            <h2 className="serif mt-2 max-w-[26ch] text-[clamp(26px,3.6vw,42px)] leading-[1.08]">
              A price is composed, not quoted at you.
            </h2>
            <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Carcass, finish, shutters, hardware and the work to build and fit it. Change one and only that group
              moves — try it below.
            </p>
          </Reveal>
          <div className="mt-8">
            <PriceComposition />
          </div>
        </div>
      </section>

      {/* ------------------------------------------- material → execution -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              02 — Material to execution
            </p>
            <h2 className="serif mt-3 max-w-[22ch] text-[clamp(26px,3.4vw,40px)] leading-[1.1]">
              EightByFour supplies it. Studio EightxFour builds with it.
            </h2>
          </Reveal>

          <Reveal stagger className="mt-8 grid gap-px overflow-hidden rounded-[3px] sm:grid-cols-2 lg:grid-cols-4" style={{ background: "var(--studio-line)" }}>
            {JOURNEY.map((phase, i) => (
              <div key={phase.step} className="p-5" style={{ background: "var(--paper)" }}>
                <div className="flex items-baseline justify-between">
                  <span className="metric text-[11px]" style={{ color: "var(--ink-faint)" }}>
                    0{i + 1}
                  </span>
                  <span
                    className="tracked-caps rounded-[2px] px-1.5 py-0.5 text-[9px]"
                    style={{
                      background: phase.side === "Studio" ? "color-mix(in srgb, var(--burgundy) 10%, transparent)" : "var(--stone-deep)",
                      color: phase.side === "Studio" ? "var(--burgundy)" : "var(--ink-faint)",
                    }}
                  >
                    {phase.side}
                  </span>
                </div>
                <h3 className="serif mt-2 text-[21px]">{phase.step}</h3>
                <ul className="mt-3 flex flex-col gap-1">
                  {phase.items.map((item) => (
                    <li key={item} className="text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------------ services -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              03 — Services
            </p>
            <h2 className="serif mt-3 text-[clamp(26px,3.4vw,40px)] leading-[1.1]">Six ways in. Every one of them priced.</h2>
          </Reveal>

          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {STUDIO_SERVICES.map((s) => (
              <Reveal key={s.slug}>
                <article
                  className="group flex h-full flex-col rounded-[3px] p-5 shadow-[var(--shadow-sm)] transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
                  style={{ background: "var(--paper)" }}
                >
                  <div className="flex items-baseline gap-3">
                    <span className="metric text-[11px]" style={{ color: "var(--ink-faint)" }}>
                      {s.index}
                    </span>
                    <h3 className="serif text-[22px] leading-tight">{s.name}</h3>
                  </div>
                  <p className="mt-2 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                    {s.tagline}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.scope.slice(0, 5).map((x) => (
                      <span
                        key={x}
                        className="rounded-[2px] px-1.5 py-1 text-[11px] leading-none"
                        style={{ background: "var(--stone-deep)", color: "var(--ink-soft)" }}
                      >
                        {x}
                      </span>
                    ))}
                    {s.scope.length > 5 ? (
                      <span className="px-1 py-1 text-[11px]" style={{ color: "var(--ink-faint)" }}>
                        +{s.scope.length - 5} more
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                    {s.fromRate ? (
                      <span className="metric text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
                        from {inr(s.fromRate.amount)}{" "}
                        <span className="font-normal" style={{ color: "var(--ink-faint)" }}>
                          {s.fromRate.unit}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[12.5px]" style={{ color: "var(--ink-faint)" }}>
                        Priced against your BOQ
                      </span>
                    )}
                    <Link
                      href={s.entries[0].href}
                      className="shrink-0 text-[13px] font-semibold transition-colors"
                      style={{ color: "var(--burgundy)" }}
                    >
                      {s.entries[0].label} <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- transparent price -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              04 — Transparent pricing
            </p>
            <h2 className="serif mt-3 max-w-[20ch] text-[clamp(26px,3.4vw,40px)] leading-[1.1]">
              Stop asking “how much will this cost?”
              <span className="block" style={{ color: "var(--burgundy)" }}>
                Start seeing what changes the cost.
              </span>
            </h2>
            <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              One wardrobe, four decisions. Toggle any of them and watch the estimate move — this is the same
              calculation the full configurator runs, on the same specification.
            </p>
          </Reveal>
          <div className="mt-8">
            <SpecPriceDemo />
          </div>
        </div>
      </section>

      {/* ------------------------------------------- carpenter vs factory -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              05 — Two ways to build
            </p>
            <h2 className="serif mt-3 text-[clamp(26px,3.4vw,40px)] leading-[1.1]">
              Carpenter made, or factory modular.
            </h2>
            <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Most platforms sell you whichever one they own a factory for. Both routes are offered here, priced on the
              same specification, so the decision is about your site and your timeline rather than about someone else&rsquo;s
              equipment.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {(["carpenter", "factory"] as const).map((m) => {
              const meta = BUILD_METHODS[m];
              return (
                <Reveal key={m}>
                  <div className="h-full rounded-[3px] border p-6" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
                    <h3 className="serif text-[24px] leading-tight">{meta.label}</h3>
                    <p className="mt-1 text-[13px]" style={{ color: "var(--ink-faint)" }}>
                      {meta.where} · {meta.lead}
                    </p>
                    <ul className="mt-5 flex flex-col gap-2">
                      {meta.benefits.map((b) => (
                        <li key={b} className="flex gap-2.5 text-[13.5px] leading-snug">
                          <span className="shrink-0" style={{ color: "#2f6b46" }}>
                            +
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>
                    <p className="tracked-caps mt-5 text-[9px]" style={{ color: "var(--ink-faint)" }}>
                      Trade-offs
                    </p>
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {meta.tradeoffs.map((b) => (
                        <li key={b} className="flex gap-2.5 text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                          <span className="shrink-0" style={{ color: "var(--burgundy)" }}>
                            −
                          </span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              );
            })}
          </div>
          <Reveal>
            <Link
              href="/studio/custom-furniture"
              className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold"
              style={{ color: "var(--burgundy)" }}
            >
              Price the same wardrobe both ways <span aria-hidden="true">→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* --------------------------------------------- material + service -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              06 — Material plus service
            </p>
            <h2 className="serif mt-3 text-[clamp(26px,3.4vw,40px)] leading-[1.1]">
              Buy the material. Add what has to happen to it.
            </h2>
          </Reveal>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            {BUNDLES.map((b) => (
              <Reveal key={b.service}>
                <div className="flex h-full flex-col rounded-[3px] border p-5" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
                  <p className="tracked-caps text-[9px]" style={{ color: "var(--ink-faint)" }}>
                    From the catalogue
                  </p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {b.materials.map((m) => (
                      <li key={m} className="text-[13px] leading-snug">
                        {m}
                      </li>
                    ))}
                  </ul>
                  <p className="metric my-3 text-[20px] leading-none" style={{ color: "var(--burgundy)" }}>
                    +
                  </p>
                  <p className="tracked-caps text-[9px]" style={{ color: "var(--ink-faint)" }}>
                    From the studio
                  </p>
                  <p className="mt-1 text-[15px] font-semibold">{b.service}</p>
                  <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--studio-line)" }}>
                    <p className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                      = {b.result}
                    </p>
                    <Link href={b.href} className="mt-2 inline-block text-[13px] font-semibold" style={{ color: "var(--burgundy)" }}>
                      {b.cta} <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ professionals -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)", background: "var(--ink)", color: "#f4f1ec" }}>
        <div className="mx-auto grid max-w-[1280px] gap-8 px-4 py-14 sm:px-7 lg:grid-cols-[1fr_1fr]">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "rgba(244,241,236,0.55)" }}>
              07 — For professionals
            </p>
            <h2 className="serif mt-3 text-[clamp(26px,3.4vw,40px)] leading-[1.1]">
              Send the drawing. We&rsquo;ll price the materials and the execution.
            </h2>
            <p className="mt-4 max-w-[54ch] text-[15px] leading-relaxed" style={{ color: "rgba(244,241,236,0.72)" }}>
              Architects, designers, contractors and rollout teams work from a BOQ, not a configurator. Upload it and
              get back a structured quote that separates materials, fabrication, installation and logistics — with the
              brands named, so it can be checked line by line against your own estimate.
            </p>
            <Link
              href="/studio/project-execution"
              className="mt-6 inline-flex rounded-[3px] px-5 py-3 text-[14px] font-semibold text-white transition-colors"
              style={{ background: "var(--burgundy)" }}
            >
              Upload BOQ
            </Link>
          </Reveal>
          <Reveal>
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px]" style={{ background: "rgba(244,241,236,0.14)" }}>
              {["BOQ", "Drawings", "Material schedule", "Cutting list"].map((x) => (
                <div key={x} className="p-5" style={{ background: "#1b1917" }}>
                  <p className="tracked-caps text-[9px]" style={{ color: "rgba(244,241,236,0.45)" }}>
                    Accepted
                  </p>
                  <p className="serif mt-1.5 text-[18px]">{x}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {["Materials", "Fabrication", "Installation", "Logistics"].map((x) => (
                <p key={x} className="text-[12.5px]" style={{ color: "rgba(244,241,236,0.72)" }}>
                  <span className="block h-[2px] w-full" style={{ background: "var(--burgundy)" }} aria-hidden="true" />
                  <span className="mt-2 block">{x}</span>
                  <span style={{ color: "rgba(244,241,236,0.45)" }}>quoted separately</span>
                </p>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------- how it works -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              08 — How it works
            </p>
          </Reveal>
          <Reveal stagger className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s) => (
              <div key={s.n}>
                <p className="metric text-[13px]" style={{ color: "var(--burgundy)" }}>
                  {s.n}
                </p>
                <span className="mt-2 block h-[2px] w-full" style={{ background: "var(--studio-line)" }} aria-hidden="true" />
                <h3 className="serif mt-3 text-[20px]">{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  {s.body}
                </p>
              </div>
            ))}
          </Reveal>

          <Reveal>
            <div className="mt-12">
              <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
                What we will and won&rsquo;t claim
              </p>
              <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
                {STUDIO_ASSURANCES.map((a) => (
                  <div key={a.title} className="border-t pt-3" style={{ borderColor: "var(--studio-line)" }}>
                    <h4 className="text-[14px] font-semibold">{a.title}</h4>
                    <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                      {a.body}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-5 max-w-[70ch] text-[12px] leading-relaxed" style={{ color: "var(--ink-faint)" }}>
                Studio EightxFour is new. There are no project counts, warranty periods or certifications quoted on this
                page, because none have been established yet — what is claimed above is only what the platform actually
                does today.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* -------------------------------------------------------- brands -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-7">
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            Materials drawn from the EightByFour catalogue
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-5">
            {[
              ["century-laminates.jpg", "Century"],
              ["greenlam.webp", "Greenlam"],
              ["merino.webp", "Merino"],
              ["action-tesa.png", "Action Tesa"],
              ["hettich.png", "Hettich"],
              ["ebco.png", "Ebco"],
              ["blum.png", "Blum"],
              ["hafele.png", "Häfele"],
              ["lx-hausys.jpeg", "LX Hausys"],
              ["fevicol.jpeg", "Fevicol"],
            ].map(([file, name]) => (
              <Image
                key={file}
                src={`/brand-logos/${file}`}
                alt={name}
                width={110}
                height={34}
                className="h-6 w-auto object-contain opacity-55 transition-opacity hover:opacity-100"
              />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------- professional -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}>
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-7 lg:grid-cols-[1.05fr_minmax(0,400px)]">
          <Reveal>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              For professionals
            </p>
            <h2 className="serif mt-2 max-w-[22ch] text-[clamp(26px,3.6vw,42px)] leading-[1.08]">
              Building more than one?
            </h2>
            <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              The same specification, repeated across units, with the materials bought through EightByFour and the
              fabrication and installation run by Studio. One partner for the board and the work.
            </p>

            <ul className="mt-6 grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {[
                "One written specification, held across every unit",
                "Priced from your BOQ or drawings, line by line",
                "Materials sourced through the EightByFour catalogue",
                "Factory fabrication or site carpentry, per unit type",
                "Installation and handover by the studio's own team",
                "Repeat rollouts against the same approved spec",
              ].map((line) => (
                <li key={line} className="flex gap-2 text-[13.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                  <span aria-hidden="true" style={{ color: "var(--burgundy)" }}>
                    —
                  </span>
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Link
                href="/studio/project-execution"
                className="rounded-[3px] px-5 py-3 text-[14px] font-semibold text-white transition-colors"
                style={{ background: "var(--burgundy)" }}
              >
                Send drawings or a BOQ
              </Link>
              <Link
                href="/contact"
                className="rounded-[3px] border px-5 py-3 text-[14px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                style={{ borderColor: "var(--studio-line-strong)" }}
              >
                Discuss a project
              </Link>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-[3px] p-5 shadow-[var(--shadow-sm)]" style={{ background: "var(--paper)" }}>
              <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
                Work of this kind
              </p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
                {[
                  "Office workstations",
                  "Storage walls",
                  "Retail fixtures",
                  "Reception counters",
                  "Office pantries",
                  "Hostel furniture",
                  "Apartment wardrobes",
                  "Store rollouts",
                ].map((x) => (
                  <li key={x} className="text-[13px]" style={{ color: "var(--ink-soft)" }}>
                    {x}
                  </li>
                ))}
              </ul>
              <p className="mt-4 border-t pt-3 text-[12px] leading-snug" style={{ borderColor: "var(--studio-line)", color: "var(--ink-faint)" }}>
                Send what you have — a drawing set, a BOQ, a material schedule, or a photograph of a handwritten list.
                Studio prices the materials and the execution separately, so you can take either half.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ----------------------------------------------------- final CTA -- */}
      <section>
        <div className="mx-auto max-w-[1280px] px-4 py-16 text-center sm:px-7">
          <Reveal>
            <h2 className="serif text-[clamp(30px,4.4vw,54px)] leading-[1.05]">What are you building?</h2>
            <p className="mx-auto mt-4 max-w-[52ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              Start with a specification and a number, not a phone call.
            </p>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              <Link
                href="/studio/custom-furniture"
                className="rounded-[3px] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors"
                style={{ background: "var(--burgundy)" }}
              >
                Start configuration
              </Link>
              <Link
                href="/studio/project-execution"
                className="rounded-[3px] border px-6 py-3.5 text-[15px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                style={{ borderColor: "var(--studio-line-strong)" }}
              >
                Upload BOQ
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
