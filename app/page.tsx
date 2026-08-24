import type { Metadata } from "next";
import Link from "next/link";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { getCategoryCounts, getCategorySampleProducts } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/categories";
import { getAllContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { Reveal } from "@/components/Reveal";
import { ManufacturerStrip } from "@/components/ManufacturerStrip";
import { HeroCTAs } from "@/components/HeroCTAs";
import { HeroQuoteBuilder } from "@/components/HeroQuoteBuilder";
import { HowItWorks } from "@/components/HowItWorks";
import { CategoryPhotoGrid } from "@/components/CategoryPhotoGrid";
import { UseCaseNav } from "@/components/UseCaseNav";
import { Testimonials } from "@/components/Testimonials";
import { getTestimonials } from "@/lib/data/testimonials";

// A residential-to-commercial spread, not every application page — the
// homepage points at these four and links to /applications for the rest.
const HOMEPAGE_APPLICATION_SLUGS = ["modular-kitchen", "wardrobes", "commercial-spaces", "retail-stores"];

// The catalogue's strongest categories by real stock depth, plus the
// "coming soon" categories (zero live SKUs, no photo yet — CategoryPhotoGrid
// renders those with a placeholder instead of a product image). Birch
// Plywood, Boil Boards and NFC Boards stay reachable via /products and their
// own category pages but are left off this list — they have real photos, but
// only 1-2 SKUs each, which reads as broken rather than curated in a
// grid; that's a different situation from a deliberate coming-soon entry.
const HOMEPAGE_CATEGORY_SLUGS = [
  "plywood",
  "laminates",
  "veneers",
  "corian-acrylic-solid-surface",
  "mdf-and-hdhmr",
  "adhesive",
  "aluminium-sections",
  "galvanised-iron-sheets",
  "steel-pipes",
  "blockboards",
  "cement-boards",
  "louvers",
  "wall-panels",
  "hardware",
  "timber",
  "nails",
  "screws",
];

// "Coming soon" categories have zero live SKUs yet, so no product row/photo
// exists in Supabase for them. These are EightByFour's own real product
// photos (not stock) — swap each entry out for a real Supabase-backed photo
// once that category actually has SKUs listed.
const CATEGORY_FALLBACK_IMAGE: Record<string, string> = {
  "aluminium-sections": "/category-fallback/aluminium-sections.jpg",
  "galvanised-iron-sheets": "/category-fallback/galvanised-iron-sheets.jpg",
  "steel-pipes": "/category-fallback/steel-pipes.jpg",
  blockboards: "/category-fallback/blockboards.png",
  "cement-boards": "/category-fallback/cement-boards.png",
  louvers: "/category-fallback/louvers.png",
  "wall-panels": "/category-fallback/wall-panels.jpg",
  hardware: "/category-fallback/hardware.png",
  timber: "/category-fallback/timber.jpg",
  nails: "/category-fallback/nails.jpg",
  screws: "/category-fallback/screws.jpg",
};

export const metadata: Metadata = buildMetadata({
  title: "EightxFour — Interior & Construction Material Procurement in Hyderabad",
  description:
    "Upload your BOQ once and compare organized quotes across 25+ brands — plywood, laminates, veneers, hardware and solid surfaces. Stop chasing suppliers, start comparing smartly.",
  path: "/",
});

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
    title: "Direct from manufacturers",
    body: "We source directly from manufacturers across our distribution network, so you get manufacturer pricing and manufacturer-backed reliability, not a marked-up reseller rate.",
    icon: "direct",
  },
  {
    title: "We source beyond what's listed",
    body: "750+ real SKUs are live on this site today. If what you need isn't one of them, tell us — we source well beyond our own listed catalogue.",
    icon: "search",
  },
  {
    title: "Currently serving Hyderabad",
    body: "Every brand, delivery route and process is built around this city's sites and timelines — not a generic pan-India catalogue.",
    icon: "pin",
  },
  {
    title: "One consolidated quote",
    body: "A BOQ spanning plywood, laminate, hardware and adhesive comes back as a single quote — not five separate vendor calls.",
    icon: "quote",
  },
] as const;

type WhyIconName = (typeof WHY_EIGHTBYFOUR)[number]["icon"];

function WhyIcon({ name }: { name: WhyIconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "direct":
      return (
        <svg {...common}>
          <rect x="2" y="9" width="6" height="6" rx="1" />
          <rect x="16" y="9" width="6" height="6" rx="1" />
          <path d="M8 12h8M13 9l3 3-3 3" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="10" cy="10" r="6" />
          <path d="M20 20l-5.5-5.5" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-7.58 7-12a7 7 0 1 0-14 0c0 4.42 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );
    case "quote":
      return (
        <svg {...common}>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M9 11h6M9 15h6" />
        </svg>
      );
  }
}

const WHO_WE_SERVE = [
  {
    title: "Homeowners",
    body: "Building or renovating your own home — source real materials without chasing ten different shops.",
    href: "/hyderabad/homeowner-materials",
    icon: "house",
  },
  {
    title: "Interior Designers",
    body: "One point of contact across plywood, laminates, veneers, hardware and solid surfaces — for every client project.",
    href: "/hyderabad/architect-material-sourcing",
    icon: "pencil",
  },
  {
    title: "Architects",
    body: "Spec real, in-stock materials against real shade and edge-band codes — not a catalogue that may or may not be available on site.",
    href: "/hyderabad/architect-material-sourcing",
    icon: "compass",
  },
  {
    title: "Contractors",
    body: "A single supplier for every category on the BOQ, with trade pricing and delivery scheduled against your site timeline.",
    href: "/hyderabad/contractor-procurement",
    icon: "hardhat",
  },
  {
    title: "Builders & Procurement Teams",
    body: "Procurement across multiple sites and projects, consolidated through one relationship instead of a dozen vendor accounts.",
    href: "/hyderabad/contractor-procurement",
    icon: "stack",
  },
] as const;

type WhoIconName = (typeof WHO_WE_SERVE)[number]["icon"];

function WhoIcon({ name }: { name: WhoIconName }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "house":
      return (
        <svg {...common}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v10h13V10" />
          <path d="M10 20v-6h4v6" />
        </svg>
      );
    case "pencil":
      return (
        <svg {...common}>
          <path d="M4 20l.8-3.5L15.5 6l3.5 3.5L8.3 20.3z" />
          <path d="M13.5 8 16 10.5" />
        </svg>
      );
    case "compass":
      return (
        <svg {...common}>
          <circle cx="12" cy="6" r="1.6" />
          <path d="M12 7.6 7 20M12 7.6l5 12.4M7.5 20h9" />
        </svg>
      );
    case "hardhat":
      return (
        <svg {...common}>
          <path d="M4 16a8 8 0 0 1 16 0" />
          <path d="M2.5 16h19" />
          <path d="M12 5v3" />
        </svg>
      );
    case "stack":
      return (
        <svg {...common}>
          <rect x="5" y="10" width="6" height="10" />
          <rect x="13" y="5" width="6" height="15" />
        </svg>
      );
  }
}

export default async function Home() {
  const featuredCategories = HOMEPAGE_CATEGORY_SLUGS.map((slug) => CATEGORIES.find((c) => c.slug === slug)).filter((c) => c !== undefined);

  // brands, category counts, per-category product samples and testimonials
  // are independent data sources with no dependency on each other — fetching
  // them as a single Promise.all instead of sequential awaits means homepage
  // TTFB is bounded by the slowest of them, not their sum. Category counts
  // come from one grouped RPC (not a per-category count query) so the
  // per-category Promise.all below only does one lightweight sample-products
  // fetch each, instead of a count-plus-data pair.
  const [brands, categoryCounts, categorySections, testimonials] = await Promise.all([
    getAllBrandsWithCounts(),
    getCategoryCounts(),
    Promise.all(
      featuredCategories.map(async (category) => {
        // Only the representative image (products[0]) is used on the homepage —
        // sample a small pool and shuffle so every load picks a different one,
        // instead of the same alphabetically-first product every time.
        const products = await getCategorySampleProducts(category.dbCategory, 10);
        const withImages = products.filter((p) => p.main_img_url);
        const sample = [...withImages].sort(() => Math.random() - 0.5).slice(0, 1);
        return { category, products: sample };
      })
    ),
    getTestimonials(),
  ]);
  const categoryPhotoItems = categorySections.map(({ category, products }) => ({
    slug: category.slug,
    name: category.name,
    total: categoryCounts[category.dbCategory] ?? 0,
    image: products[0]?.main_img_url ?? CATEGORY_FALLBACK_IMAGE[category.slug] ?? null,
  }));

  const allApplications = getAllContent("applications");
  const homepageApplications = HOMEPAGE_APPLICATION_SLUGS.map((slug) => allApplications.find((a) => a.slug === slug)).filter(
    (a): a is NonNullable<typeof a> => a !== undefined
  );
  const guides = [
    ...getAllContent("guides").map((g) => ({ ...g, section: "guides" as const })),
    ...getAllContent("comparisons").map((g) => ({ ...g, section: "comparisons" as const })),
  ].slice(0, 4);
  const hyderabadPages = getAllContent("hyderabad").slice(0, 4);

  return (
    <main>
      {/* ---------- Hero ---------- */}
      {/* Pulled up behind the fixed header by --chrome-h (set in SiteHeader's
          measure effect) so the header floats as glass over real hero content
          instead of sitting as a flat opaque bar in its own row. Body stays
          plain white — separation comes from the header's own blur/shadow,
          not a tinted backdrop. */}
      <section
        className="reveal is-visible relative px-7 pb-20"
        style={{
          marginTop: "calc(-1 * var(--chrome-h, 0px))",
          paddingTop: "calc(var(--chrome-h, 0px) + 5rem)",
        }}
      >
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 text-center lg:grid-cols-[1.1fr_0.9fr] lg:text-left">
          <div>
            <p className="tracked-caps text-sm" style={{ color: "var(--accent)" }}>
              Plywood &middot; Laminates &middot; Veneers &middot; Wall Panels &middot; Hardware &middot; Solid Surface
            </p>
            <h1 className="mx-auto mt-2 max-w-md text-sm lg:mx-0" style={{ lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
              Interior &amp; Construction Material Procurement in Hyderabad
            </h1>
            <h2
              className="serif mx-auto mt-7 max-w-2xl lg:mx-0"
              style={{ fontSize: "var(--fs-hero)", lineHeight: "var(--lh-tight)", letterSpacing: "-0.01em" }}
            >
              Give Us Your List.
              <br className="hidden sm:block" /> Get Your Quote.
            </h2>
            <p className="mx-auto mt-4 max-w-xl lg:mx-0" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
              Send your BOQ, product list, drawings — or just tell us what you need. We&apos;ll organize the
              requirements, source across our network and come back with options you can compare.
            </p>
            <p className="tracked-caps mx-auto mt-4 text-xs lg:mx-0" style={{ color: "var(--burgundy)" }}>
              First response in under 15 minutes, during business hours.
            </p>
            <Link href="/products" className="mx-auto mt-4 block text-sm underline lg:mx-0" style={{ color: "var(--line-strong)" }}>
              Prefer to browse first? See all products →
            </Link>
          </div>
          <div className="flex justify-center lg:justify-start">
            <HeroQuoteBuilder />
          </div>
        </div>
      </section>

      {/* ---------- Trust Stats (thin strip, not a full beat) ---------- */}
      <Reveal className="border-t px-7 py-6" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-x-10 gap-y-2 text-center">
          {STATS.map((s) => (
            <p key={s.label} className="text-sm" style={{ color: "var(--line-strong)" }}>
              <span className="serif" style={{ fontSize: "18px", color: "var(--burgundy)" }}>
                {s.value}
              </span>{" "}
              <span className="tracked-caps text-xs">{s.label}</span>
            </p>
          ))}
        </div>
      </Reveal>

      <ManufacturerStrip brands={brands} />

      {/* ---------- Category Grid — one consolidated "real stock" moment ---------- */}
      <CategoryPhotoGrid items={categoryPhotoItems} />

      {/* ---------- How It Works ---------- */}
      <HowItWorks />

      {/* ---------- Who We Serve (moved up — persona self-identification before anything else) ---------- */}
      <Reveal as="section" className="px-7 py-20" style={{ background: "var(--paper-dim)" }}>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
              Who We Serve
            </p>
            <h2 className="serif mt-3 max-w-sm" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-tight)" }}>
              Built for Everyone Building a Space
            </h2>
            <p className="mt-4 max-w-xs" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
              Whether it&apos;s one home or a dozen sites, EightxFour is the same single point of contact.
            </p>
          </div>
          <Reveal stagger strong className="flex flex-col">
            {WHO_WE_SERVE.map((item) => (
              <Link key={item.title} href={item.href} className="group flex items-center justify-between gap-6 border-b py-6 first:pt-0 last:border-b-0" style={{ borderColor: "var(--line)" }}>
                <span className="flex items-center gap-4">
                  <span style={{ color: "var(--burgundy)" }}>
                    <WhoIcon name={item.icon} />
                  </span>
                  <p className="serif transition-colors duration-300 group-hover:opacity-70" style={{ fontSize: "22px" }}>
                    {item.title}
                  </p>
                </span>
                <span
                  className="shrink-0 text-lg transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] group-hover:translate-x-1"
                  style={{ color: "var(--burgundy)" }}
                  aria-hidden="true"
                >
                  →
                </span>
              </Link>
            ))}
          </Reveal>
        </div>
      </Reveal>

      {/* ---------- Use-Case Navigation — the "I don't know what I need" path ---------- */}
      <UseCaseNav applications={homepageApplications} />

      {/* ---------- Why This Matters — single consolidated trust section ---------- */}
      {/* Old-vs-new comparison is the primary proof; the four differentiators
          support that claim as a compact row underneath, instead of repeating
          the same pitch under a second heading a few seconds later. */}
      <Reveal as="section" className="px-7 py-16" style={{ background: "var(--paper-dim)" }}>
        <div className="mb-10 text-center">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            Why This Matters
          </p>
          <h2 className="serif mt-2" style={{ fontSize: "var(--fs-h2)" }}>
            Interior Procurement Shouldn&apos;t Be This Complicated
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
              The EightxFour Way
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
        <Reveal stagger strong className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2">
          {WHY_EIGHTBYFOUR.map((item) => (
            <div key={item.title} className="flex items-center gap-4 border-t pt-4" style={{ borderColor: "var(--line)" }}>
              <span style={{ color: "var(--burgundy)" }}>
                <WhyIcon name={item.icon} />
              </span>
              <p className="serif" style={{ fontSize: "16px" }}>
                {item.title}
              </p>
            </div>
          ))}
        </Reveal>
      </Reveal>

      {/* ---------- Testimonials ---------- */}
      <Reveal as="section" className="px-7 py-16">
        <Testimonials initialTestimonials={testimonials} />
      </Reveal>

      {/* ---------- Resources (SEO internal-linking utility — compact, off the main narrative) ---------- */}
      {guides.length > 0 || hyderabadPages.length > 0 ? (
        <Reveal as="section" className="border-t px-7 py-12" style={{ borderColor: "var(--line)", background: "var(--paper-dim)" }}>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-2">
            {guides.length > 0 ? (
              <div>
                <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
                  Buying Guides &amp; Comparisons
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {guides.map((g) => (
                    <Link key={`${g.section}-${g.slug}`} href={`/${g.section}/${g.slug}`} className="text-sm hover:opacity-70">
                      {g.frontmatter.title}
                    </Link>
                  ))}
                </div>
                <Link href="/guides" className="mt-3 inline-block text-sm" style={{ color: "var(--accent)" }}>
                  View all →
                </Link>
              </div>
            ) : null}
            {hyderabadPages.length > 0 ? (
              <div>
                <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
                  Serving Telangana &amp; Andhra Pradesh
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {hyderabadPages.map((h) => (
                    <Link key={h.slug} href={`/hyderabad/${h.slug}`} className="text-sm hover:opacity-70">
                      {h.frontmatter.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Reveal>
      ) : null}

      {/* ---------- Closing CTA ---------- */}
      <Reveal as="section" className="px-7 py-14 text-center">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Tell Us What You&apos;re Building.
        </h2>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
          Give us your list. We&apos;ll help you figure out the rest.
        </p>
        <HeroCTAs />
      </Reveal>
    </main>
  );
}
