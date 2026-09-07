import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { FurnitureChooser } from "@/components/studio/FurnitureChooser";
import { MaterialPriceExplorer } from "@/components/studio/MaterialPriceExplorer";
import { PriceDNAExplainer } from "@/components/studio/PriceDNAExplainer";
import { StudioHero } from "@/components/studio/StudioHero";
import { buildMetadata } from "@/lib/seo";
import { STUDIO_ASSURANCES } from "@/lib/studio/services";
import { BUILD_METHODS } from "@/lib/studio/furniture";

/**
 * Studio EightxFour — the front door.
 *
 * This page used to run fourteen sections and explain the same three ideas in
 * four places each. It is now eight, and every one of them is a step in one
 * decision journey: what am I building, how do I start, what material, what
 * does it cost and why, who builds it, how many, go.
 *
 * Two structural rules, both learned the hard way:
 *
 * 1. `Reveal` is used ONCE, on the hero. Scroll-triggered fades on every
 *    section made a configuration tool read like a brochure — and worse, they
 *    put a delay between a customer scrolling to a control and being able to
 *    use it. Motion here belongs to the price, not the page.
 * 2. Nothing on this page prices a wardrobe on its own. Every number comes
 *    from the one commercial engine, through the components below.
 */

export const metadata: Metadata = buildMetadata({
  title: "Studio EightxFour — Configure Interior Fabrication & Installation",
  description:
    "Configure furniture, solid surface, laminate pressing and panel processing against real materials — and see an indicative execution price before you speak to anyone.",
  path: "/studio",
});

/**
 * What happens after you press start. Previously two sections that said the
 * same four words (Source/Configure/Fabricate/Install and Configure/Verify/
 * Fabricate/Install) — merged, with the unique content of each kept.
 */
const AFTER_YOU_START = [
  { n: "01", title: "Configure", body: "Build the specification yourself and watch the estimate move. No form, no callback, no waiting." },
  { n: "02", title: "Verify", body: "Site measurement and live material rates turn the estimate into a fixed quotation with a written scope." },
  { n: "03", title: "Fabricate", body: "Materials drawn from EightByFour supply, worked at your site or in the factory — whichever you chose." },
  { n: "04", title: "Install", body: "Fitted, aligned and handed over, with the material record attached to the same order." },
];

const BRANDS: [string, string][] = [
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
];

const PROJECT_WORK = [
  "Office workstations",
  "Storage walls",
  "Retail fixtures",
  "Reception counters",
  "Office pantries",
  "Hostel furniture",
  "Apartment wardrobes",
  "Store rollouts",
];

export default function StudioLandingPage() {
  return (
    <>
      {/* ------------------------------------------------- 1 · hero ------- */}
      <section className="studio-grid border-b" style={{ borderColor: "var(--studio-line)" }}>
        <Reveal>
          <StudioHero />
        </Reveal>
      </section>

      {/* --------------------------------- 2 · what are you building ------ */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            01 — Pick the piece
          </p>
          <h2 className="serif mt-2 max-w-[24ch] text-[clamp(26px,3.4vw,40px)] leading-[1.08]">
            What are you building?
          </h2>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            Each one opens the tool that suits it. A wardrobe can be estimated in a minute or designed in detail; a
            kitchen starts from the room, because that is the decision that shapes everything after it.
          </p>
          <div className="mt-8">
            <FurnitureChooser />
          </div>
        </div>
      </section>

      {/* ------------------------------------ 3 · two ways to start ------- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            02 — How to start
          </p>
          <h2 className="serif mt-2 max-w-[26ch] text-[clamp(26px,3.4vw,40px)] leading-[1.08]">
            Two ways in, depending on what you already know.
          </h2>

          <div className="mt-8 grid gap-3 lg:grid-cols-3">
            {[
              {
                title: "Quick estimate",
                says: "“I roughly know the size and I want a price.”",
                body: "Give the width and height, pick the board and the fronts. A full indicative number in about a minute, with every group of the price itemised.",
                href: "/studio/custom-furniture/wardrobe",
                cta: "Get a quick estimate",
              },
              {
                title: "Design it",
                says: "“I want to lay it out and see it.”",
                body: "A dimensioned elevation, a 3D model and an exploded view. Add shelves, drawers and rails compartment by compartment and watch the quote follow.",
                href: "/studio/custom-furniture/wardrobe/design",
                cta: "Open the visual designer",
                primary: true,
              },
              {
                title: "Plan a kitchen",
                says: "“Help me organise the room.”",
                body: "Draw the walls, place the sink, hob and fridge. Studio ranks the layouts that work, then prices the runs, the counter and the electricals.",
                href: "/studio/kitchen",
                cta: "Plan my kitchen",
              },
            ].map((w) => (
              <article
                key={w.title}
                className="flex h-full flex-col rounded-[3px] border p-5"
                style={{
                  borderColor: w.primary ? "var(--burgundy)" : "var(--studio-line)",
                  background: "var(--paper)",
                }}
              >
                <h3 className="serif text-[22px] leading-tight">{w.title}</h3>
                <p className="mt-2 text-[13.5px] leading-snug" style={{ color: "var(--burgundy)" }}>
                  {w.says}
                </p>
                <p className="mt-3 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
                  {w.body}
                </p>
                <Link
                  href={w.href}
                  className="mt-auto inline-flex min-h-11 items-center pt-4 text-[13.5px] font-semibold"
                  style={{ color: "var(--burgundy)" }}
                >
                  {w.cta} <span aria-hidden="true">&nbsp;→</span>
                </Link>
              </article>
            ))}
          </div>

          <div className="mt-10 border-t pt-8" style={{ borderColor: "var(--studio-line)" }}>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              And then
            </p>
            <div className="mt-5 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {AFTER_YOU_START.map((s) => (
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
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- 4 · material + price explorer ---- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            03 — Material
          </p>
          <h2 className="serif mt-2 max-w-[26ch] text-[clamp(26px,3.4vw,40px)] leading-[1.08]">
            What would this board do to your furniture?
          </h2>
          <p className="mt-3 max-w-[64ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            The board is the decision that moves the price most, and the one customers are usually asked to take on
            trust. These eight are not a quality ladder — they solve different problems. Every one is priced against the
            same wardrobe so the comparison is real.
          </p>
          <div className="mt-8">
            <MaterialPriceExplorer />
          </div>

          <div className="mt-10 border-t pt-6" style={{ borderColor: "var(--studio-line)" }}>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              Boards, laminates and hardware are drawn from the EightByFour catalogue
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-4">
              {BRANDS.map(([file, name]) => (
                <Image
                  key={file}
                  src={`/brand-logos/${file}`}
                  alt={name}
                  width={110}
                  height={34}
                  className="h-5 w-auto object-contain opacity-50 transition-opacity hover:opacity-100"
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------------------------- 5 · price DNA ---- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            04 — Price
          </p>
          <h2 className="serif mt-2 max-w-[26ch] text-[clamp(26px,3.4vw,40px)] leading-[1.08]">
            A price is composed, not quoted at you.
          </h2>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            Carcass and finish, shutters, hardware, and the work to build and fit it. Change one thing and watch which
            part of the number actually moves.
          </p>
          <div className="mt-8">
            <PriceDNAExplainer />
          </div>
        </div>
      </section>

      {/* -------------------------------------- 6 · carpenter or factory -- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)", background: "var(--stone-deep)" }}>
        <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-7">
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            05 — Who builds it
          </p>
          <h2 className="serif mt-2 text-[clamp(26px,3.4vw,40px)] leading-[1.08]">
            Carpenter made, or factory modular.
          </h2>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            Most platforms sell you whichever one they own a factory for. Both routes are offered here on the same
            specification, so the decision is about your site and your timeline rather than someone else&rsquo;s equipment.
          </p>

          <div className="mt-8 grid gap-3 lg:grid-cols-2">
            {(["carpenter", "factory"] as const).map((m) => {
              const meta = BUILD_METHODS[m];
              return (
                <div
                  key={m}
                  className="h-full rounded-[3px] border p-6"
                  style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}
                >
                  <h3 className="serif text-[24px] leading-tight">{meta.label}</h3>
                  <p className="mt-1 text-[13px]" style={{ color: "var(--ink-faint)" }}>
                    {meta.where} · {meta.lead}
                  </p>
                  <ul className="mt-5 flex flex-col gap-2">
                    {meta.benefits.map((b) => (
                      <li key={b} className="flex gap-2.5 text-[13.5px] leading-snug">
                        <span className="shrink-0" style={{ color: "var(--positive)" }}>
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
              );
            })}
          </div>
          <p className="mt-4 max-w-[62ch] text-[12.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
            Both routes are priced at the same rate today. Until Studio holds quotations from both, inventing a
            difference would be inventing the exact number you would most reasonably ask us to justify.
          </p>
        </div>
      </section>

      {/* --------------------------------------- 7 · more than one -------- */}
      <section className="border-b" style={{ borderColor: "var(--studio-line)", background: "var(--ink)", color: "#f4f1ec" }}>
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 py-14 sm:px-7 lg:grid-cols-[1.05fr_minmax(0,420px)]">
          <div>
            <p className="tracked-caps text-[10px]" style={{ color: "rgba(244,241,236,0.55)" }}>
              06 — For professionals
            </p>
            <h2 className="serif mt-2 max-w-[22ch] text-[clamp(26px,3.4vw,40px)] leading-[1.08]">
              Building more than one?
            </h2>
            <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed" style={{ color: "rgba(244,241,236,0.72)" }}>
              Architects, designers, contractors and rollout teams work from a BOQ, not a configurator. Send what you
              have and get back a structured quote that separates materials, fabrication, installation and logistics —
              with the brands named, so it can be checked line by line against your own estimate.
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
                <li key={line} className="flex gap-2 text-[13.5px] leading-snug" style={{ color: "rgba(244,241,236,0.72)" }}>
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
                className="rounded-[3px] border px-5 py-3 text-[14px] transition-colors"
                style={{ borderColor: "rgba(244,241,236,0.28)", color: "#f4f1ec" }}
              >
                Discuss execution
              </Link>
            </div>
          </div>

          <div className="rounded-[3px] p-5" style={{ background: "#1b1917" }}>
            <p className="tracked-caps text-[10px]" style={{ color: "rgba(244,241,236,0.45)" }}>
              Work of this kind
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5">
              {PROJECT_WORK.map((x) => (
                <li key={x} className="text-[13px]" style={{ color: "rgba(244,241,236,0.72)" }}>
                  {x}
                </li>
              ))}
            </ul>
            <p className="tracked-caps mt-5 text-[10px]" style={{ color: "rgba(244,241,236,0.45)" }}>
              Accepted
            </p>
            <p className="mt-1.5 text-[13px]" style={{ color: "rgba(244,241,236,0.72)" }}>
              BOQ · Drawings · Material schedule · Cutting list — or a photograph of a handwritten one
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 border-t pt-4" style={{ borderColor: "rgba(244,241,236,0.14)" }}>
              {["Materials", "Fabrication", "Installation", "Logistics"].map((x) => (
                <p key={x} className="text-[12.5px]" style={{ color: "rgba(244,241,236,0.72)" }}>
                  <span className="block h-[2px] w-full" style={{ background: "var(--burgundy)" }} aria-hidden="true" />
                  <span className="mt-2 block">{x}</span>
                  <span style={{ color: "rgba(244,241,236,0.45)" }}>quoted separately</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------- 8 · final CTA ----- */}
      <section>
        <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-7">
          <div className="text-center">
            <h2 className="serif text-[clamp(28px,4vw,48px)] leading-[1.05]">Start with a number, not a phone call.</h2>
            <div className="mt-7 flex flex-wrap justify-center gap-2.5">
              <Link
                href="/studio/custom-furniture/wardrobe/design"
                className="rounded-[3px] px-6 py-3.5 text-[15px] font-semibold text-white transition-colors"
                style={{ background: "var(--burgundy)" }}
              >
                Design your furniture
              </Link>
              <Link
                href="/studio/project-execution"
                className="rounded-[3px] border px-6 py-3.5 text-[15px] transition-colors hover:border-[var(--burgundy)] hover:text-[var(--burgundy)]"
                style={{ borderColor: "var(--studio-line-strong)" }}
              >
                Send a BOQ
              </Link>
            </div>
          </div>

          {/* What we will and won't claim. Kept verbatim — it is the most
              honest thing on the page and the reason to believe the rest. The
              six Studio services are NOT listed here: the studio layout closes
              every page with them already, and repeating them is exactly the
              duplication this pass removed. */}
          <div className="mt-12 border-t pt-6" style={{ borderColor: "var(--studio-line)" }}>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              What we will and won&rsquo;t claim
            </p>
            <div className="mt-4 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {STUDIO_ASSURANCES.map((a) => (
                <div key={a.title} className="border-t pt-3" style={{ borderColor: "var(--studio-line)" }}>
                  <h3 className="text-[14px] font-semibold">{a.title}</h3>
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
        </div>
      </section>
    </>
  );
}
