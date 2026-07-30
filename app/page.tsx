import type { Metadata } from "next";
import Link from "next/link";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { getAllContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { Reveal } from "@/components/Reveal";
import { ManufacturerStrip } from "@/components/ManufacturerStrip";
import { HeroCTAs } from "@/components/HeroCTAs";
import { ProcurementFlowPreview, ProcurementWorkflowSteps } from "@/components/ProcurementFlow";
import { HeroCategoryStrip } from "@/components/HeroCategoryStrip";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";
import { Testimonials } from "@/components/Testimonials";
import { getTestimonials } from "@/lib/data/testimonials";

export const metadata: Metadata = buildMetadata({
  title: "EightByFour — Procurement Platform for Interior & Construction Materials in Hyderabad",
  description:
    "Upload your BOQ once and compare organized quotes across 25+ brands — plywood, laminates, veneers, hardware and solid surfaces. Stop chasing suppliers, start comparing smartly.",
  path: "/",
});

// Real product photos for the hero side strips — one crossfade pair per side.
const HERO_LEFT_IMAGES = [
  "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/products/1-main.jpg", // Plywood — Architect Ply
  "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/products/1113-main.webp", // MDF and HDHMR — Interior MDF
];
const HERO_RIGHT_IMAGES = [
  "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/products/101-main.jpg", // Laminates — Panama Ash
  "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/products/553-main.jpg", // Veneers — Embossed Veneer 01
];

// Real, current numbers only — update alongside the data they describe.
const STATS = [
  { value: "750+", label: "SKUs In Stock" },
  { value: "25+", label: "Manufacturers Sourced" },
  { value: "<15 min", label: "First Response Time" },
  { value: "Same/Next-Day", label: "Delivery in Hyderabad" },
];

const OLD_WAY = [
  "Call Supplier A, describe the BOQ",
  "Call Supplier B, repeat yourself",
  "Wait — sometimes days — for a reply",
  "Follow up again, and again",
  "Receive quotes in different formats",
  "Try comparing everything by hand",
  "Still unsure if you're paying the right price",
];

const NEW_WAY = [
  "Upload your BOQ once",
  "Our network checks stock & pricing",
  "Quotes come back organized, one format",
  "Compare brand, spec and price on one screen",
  "Choose with confidence — not guesswork",
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
    body: "750+ real SKUs are live on this site today. If what you need isn't one of them, tell us — we source well beyond our own listed catalogue.",
  },
  {
    title: "Currently serving Hyderabad",
    body: "Every brand, delivery route and process is built around this city's sites and timelines — not a generic pan-India catalogue.",
  },
  {
    title: "One consolidated quote",
    body: "A BOQ spanning plywood, laminate, hardware and adhesive comes back as a single quote — not five separate vendor calls.",
  },
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
  const brands = await getAllBrandsWithCounts();
  const guides = [
    ...getAllContent("guides").map((g) => ({ ...g, section: "guides" as const })),
    ...getAllContent("comparisons").map((g) => ({ ...g, section: "comparisons" as const })),
  ].slice(0, 4);
  const hyderabadPages = getAllContent("hyderabad").slice(0, 4);
  const testimonials = await getTestimonials();

  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="reveal is-visible relative px-7 py-20">
        <HeroCategoryStrip images={HERO_LEFT_IMAGES} side="left" />
        <HeroCategoryStrip images={HERO_RIGHT_IMAGES} side="right" />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 text-center lg:grid-cols-[1.1fr_0.9fr] lg:text-left">
          <div>
            <p className="tracked-caps text-sm" style={{ color: "var(--accent)" }}>
              Plywood &middot; Laminates &middot; Veneers &middot; Wall Panels &middot; Hardware &middot; Solid Surface
            </p>
            <h1 className="mx-auto mt-2 max-w-md text-sm lg:mx-0" style={{ lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
              Interior &amp; Construction Material Procurement in Hyderabad
            </h1>
            <h2 className="serif mx-auto mt-7 max-w-xl lg:mx-0" style={{ fontSize: "var(--fs-hero)", lineHeight: "var(--lh-tight)" }}>
              Stop Chasing Suppliers.
              <br className="hidden sm:block" /> Start Comparing Smartly.
            </h2>
            <p className="mx-auto mt-4 max-w-xl lg:mx-0" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
              Upload your BOQ once. We check pricing and stock across 25+ brands and send back one
              organized set of quotes — compare brands, specs and pricing on one screen instead of chasing suppliers
              for ten different answers.
            </p>
            <p className="tracked-caps mx-auto mt-4 text-xs lg:mx-0" style={{ color: "var(--burgundy)" }}>
              First response in under 15 minutes, during business hours.
            </p>
            <HeroCTAs align="left" />
          </div>
          <ProcurementFlowPreview />
        </div>
      </section>

      <ManufacturerStrip brands={brands} />

      {/* ---------- The Old Way vs The EightByFour Way ---------- */}
      <Reveal as="section" className="px-7 py-16" style={{ background: "var(--paper-dim)" }}>
        <div className="mb-10 text-center">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            Why This Matters
          </p>
          <h2 className="serif mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            You Shouldn&apos;t Have to Chase Ten Suppliers to Buy Plywood
          </h2>
        </div>
        <Reveal stagger className="mx-auto grid max-w-4xl grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="rounded-sm border p-6" style={{ borderColor: "var(--line)", background: "var(--paper)" }}>
            <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
              The Old Way
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {OLD_WAY.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "var(--line-strong)" }}>
                  <span aria-hidden="true">&times;</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-sm border p-6" style={{ borderColor: "var(--burgundy)", background: "var(--paper)" }}>
            <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
              The EightByFour Way
            </p>
            <ul className="mt-4 flex flex-col gap-3">
              {NEW_WAY.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span aria-hidden="true" style={{ color: "var(--burgundy)" }}>
                    &#10003;
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
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

      {/* ---------- How It Works ---------- */}
      <Reveal as="section" className="px-7 py-16" style={{ background: "var(--paper-dim)" }}>
        <div className="mb-12 text-center">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            How It Works
          </p>
          <h2 className="serif mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            One BOQ In, One Comparable Quote Out
          </h2>
        </div>
        <ProcurementWorkflowSteps />
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
            Serving Telangana &amp; Andhra Pradesh
          </p>
          <h2 className="serif mt-1" style={{ fontSize: "var(--fs-h2)" }}>
            Rooted in Hyderabad, Serving Across AP &amp; TS
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

      {/* ---------- Testimonials ---------- */}
      <Reveal as="section" className="px-7 py-16" style={{ background: "var(--paper-dim)" }}>
        <Testimonials initialTestimonials={testimonials} />
      </Reveal>

      {/* ---------- Closing CTA ---------- */}
      <Reveal as="section" className="px-7 py-14 text-center">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Ready to Stop Chasing Suppliers?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
          Upload your BOQ and get back one organized, comparable quote across plywood, laminates, veneers, hardware
          and everything else your project needs — sourced directly from trusted brands, delivered across Hyderabad.
        </p>
        <HeroCTAs />
      </Reveal>
    </main>
  );
}
