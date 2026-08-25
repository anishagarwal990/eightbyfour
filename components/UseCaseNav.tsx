import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";
import type { ContentEntry } from "@/lib/mdx";

/** "Don't know what you need? Start from the project" — a second discovery
    path alongside the free-text quote builder, for the visitor who doesn't
    yet know plywood grades or laminate thickness but knows they're building
    a kitchen. Links straight into the existing /applications pages. */
export function UseCaseNav({ applications }: { applications: ContentEntry[] }) {
  if (applications.length === 0) return null;

  return (
    <Reveal as="section" className="px-7 py-20">
      <div className="mx-auto max-w-5xl">
        {/* Left-aligned and eyebrow-free: this is the fourth section down and
            the old centred eyebrow-plus-headline-plus-paragraph stack was the
            same shape as every other one. */}
        <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-3">
          <h2 className="max-w-md" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-snug)" }}>
            Still choosing? Start from the project
          </h2>
          <p className="max-w-sm" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
            You don&apos;t need to know BWP from MR yet — start from what you&apos;re building and we&apos;ll point you
            at the right materials.
          </p>
        </div>

        <Reveal stagger className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {applications.map((app) => (
            <Link
              key={app.slug}
              href={`/applications/${app.slug}`}
              className={cardClasses("flex flex-col justify-between gap-6 p-5")}
              style={{ ...CARD_BASE_STYLE, background: "var(--surface-secondary)" }}
            >
              <div>
                <p className="font-display" style={{ fontSize: "18px", lineHeight: "var(--lh-tight)" }}>
                  {app.frontmatter.title}
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--text-secondary)", lineHeight: "var(--lh-normal)" }}>
                  {app.frontmatter.heroTagline}
                </p>
              </div>
              <span
                className="self-start text-sm transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] group-hover:translate-x-1"
                style={{ color: "var(--brand-primary)" }}
                aria-hidden="true"
              >
                See materials →
              </span>
            </Link>
          ))}
        </Reveal>

        <div className="mt-8">
          <Link href="/applications" className="text-sm underline underline-offset-4" style={{ color: "var(--brand-primary)" }}>
            All project types
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
