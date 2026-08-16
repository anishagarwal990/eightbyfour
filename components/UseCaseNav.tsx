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
        <div className="text-center">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            Not Sure Where To Start?
          </p>
          <h2 className="serif mt-3" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-tight)" }}>
            Start From Your Project
          </h2>
          <p className="mx-auto mt-3 max-w-md" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
            You don&apos;t need to know BWP from MR yet — start from the project and we&apos;ll point you to the right
            materials.
          </p>
        </div>

        <Reveal stagger className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {applications.map((app) => (
            <Link
              key={app.slug}
              href={`/applications/${app.slug}`}
              className={cardClasses("flex flex-col justify-between gap-6 p-5")}
              style={{ ...CARD_BASE_STYLE, borderColor: "transparent" }}
            >
              <div>
                <p className="serif" style={{ fontSize: "18px", lineHeight: "var(--lh-tight)" }}>
                  {app.frontmatter.title}
                </p>
                <p className="mt-2 text-xs" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                  {app.frontmatter.heroTagline}
                </p>
              </div>
              <span
                className="self-start text-sm transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] group-hover:translate-x-1"
                style={{ color: "var(--burgundy)" }}
                aria-hidden="true"
              >
                See materials →
              </span>
            </Link>
          ))}
        </Reveal>

        <div className="mt-8 text-center">
          <Link href="/applications" className="text-sm underline" style={{ color: "var(--line-strong)" }}>
            See all project types →
          </Link>
        </div>
      </div>
    </Reveal>
  );
}
