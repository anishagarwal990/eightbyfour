import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { Reveal } from "@/components/Reveal";
import { buttonClasses } from "@/components/ui/Button";
import { getCategoryCounts } from "@/lib/data/products";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";

export const metadata: Metadata = buildMetadata({
  title: "About EightxFour — Material Procurement in Hyderabad",
  description:
    "EightxFour is a material procurement partner for interior and construction projects in Hyderabad — one requirement, every category, one consolidated quote, sourced directly from manufacturers.",
  path: "/about",
});

export default async function AboutPage() {
  // Same grouped count RPC the header and homepage read — there is exactly one
  // source for "how many SKUs are live", so these can never drift apart.
  const [counts, brands] = await Promise.all([getCategoryCounts(), getAllBrandsWithCounts()]);
  const totalSkus = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const stats = [
    { value: totalSkus.toLocaleString("en-IN"), label: "Live SKUs listed" },
    { value: `${brands.length + SOURCE_ONLY_BRANDS.length}+`, label: "Manufacturers sourced" },
  ];

  return (
    <main>
      <BreadcrumbSchema items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />

        <section className="px-7 py-8">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            About · Hyderabad
          </p>
          <h1 className="font-display mt-2" style={{ fontSize: "var(--fs-h1)" }}>
            A procurement partner, not a reseller
          </h1>
          <p className="mt-3" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
            EightxFour is a material procurement partner for interior and construction projects, operating in Hyderabad.
            We source plywood, laminates, veneers, hardware, solid surface and adhesives directly from manufacturers
            across our distribution network — so pricing and stock reflect the manufacturer, not a reseller markup.
            EightxFour is a unit of DRG Group.
          </p>
        </section>

        <Reveal as="section" className="px-7 pb-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-display" style={{ fontSize: "var(--fs-h2)" }}>
                  {s.value}
                </p>
                <p className="text-xs tracked-caps mt-1" style={{ color: "var(--line-strong)" }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="px-7 pb-8">
          <h2 className="font-display" style={{ fontSize: "var(--fs-h2)" }}>
            How it works
          </h2>
          <p className="mt-2" style={{ lineHeight: "var(--lh-normal)" }}>
            Send your BOQ, product list, drawings — or just tell us what you need. We organize the requirements,
            source across our manufacturer network and come back with one line-itemed quote covering the whole list,
            instead of you chasing separate vendors for each material. If what you need isn&apos;t one of the{" "}
            {totalSkus.toLocaleString("en-IN")} SKUs listed on this site, tell us — we source well beyond our own
            listed catalogue.
          </p>
        </Reveal>

        <Reveal as="section" className="px-7 pb-8">
          <h2 className="font-display" style={{ fontSize: "var(--fs-h2)" }}>
            Where we operate
          </h2>
          <p className="mt-2" style={{ lineHeight: "var(--lh-normal)" }}>
            EightxFour currently serves Hyderabad — every brand relationship, delivery route and process is built
            around this city&apos;s sites and timelines, not a generic pan-India catalogue. See our{" "}
            <Link href="/hyderabad" className="underline hover:opacity-70">
              Hyderabad procurement pages
            </Link>{" "}
            for how we work with contractors, architects and homeowners specifically, or our{" "}
            <Link href="/contact" className="underline hover:opacity-70">
              contact page
            </Link>{" "}
            for office address and direct lines.
          </p>
        </Reveal>

        <Reveal as="section" className="px-7 pb-8">
          <Link href="/contact" className={buttonClasses("primary")}>
            Get in Touch →
          </Link>
        </Reveal>
      </div>
    </main>
  );
}
