import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts } from "@/lib/data/products";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { CATEGORIES } from "@/lib/categories";
import { CONTENT_TYPE_LABEL, CONTENT_TYPE_PATH, getAllContent, type ContentType } from "@/lib/mdx";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CategoryProductGrid } from "@/components/CategoryProductGrid";

const CONTENT_TYPES: ContentType[] = ["applications", "guides", "comparisons", "hyderabad"];

// Internal search results — thin/duplicate content at unbounded query
// variants, no unique value over the real category/brand landing pages.
// Keep it out of the index; robots.ts also disallows /search.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const query = (q || "").trim();
  const needle = query.toLowerCase();

  const [products, brands] = query
    ? await Promise.all([searchProducts(query), getAllBrandsWithCounts()])
    : [[], []];

  const matchedBrands = query ? brands.filter((b) => b.name.toLowerCase().includes(needle)) : [];
  const matchedCategories = query ? CATEGORIES.filter((c) => c.name.toLowerCase().includes(needle)) : [];
  const matchedContent = query
    ? CONTENT_TYPES.flatMap((type) =>
        getAllContent(type)
          .filter((entry) => entry.frontmatter.title.toLowerCase().includes(needle))
          .map((entry) => ({ title: entry.frontmatter.title, label: CONTENT_TYPE_LABEL[type], url: `${CONTENT_TYPE_PATH[type]}/${entry.slug}` }))
      )
    : [];

  const totalMatches = products.length + matchedBrands.length + matchedCategories.length + matchedContent.length;

  return (
    <main>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Search" }]} />
      <section className="px-7 py-8">
        <h1 className="serif" style={{ fontSize: "var(--fs-h1)" }}>
          {query ? `Results for "${query}"` : "Search"}
        </h1>

        {!query ? (
          <p className="mt-4" style={{ color: "var(--line-strong)" }}>
            Type something in the search box above.
          </p>
        ) : totalMatches === 0 ? (
          <p className="mt-4" style={{ color: "var(--line-strong)" }}>
            No matches for &ldquo;{query}&rdquo;.
          </p>
        ) : (
          <>
            {matchedBrands.length > 0 || matchedCategories.length > 0 || matchedContent.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {matchedCategories.map((c) => (
                  <Link key={c.slug} href={`/products/${c.slug}`} className="rounded-full border px-3 py-1 text-sm hover:opacity-70" style={{ borderColor: "var(--line)" }}>
                    {c.name} <span style={{ color: "var(--accent)" }}>Category</span>
                  </Link>
                ))}
                {matchedBrands.map((b) => (
                  <Link key={b.slug} href={`/brands/${b.slug}`} className="rounded-full border px-3 py-1 text-sm hover:opacity-70" style={{ borderColor: "var(--line)" }}>
                    {b.name} <span style={{ color: "var(--accent)" }}>Brand</span>
                  </Link>
                ))}
                {matchedContent.map((c) => (
                  <Link key={c.url} href={c.url} className="rounded-full border px-3 py-1 text-sm hover:opacity-70" style={{ borderColor: "var(--line)" }}>
                    {c.title} <span style={{ color: "var(--accent)" }}>{c.label}</span>
                  </Link>
                ))}
              </div>
            ) : null}

            {products.length > 0 ? (
              <div className="mt-6">
                <p className="mb-4 text-sm" style={{ color: "var(--line-strong)" }}>
                  {products.length} product{products.length === 1 ? "" : "s"}
                </p>
                <CategoryProductGrid products={products} />
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
