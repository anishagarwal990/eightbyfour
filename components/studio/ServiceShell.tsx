import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { inr } from "@/lib/studio/format";
import type { StudioService } from "@/lib/studio/types";

/**
 * Every service page opens the same way — name, one sentence, indicative rate,
 * and the three ways in — so a visitor arriving on any of them recognises
 * where they are. What follows the hero is deliberately NOT templated: the
 * pressing page is a bundle builder, the BOQ page is an upload desk, and
 * forcing both through one layout would flatten them.
 */
export function ServiceHero({
  service,
  headline,
  children,
}: {
  service: StudioService;
  /** Overrides the registry tagline where a page wants a sharper line. */
  headline?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="studio-grid border-b" style={{ borderColor: "var(--studio-line)" }}>
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-7 lg:py-14">
        <Reveal>
          <div className="flex items-baseline gap-3">
            <span className="metric text-[11px]" style={{ color: "var(--burgundy)" }}>
              {service.index}
            </span>
            <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              Studio EightxFour
            </p>
          </div>
          <h1 className="serif mt-3 max-w-[20ch] text-[clamp(32px,4.6vw,56px)] leading-[1.04] tracking-[-0.02em]">
            {headline ?? service.name}
          </h1>
          <p className="mt-4 max-w-[64ch] text-[15.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {service.description}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            {service.fromRate ? (
              <p className="metric text-[14px]">
                from {inr(service.fromRate.amount)}{" "}
                <span className="font-normal" style={{ color: "var(--ink-faint)" }}>
                  {service.fromRate.unit}, indicative
                </span>
              </p>
            ) : null}
            <p className="text-[12.5px]" style={{ color: "var(--ink-faint)" }}>
              Feeds from{" "}
              {service.feedsFrom.map((f, i) => (
                <span key={f}>
                  {i > 0 ? " · " : ""}
                  {f}
                </span>
              ))}
            </p>
          </div>
          {children}
        </Reveal>
      </div>
    </section>
  );
}

/**
 * Three ways to start. Registry order, and the first one is the emphasised
 * route — which is configuration on the homeowner services and upload on the
 * professional ones, because a contractor with a cutting list should not be
 * pushed through a card grid first. "Get assistance" is always last: it is a
 * third option here, not the funnel every visitor is pushed into.
 */
export function ThreeWaysIn({ service }: { service: StudioService }) {
  const entries = [...service.entries].sort((a, b) => Number(a.mode === "assist") - Number(b.mode === "assist"));

  return (
    <div className="mt-8 grid gap-2.5 sm:grid-cols-3">
      {entries.map((entry, i) => {
        const primary = i === 0;
        return (
          <Link
            key={entry.mode}
            href={entry.href}
            className="group rounded-[3px] border p-4 transition-[border-color,transform,box-shadow] duration-200 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]"
            style={{
              borderColor: primary ? "var(--burgundy)" : "var(--studio-line)",
              background: primary ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
            }}
          >
            <p className="tracked-caps text-[9px]" style={{ color: "var(--ink-faint)" }}>
              {entry.mode === "configure" ? "I know what I want" : entry.mode === "upload" ? "I have a drawing" : "I need help"}
            </p>
            <p className="mt-1.5 text-[15px] font-semibold" style={{ color: primary ? "var(--burgundy)" : "var(--ink)" }}>
              {entry.label} <span aria-hidden="true">→</span>
            </p>
            <p className="mt-1 text-[12.5px] leading-snug" style={{ color: "var(--ink-soft)" }}>
              {entry.detail}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

export function StudioSection({
  index,
  title,
  intro,
  children,
  tone = "stone",
}: {
  index: string;
  title: string;
  intro?: string;
  children?: React.ReactNode;
  tone?: "stone" | "deep";
}) {
  return (
    <section className="border-b" style={{ borderColor: "var(--studio-line)", background: tone === "deep" ? "var(--stone-deep)" : undefined }}>
      <div className="mx-auto max-w-[1280px] px-4 py-12 sm:px-7">
        <Reveal>
          <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
            {index}
          </p>
          <h2 className="serif mt-2.5 max-w-[24ch] text-[clamp(24px,3.1vw,36px)] leading-[1.1]">{title}</h2>
          {intro ? (
            <p className="mt-3 max-w-[64ch] text-[14.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
              {intro}
            </p>
          ) : null}
        </Reveal>
        {children ? <div className="mt-7">{children}</div> : null}
      </div>
    </section>
  );
}

export function ProcessSteps({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title}>
          <p className="metric text-[12px]" style={{ color: "var(--burgundy)" }}>
            {String(i + 1).padStart(2, "0")}
          </p>
          <span className="mt-2 block h-[2px] w-full" style={{ background: "var(--studio-line)" }} aria-hidden="true" />
          <h3 className="serif mt-3 text-[19px]">{s.title}</h3>
          <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {s.body}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="grid gap-x-10 gap-y-6 lg:grid-cols-2">
      {items.map((f) => (
        <div key={f.q} className="border-t pt-4" style={{ borderColor: "var(--studio-line)" }}>
          <h3 className="text-[14.5px] font-semibold leading-snug">{f.q}</h3>
          <p className="mt-1.5 text-[13.5px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            {f.a}
          </p>
        </div>
      ))}
    </div>
  );
}
