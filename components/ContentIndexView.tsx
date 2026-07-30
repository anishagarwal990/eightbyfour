import Link from "next/link";
import type { ContentEntry, ContentType } from "@/lib/mdx";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";

export function ContentIndexView({
  type,
  title,
  intro,
  entries,
  children,
}: {
  type: ContentType;
  title: string;
  intro: string;
  entries: ContentEntry[];
  /** Extra sections rendered after the entries grid, still inside the page's <main>. */
  children?: React.ReactNode;
}) {
  return (
    <main>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
      <section className="px-7 py-10">
        <h1 className="serif" style={{ fontSize: "var(--fs-h1)" }}>
          {title}
        </h1>
        <p className="mt-3 max-w-2xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
          {intro}
        </p>
      </section>
      <section className="grid grid-cols-1 gap-4 px-7 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <Link key={entry.slug} href={`/${type}/${entry.slug}`} className={cardClasses("block p-5")} style={CARD_BASE_STYLE}>
            <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
              {entry.frontmatter.title}
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--line-strong)" }}>
              {entry.frontmatter.description}
            </p>
          </Link>
        ))}
      </section>
      {children}
    </main>
  );
}
