import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { Reveal } from "@/components/Reveal";
import { buttonClasses } from "@/components/ui/Button";

export const metadata: Metadata = buildMetadata({
  title: "About EightByFour — Material Procurement in Hyderabad",
  description:
    "EightByFour is a procurement platform for interior and construction materials in Hyderabad — sourcing directly from manufacturers instead of reselling through a single catalogue.",
  path: "/about",
});

const STATS = [
  { value: "750+", label: "SKUs In Stock" },
  { value: "25+", label: "Manufacturers Sourced" },
] as const;

export default function AboutPage() {
  return (
    <main>
      <BreadcrumbSchema items={[{ name: "Home", path: "/" }, { name: "About", path: "/about" }]} />
      <div className="mx-auto max-w-3xl">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} />

        <section className="px-7 py-8">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            About · Hyderabad
          </p>
          <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
            A procurement platform, not a reseller
          </h1>
          <p className="mt-3" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
            EightByFour is a procurement platform for interior and construction materials, operating in Hyderabad.
            We source plywood, laminates, veneers, hardware, solid surface and adhesives directly from manufacturers
            across our distribution network — so pricing and stock reflect the manufacturer, not a reseller markup.
            EightByFour is a unit of DRG Group.
          </p>
        </section>

        <Reveal as="section" className="px-7 pb-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="serif" style={{ fontSize: "var(--fs-h2)" }}>
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
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            How it works
          </h2>
          <p className="mt-2" style={{ lineHeight: "var(--lh-normal)" }}>
            Send your BOQ, product list, drawings — or just tell us what you need. We organize the requirements,
            source across our manufacturer network and come back with one line-itemed, comparable quote, instead of
            you chasing separate vendors for each material. If what you need isn&apos;t already one of the 750+ SKUs
            listed on this site, tell us — we source well beyond our own listed catalogue.
          </p>
        </Reveal>

        <Reveal as="section" className="px-7 pb-8">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Where we operate
          </h2>
          <p className="mt-2" style={{ lineHeight: "var(--lh-normal)" }}>
            EightByFour currently serves Hyderabad — every brand relationship, delivery route and process is built
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
