import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts } from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export const metadata: Metadata = buildMetadata({
  title: "Materials Catalogue — Plywood, Laminates, Veneers & More in Hyderabad",
  description:
    "Browse EightByFour's full materials catalogue for Hyderabad projects: plywood, laminates, MDF & HDHMR, veneers, stone panels, acrylic solid surface and adhesives, sourced across trusted manufacturers.",
  path: "/products",
});

export default async function ProductsIndexPage() {
  const counts = await getCategoryCounts();

  return (
    <main>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Products" }]} />
      <section className="px-7 py-10">
        <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
          Materials Catalogue
        </p>
        <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
          Every category, sourced for Hyderabad projects
        </h1>
        <p className="mt-3 max-w-2xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
          EightByFour procures directly from manufacturers so contractors, architects, interior designers
          and builders can source everything a project needs from one place. Pick a category to see live stock,
          available brands and a buying guide.
        </p>
      </section>
      <section className="grid grid-cols-1 gap-4 px-7 pb-16 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/products/${cat.slug}`}
            className="group relative block rounded-lg p-4 transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
            style={{ background: "var(--card)" }}
          >
            <span
              className="absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-xs"
              style={{ background: "var(--paper)", color: "var(--burgundy)" }}
            >
              {counts[cat.dbCategory] || 0}
            </span>
            <h2 className="serif pr-8" style={{ fontSize: "17px" }}>
              {cat.name}
            </h2>
            <p className="mt-1.5 text-xs" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
              {cat.heroTagline}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
