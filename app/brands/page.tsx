import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { MoreBrandsTile, SourceOnlyBrandTiles } from "@/components/MoreBrandsTile";

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
      <BreadcrumbSchema items={[{ name: "Home", path: "/" }, { name: "Brands", path: "/brands" }]} />
      <div className="mx-auto max-w-6xl">
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
      <section className="grid grid-cols-2 gap-x-6 gap-y-10 px-7 pb-16 sm:grid-cols-3 lg:grid-cols-4">
        {brands.map((b) => (
          <Link key={b.slug} href={`/brands/${b.slug}`} className="group flex flex-col items-center gap-3 text-center">
            {b.logo_url ? (
              <div className="relative h-12 w-full">
                <Image
                  src={b.logo_url}
                  alt={`${b.name} logo`}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  loading="lazy"
                  className="object-contain grayscale opacity-75 transition-[filter,opacity] duration-200 group-hover:grayscale-0 group-hover:opacity-100"
                />
              </div>
            ) : (
              <p className="serif opacity-75 transition-opacity duration-200 group-hover:opacity-100" style={{ fontSize: "var(--fs-h2)" }}>
                {b.name}
              </p>
            )}
            <p className="text-xs tracked-caps" style={{ color: "var(--line-strong)" }}>
              {b.productCount} SKUs
            </p>
          </Link>
        ))}
        <SourceOnlyBrandTiles />
        <MoreBrandsTile />
      </section>
      </div>
    </main>
  );
}
