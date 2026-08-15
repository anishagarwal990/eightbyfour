import Link from "next/link";
import type { ContentEntry, ContentType } from "@/lib/mdx";
import { CONTENT_TYPE_LABEL, CONTENT_TYPE_NAV_LABEL, CONTENT_TYPE_PATH } from "@/lib/mdx";
import { CATEGORIES } from "@/lib/categories";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { MdxContent } from "@/components/MdxContent";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Reveal } from "@/components/Reveal";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { buttonClasses } from "@/components/ui/Button";

export async function ContentDetailView({ type, entry }: { type: ContentType; entry: ContentEntry }) {
  const { frontmatter, body } = entry;

  const relatedCategories = (frontmatter.relatedCategorySlugs || [])
    .map((slug) => CATEGORIES.find((c) => c.slug === slug))
    .filter(Boolean);

  let relatedBrands: { slug: string; name: string }[] = [];
  if (frontmatter.relatedBrandSlugs?.length) {
    const allBrands = await getAllBrandsWithCounts();
    relatedBrands = frontmatter.relatedBrandSlugs
      .map((slug) => allBrands.find((b) => b.slug === slug))
      .filter((b): b is NonNullable<typeof b> => Boolean(b))
      .map((b) => ({ slug: b.slug, name: b.name }));
  }

  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: CONTENT_TYPE_NAV_LABEL[type], path: CONTENT_TYPE_PATH[type] },
          { name: frontmatter.title, path: `${CONTENT_TYPE_PATH[type]}/${entry.slug}` },
        ]}
      />
      <FaqSchema faqs={frontmatter.faqs || []} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: CONTENT_TYPE_NAV_LABEL[type], href: CONTENT_TYPE_PATH[type] },
          { label: frontmatter.title },
        ]}
      />

      <section className="px-7 py-8">
        <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
          {type === "hyderabad" ? CONTENT_TYPE_LABEL[type] : `${CONTENT_TYPE_LABEL[type]} · Hyderabad`}
        </p>
        <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
          {frontmatter.title}
        </h1>
        {frontmatter.heroTagline ? (
          <p className="mt-2 text-base" style={{ color: "var(--line-strong)" }}>
            {frontmatter.heroTagline}
          </p>
        ) : null}
        {type === "hyderabad" ? (
          <a
            href={buildWhatsAppUrl(`Hi, I'd like to request a quote — found you via "${frontmatter.title}" on eightbyfour.com`)}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-4 inline-flex ${buttonClasses("primary")}`}
          >
            Request a Quote
          </a>
        ) : null}
      </section>

      <Reveal as="section" className="max-w-3xl px-7 pb-8">
        <MdxContent source={body} />
      </Reveal>

      {relatedCategories.length > 0 ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Related Products
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedCategories.map((c) =>
              c ? (
                <Link
                  key={c.slug}
                  href={`/products/${c.slug}`}
                  className="rounded-full border px-3 py-1 text-sm hover:opacity-70"
                  style={{ borderColor: "var(--line)" }}
                >
                  {c.name}
                </Link>
              ) : null
            )}
          </div>
        </Reveal>
      ) : null}

      {relatedBrands.length > 0 ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Related Brands
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {relatedBrands.map((b) => (
              <Link
                key={b.slug}
                href={`/brands/${b.slug}`}
                className="rounded-full border px-3 py-1 text-sm hover:opacity-70"
                style={{ borderColor: "var(--line)" }}
              >
                {b.name}
              </Link>
            ))}
          </div>
        </Reveal>
      ) : null}

      {frontmatter.faqs?.length ? (
        <Reveal as="section" className="px-7 py-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Frequently Asked Questions
          </h2>
          <div className="mt-3 flex flex-col gap-4">
            {frontmatter.faqs.map((faq, i) => (
              <div key={i}>
                <p className="font-medium">{faq.question}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--line-strong)" }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      ) : null}
    </main>
  );
}
