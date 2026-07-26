import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { MoreBrandsTile } from "@/components/MoreBrandsTile";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";

export const metadata: Metadata = buildMetadata({
  title: "Manufacturer Brands We Carry in Hyderabad",
  description:
    "EightByFour sources from established manufacturers — CenturyPly, Greenply, Fevicol and more — for plywood, laminates, veneers, adhesives and surface materials delivered across Hyderabad.",
  path: "/brands",
});

export default async function BrandsIndexPage() {
  const brands = await getAllBrandsWithCounts();

  return (
    <main>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands" }]} />
      <section className="px-7 py-10">
        <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
          Manufacturers
        </p>
        <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
          Brands We Carry in Hyderabad
        </h1>
        <p className="mt-3 max-w-2xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
          EightByFour procures across established manufacturers rather than any single supplier — so you get real
          stock availability and trade pricing, not a single brand&apos;s catalogue.
        </p>
      </section>
      <section className="grid grid-cols-2 gap-4 px-7 pb-16 sm:grid-cols-3 lg:grid-cols-4">
        {brands.map((b) => (
          <Link
            key={b.slug}
            href={`/brands/${b.slug}`}
            className={cardClasses("flex flex-col items-center gap-3 p-5 text-center")}
            style={CARD_BASE_STYLE}
          >
            {b.logo_url ? (
              <div className="relative h-12 w-full">
                <Image src={b.logo_url} alt={`${b.name} logo`} fill className="object-contain" />
              </div>
            ) : (
              <p className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                {b.name}
              </p>
            )}
            <p className="text-xs tracked-caps" style={{ color: "var(--accent)" }}>
              {b.productCount} SKUs
            </p>
          </Link>
        ))}
        <MoreBrandsTile />
      </section>
    </main>
  );
}
