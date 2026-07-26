import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts, getHeroPreviewImages } from "@/lib/data/products";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { getAllContent } from "@/lib/mdx";
import { Reveal } from "@/components/Reveal";
import { ManufacturerStrip } from "@/components/ManufacturerStrip";
import { HeroImagePreview } from "@/components/HeroImagePreview";
import { HeroCTAs } from "@/components/HeroCTAs";
import { buttonClasses } from "@/components/ui/Button";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";

// Real, current numbers only — update alongside the data they describe.
const STATS = [
  { value: "750+", label: "SKUs In Stock" },
  { value: "25+", label: "Manufacturers Sourced" },
  { value: "<15 min", label: "First Response Time" },
  { value: "Same/Next-Day", label: "Delivery in Hyderabad" },
];

const WHY_EIGHTBYFOUR = [
  {
    title: "One partner, not ten suppliers",
    body: "One inquiry checks availability and pricing across our manufacturer network — not a separate call to every supplier on your BOQ.",
  },
  {
    title: "Direct from manufacturers",
    body: "We source directly from manufacturers across our distribution network, so you get manufacturer pricing and manufacturer-backed reliability, not a marked-up reseller rate.",
  },
  {
    title: "We source beyond what's listed",
    body: "751 real SKUs are live on this site today. If what you need isn't one of them, tell us — we source well beyond our own listed catalogue.",
  },
  {
    title: "Hyderabad, exclusively",
    body: "Every brand, delivery route and process is built around this city's sites and timelines — not a generic pan-India catalogue.",
  },
  {
    title: "One consolidated quote",
    body: "A BOQ spanning plywood, laminate, hardware and adhesive comes back as a single quote — not five separate vendor calls.",
  },
];

const PROCUREMENT_STEPS = [
  { n: "01", text: "Share your BOQ or project brief." },
  { n: "02", text: "We check stock and quote wholesale pricing." },
  { n: "03", text: "You get a consolidated quote — not a patchwork of separate supplier quotes." },
  { n: "04", text: "Most in-stock items deliver same-day or next-day across Hyderabad." },
];

const WHO_WE_SERVE = [
  {
    title: "Homeowners",
    body: "Building or renovating your own home — source real materials without chasing ten different shops.",
    href: "/hyderabad/homeowner-materials",
  },
  {
    title: "Interior Designers",
    body: "One point of contact across plywood, laminates, veneers, hardware and solid surfaces — for every client project.",
    href: "/hyderabad/architect-material-sourcing",
  },
  {
    title: "Architects",
    body: "Spec real, in-stock materials against real shade and edge-band codes — not a catalogue that may or may not be available on site.",
    href: "/hyderabad/architect-material-sourcing",
  },
  {
    title: "Contractors",
    body: "A single supplier for every category on the BOQ, with trade pricing and delivery scheduled against your site timeline.",
    href: "/hyderabad/contractor-procurement",
  },
  {
    title: "Builders & Procurement Teams",
    body: "Procurement across multiple sites and projects, consolidated through one relationship instead of a dozen vendor accounts.",
    href: "/hyderabad/contractor-procurement",
  },
];

export default async function Home() {
  const [counts, brands, heroImages] = await Promise.all([getCategoryCounts(), getAllBrandsWithCounts(), getHeroPreviewImages()]);
  const guides = [
    ...getAllContent("guides").map((g) => ({ ...g, section: "guides" as const })),
    ...getAllContent("comparisons").map((g) => ({ ...g, section: "comparisons" as const })),
  ].slice(0, 4);
  const hyderabadPages = getAllContent("hyderabad").slice(0, 4);

  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="reveal is-visible relative px-7 py-20 text-center">
        <HeroImagePreview images={heroImages} side="left" />
        <HeroImagePreview images={heroImages} side="right" />
        <p className="tracked-caps text-sm" style={{ color: "var(--accent)" }}>
          Hyderabad&apos;s Procurement Platform for Interior &amp; Construction Materials
        </p>
        <h1 className="serif mx-auto mt-3 max-w-3xl" style={{ fontSize: "var(--fs-hero)", lineHeight: "var(--lh-tight)" }}>
          You don&apos;t need ten suppliers.
        </h1>
        <p className="mx-auto mt-4 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
          EightByFour is one procurement partner for everything your project needs — plywood, laminates, veneers,
          hardware, solid surfaces and more — sourced directly from 25+ manufacturers in Hyderabad.
          Can&apos;t find it listed? We source that too.
        </p>
        <p className="tracked-caps mx-auto mt-4 text-xs" style={{ color: "var(--burgundy)" }}>
          First response in under 15 minutes, during business hours.
        </p>
        <HeroCTAs />
        <Link href="/products" className="mt-3 inline-block text-sm hover:opacity-70" style={{ color: "var(--accent)" }}>
          Or browse our live catalogue →
        </Link>
      </section>

      <ManufacturerStrip brands={brands} />

      {/* ---------- Materials We Source ---------- */}
      <Reveal as="section" className="px-7 py-16">
        <div className="mb-8 text-center">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            Everything You Need, One Place
          </p>
          <h2 className="serif mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            Materials We Source
          </h2>
          <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
            751 real SKUs live across these categories today — plus hardware, doors, ACP, PVC boards, louvers, edge
            banding and more, sourced on request. If it goes into a space, we can probably source it.
          </p>
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

      {/* ---------- Who We Serve ---------- */}
      <Reveal as="section" className="px-7 py-16" style={{ background: "var(--paper-dim)" }}>
        <div className="mb-8 text-center">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            Who We Serve
          </p>
          <h2 className="serif mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            Built for Everyone Building a Space
          </h2>
          <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
            Whether it&apos;s one home or a dozen sites, EightByFour is the same single point of contact.
          </p>
        </div>
        <Reveal stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {WHO_WE_SERVE.map((item) => (
            <Link key={item.title} href={item.href} className={cardClasses("block p-5")} style={CARD_BASE_STYLE}>
              <p className="serif" style={{ fontSize: "18px" }}>
                {item.title}
              </p>
              <p className="mt-2 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                {item.body}
              </p>
            </Link>
          ))}
        </Reveal>
      </Reveal>

      {/* ---------- Why EightByFour ---------- */}
      <Reveal as="section" className="px-7 py-16">
        <div className="mb-10 text-center">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            Why EightByFour
          </p>
          <h2 className="serif mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            A Procurement Partner, Not a Catalogue
          </h2>
        </div>
        <Reveal stagger className="mx-auto mb-12 grid max-w-4xl grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="serif" style={{ fontSize: "28px", color: "var(--burgundy)" }}>
                {s.value}
              </p>
              <p className="mt-1 text-xs tracked-caps" style={{ color: "var(--line-strong)" }}>
                {s.label}
              </p>
            </div>
          ))}
        </Reveal>
        <Reveal stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
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
          Ready to Stop Coordinating Suppliers?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
          EightByFour is one procurement relationship across plywood, laminates, veneers, hardware and everything
          else your project needs — sourced directly from trusted manufacturers in Hyderabad.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/products" className={buttonClasses("primary")}>
            Browse Catalogue
          </Link>
        </div>
      </Reveal>
    </main>
  );
}
