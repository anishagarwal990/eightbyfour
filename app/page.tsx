import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts } from "@/lib/data/products";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { getAllContent } from "@/lib/mdx";
import { WHATSAPP_NUMBER } from "@/lib/whatsapp";
import { Reveal } from "@/components/Reveal";
import { buttonClasses } from "@/components/ui/Button";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";

const WHY_EIGHTBYFOUR = [
  {
    title: "Multi-manufacturer sourcing",
    body: "One inquiry checks availability and pricing across our distributor and manufacturer network — not just one supplier's shelf.",
  },
  {
    title: "Hyderabad, exclusively",
    body: "Every brand, delivery route and process is built around this city's sites and timelines — not a generic pan-India catalogue.",
  },
  {
    title: "Trade pricing on request",
    body: "Bulk and trade pricing for contractors, architects and builders, quoted against real current stock.",
  },
  {
    title: "One consolidated quote",
    body: "A BOQ spanning plywood, laminate, hardware and adhesive comes back as a single quote — not five separate vendor calls.",
  },
];

const PROCUREMENT_STEPS = [
  { n: "01", text: "Share your BOQ or project brief." },
  { n: "02", text: "We check stock and trade pricing across our distributor network." },
  { n: "03", text: "You get a consolidated quote — not a patchwork of separate supplier quotes." },
  { n: "04", text: "Delivery is scheduled against your site timeline." },
];

export default async function Home() {
  const [counts, brands] = await Promise.all([getCategoryCounts(), getAllBrandsWithCounts()]);
  const guides = [
    ...getAllContent("guides").map((g) => ({ ...g, section: "guides" as const })),
    ...getAllContent("comparisons").map((g) => ({ ...g, section: "comparisons" as const })),
  ].slice(0, 4);
  const hyderabadPages = getAllContent("hyderabad").slice(0, 4);

  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="reveal is-visible px-7 py-20 text-center">
        <p className="tracked-caps text-sm" style={{ color: "var(--accent)" }}>
          Hyderabad&apos;s Procurement Platform
        </p>
        <h1 className="serif mx-auto mt-3 max-w-3xl" style={{ fontSize: "var(--fs-hero)", lineHeight: "var(--lh-tight)" }}>
          Interior &amp; construction materials, sourced — not just sold.
        </h1>
        <p className="mx-auto mt-4 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
          EightByFour simplifies procurement for contractors, architects, interior designers and builders — sourcing
          plywood, laminates, veneers, hardware and more across trusted manufacturers and distributors in Hyderabad.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/products" className={buttonClasses("primary")}>
            Browse Catalogue
          </Link>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className={buttonClasses("secondary")}>
            General Inquiry
          </a>
        </div>
      </section>

      {/* ---------- Why EightByFour ---------- */}
      <Reveal as="section" className="px-7 py-16">
        <div className="mb-8 text-center">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            Why EightByFour
          </p>
          <h2 className="serif mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            You Don&apos;t Need Ten Suppliers
          </h2>
        </div>
        <Reveal stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WHY_EIGHTBYFOUR.map((item) => (
            <div key={item.title}>
              <p className="serif" style={{ fontSize: "18px" }}>
                {item.title}
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                {item.body}
              </p>
            </div>
          ))}
        </Reveal>
      </Reveal>

      {/* ---------- Materials Catalogue ---------- */}
      <Reveal as="section" className="px-7 py-10">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Materials Catalogue
          </h2>
          <Link href="/products" className="text-sm hover:opacity-70" style={{ color: "var(--accent)" }}>
            View all →
          </Link>
        </div>
        <Reveal stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((cat) => (
            <Link key={cat.slug} href={`/products/${cat.slug}`} className={cardClasses("block p-4")} style={CARD_BASE_STYLE}>
              <p className="serif" style={{ fontSize: "16px" }}>
                {cat.name}
              </p>
              <p className="mt-1 text-xs tracked-caps" style={{ color: "var(--accent)" }}>
                {counts[cat.dbCategory] || 0} products
              </p>
            </Link>
          ))}
        </Reveal>
      </Reveal>

      {/* ---------- Procurement Process ---------- */}
      <Reveal as="section" className="px-7 py-16" style={{ background: "var(--paper-dim)" }}>
        <div className="mb-8 text-center">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            How It Works
          </p>
          <h2 className="serif mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            Procurement Process
          </h2>
        </div>
        <Reveal stagger className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROCUREMENT_STEPS.map((step) => (
            <div key={step.n}>
              <p className="serif" style={{ fontSize: "32px", color: "var(--burgundy)" }}>
                {step.n}
              </p>
              <p className="mt-2 text-sm" style={{ lineHeight: "var(--lh-normal)" }}>
                {step.text}
              </p>
            </div>
          ))}
        </Reveal>
      </Reveal>

      {/* ---------- Manufacturers ---------- */}
      <Reveal as="section" className="px-7 py-10">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Manufacturers We Carry
          </h2>
          <Link href="/brands" className="text-sm hover:opacity-70" style={{ color: "var(--accent)" }}>
            View all →
          </Link>
        </div>
        <Reveal stagger className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {brands.map((b) => (
            <Link
              key={b.slug}
              href={`/brands/${b.slug}`}
              className={cardClasses("flex flex-col items-center gap-2 p-4 text-center")}
              style={CARD_BASE_STYLE}
            >
              {b.logo_url ? (
                <div className="relative h-8 w-full">
                  <Image src={b.logo_url} alt={`${b.name} logo`} fill className="object-contain" />
                </div>
              ) : (
                <p className="serif text-sm">{b.name}</p>
              )}
            </Link>
          ))}
        </Reveal>
      </Reveal>

      {/* ---------- Buying Guides & Comparisons ---------- */}
      {guides.length > 0 ? (
        <Reveal as="section" className="px-7 py-10">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
              Buying Guides &amp; Comparisons
            </h2>
            <Link href="/guides" className="text-sm hover:opacity-70" style={{ color: "var(--accent)" }}>
              View all →
            </Link>
          </div>
          <Reveal stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {guides.map((g) => (
              <Link key={`${g.section}-${g.slug}`} href={`/${g.section}/${g.slug}`} className={cardClasses("block p-4")} style={CARD_BASE_STYLE}>
                <p className="serif" style={{ fontSize: "16px" }}>
                  {g.frontmatter.title}
                </p>
                <p className="mt-1 text-sm" style={{ color: "var(--line-strong)" }}>
                  {g.frontmatter.description}
                </p>
              </Link>
            ))}
          </Reveal>
        </Reveal>
      ) : null}

      {/* ---------- Hyderabad ---------- */}
      <Reveal as="section" className="px-7 py-10">
        <div className="mb-5">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            Hyderabad, Exclusively
          </p>
          <h2 className="serif mt-1" style={{ fontSize: "var(--fs-h2)" }}>
            Built for This City, Not Every City
          </h2>
        </div>
        <Reveal stagger className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {hyderabadPages.map((h) => (
            <Link key={h.slug} href={`/hyderabad/${h.slug}`} className={cardClasses("block p-4")} style={CARD_BASE_STYLE}>
              <p className="serif" style={{ fontSize: "16px" }}>
                {h.frontmatter.title}
              </p>
            </Link>
          ))}
        </Reveal>
      </Reveal>

      {/* ---------- Testimonials (space reserved — no real quotes yet) ---------- */}
      <Reveal as="section" className="px-7 py-16">
        <div className="mb-8 text-center">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            From Our Projects
          </p>
          <h2 className="serif mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            Testimonials
          </h2>
        </div>
        <div
          className="mx-auto max-w-xl rounded-sm border border-dashed p-8 text-center"
          style={{ borderColor: "var(--line)" }}
        >
          <p className="serif" style={{ fontSize: "18px" }}>
            We&apos;re just getting started.
          </p>
          <p className="mt-2 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
            Real stories from contractors, architects and homeowners we&apos;ve procured for will go here as we book
            and complete more Hyderabad projects.
          </p>
        </div>
      </Reveal>

      {/* ---------- Closing CTA ---------- */}
      <Reveal as="section" className="px-7 py-14 text-center">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          A New Way to Procure, Built for Hyderabad
        </h2>
        <p className="mx-auto mt-3 max-w-2xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
          EightByFour is one procurement relationship across plywood, laminates, veneers, hardware and everything
          else your project needs — sourced across trusted manufacturers and distributors in Hyderabad.
        </p>
      </Reveal>
    </main>
  );
}
