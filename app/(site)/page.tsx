import type { Metadata } from "next";
import Link from "next/link";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { getCategoryBrandNames, getCategoryCounts, getCategorySampleProducts } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/categories";
import { SOURCE_ONLY_BRANDS, getSourceOnlyBrandsByCategory } from "@/lib/source-only-brands";
import { BRAND_LOGOS } from "@/lib/brandLogos";
import { getAllContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { Reveal } from "@/components/Reveal";
import { AnimatedStat } from "@/components/AnimatedStat";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";
import { buttonClasses } from "@/components/ui/Button";
import { HeroCTAs } from "@/components/HeroCTAs";
import { MaterialFan, type FanBlade } from "@/components/home/MaterialFan";
import { HowItWorks } from "@/components/HowItWorks";
import type { DiscoveryTile } from "@/components/home/MaterialDiscovery";
import { ShopDiscovery } from "@/components/home/ShopDiscovery";
import { CompareSlide } from "@/components/home/CompareSlide";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { isRepresentativeImage, treatmentForCategory } from "@/lib/categoryArt";
import { UseCaseNav } from "@/components/UseCaseNav";
import { Testimonials } from "@/components/Testimonials";
import { getTestimonials } from "@/lib/data/testimonials";

// A residential-to-commercial spread, not every application page — the
// homepage points at these four and links to /applications for the rest.
const HOMEPAGE_APPLICATION_SLUGS = ["modular-kitchen", "wardrobes", "commercial-spaces", "retail-stores"];

// How many photos each category tile cycles through. Enough to read as a range
// rather than a blink between two images, few enough that a tile isn't holding
// a dozen decoded frames in memory.
const IMAGES_PER_TILE = 6;

// The hero's material fan, one blade per catalogue section, in the order the
// spread should read: boards, then surfaces, then adhesives and hardware last
// — so the sweep itself says "everything", not just "laminates". Three
// categories (wall-panels, hardware, and adhesive's drawn fallback) have no
// product photo to show, so their blade face is drawn CSS instead — see
// MaterialFan's `treatment` prop and .fan-face--drawn-* in globals.css.
//
// `spec` is a hand-checked snapshot of the live catalogue's thickness/unit
// range per category (verified against Supabase directly, not derived at
// request time — a grouped min/max RPC would be the real fix if this drifts).
const FAN_CATEGORY_SLUGS = [
  "plywood",
  "birch-plywood",
  "blockboards",
  "mdf-and-hdhmr",
  "boil-boards",
  "nfc-boards",
  "cement-boards",
  "laminates",
  "corian-acrylic-solid-surface",
  "veneers",
  "wall-panels",
  "adhesive",
  "hardware",
] as const;

const FAN_SPEC: Record<(typeof FAN_CATEGORY_SLUGS)[number], string> = {
  plywood: "4–25 mm",
  "birch-plywood": "6–18 mm",
  blockboards: "16–25 mm",
  "mdf-and-hdhmr": "1.7–30 mm",
  "boil-boards": "8–18 mm",
  "nfc-boards": "4.5–25 mm",
  "cement-boards": "6–40 mm",
  laminates: "0.72–1.5 mm",
  "corian-acrylic-solid-surface": "6 & 12 mm",
  veneers: "natural veneer",
  "wall-panels": "sourced to order",
  adhesive: "tins & drums",
  hardware: "sourced to order",
};

const FAN_TREATMENT: Record<(typeof FAN_CATEGORY_SLUGS)[number], FanBlade["treatment"]> = {
  plywood: "packshot",
  "birch-plywood": "surface",
  blockboards: "packshot",
  "mdf-and-hdhmr": "packshot",
  "boil-boards": "packshot",
  "nfc-boards": "surface",
  "cement-boards": "packshot",
  laminates: "surface",
  "corian-acrylic-solid-surface": "surface",
  veneers: "surface",
  "wall-panels": "drawn-panels",
  adhesive: "drawn-adhesive",
  hardware: "drawn-hardware",
};

// Real marks a returning visitor recognises, shown quietly under the hero's
// CTAs — not a ranking, just proof the belt behind "+N more" is real brands.
const HERO_BELT_SLUGS = ["century", "greenlam", "merino", "virgo", "fevicol"] as const;
const HERO_BELT_SOURCE_ONLY = ["hettich", "hafele"] as const;

// One-line reasons a category is worth opening, for the two lead tiles.
const CATEGORY_BLURBS: Record<string, string> = {
  laminates: "Shade codes, finishes and textures from Merino, Greenlam, Century and more — searchable by code.",
  veneers: "Natural and reconstituted veneers, including bookmatched and embossed sheets.",
  "corian-acrylic-solid-surface": "Seamless acrylic solid surface in stocked colours, for counters and vanities.",
  plywood: "MR, BWP and fire-retardant grades in standard 8×4 ft sheets.",
  adhesive: "Site-grade adhesives, including marine and heat-resistant grades.",
  "mdf-and-hdhmr": "MDF and HDHMR boards for shutters, mouldings and wet areas.",
  "birch-plywood": "Imported Russian / Baltic birch in BB/BB grade — a void-free edge for exposed-ply work.",
};

export const metadata: Metadata = buildMetadata({
  title: "EightxFour — Interior & Construction Material Procurement in Hyderabad",
  description:
    "Upload your BOQ once and compare organized quotes across 25+ brands — plywood, laminates, veneers, hardware and solid surfaces. Stop chasing suppliers, start comparing smartly.",
  path: "/",
});

// Rounds up to the nearest `step` — the two counted stats below show a live
// total, not the exact row count, so the number reads as a round "at least
// this many" figure and doesn't need editing every time a product is added.
function roundUpTo(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

const TEXT_STATS = [
  { kind: "text", value: "<15 min", label: "First Response Time" },
  // Was "Same/Next-Day" — a blanket delivery-speed guarantee across a
  // catalogue with no verified stock data behind it (see
  // docs/SEO-SEARCH-GROWTH.md §0.4). "Fast" still says the business is quick
  // without promising a specific turnaround for every SKU.
  { kind: "text", value: "Fast", label: "Hyderabad Delivery" },
] as const;

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
  // brands, category counts and testimonials are independent data sources with
  // no dependency on each other — fetching them as a single Promise.all instead
  // of sequential awaits means homepage TTFB is bounded by the slowest of them,
  // not their sum. Category counts come from one grouped RPC and are the single
  // source of truth for every count rendered on this page.
  const [brands, categoryCounts, categoryBrandNames, testimonials] = await Promise.all([
    getAllBrandsWithCounts(),
    getCategoryCounts(),
    getCategoryBrandNames(),
    getTestimonials(),
  ]);

  // Live totals, rounded up so the homepage stat doesn't need a manual edit
  // every time a product or brand is added — see roundUpTo() above.
  const totalSkuCount = Object.values(categoryCounts).reduce((sum, n) => sum + n, 0);
  const totalManufacturerCount = brands.length + SOURCE_ONLY_BRANDS.length;
  const stats = [
    // "SKUs In Stock" asserted real-time availability this count doesn't back
    // — it's a row count from `products`, not verified inventory. "SKUs in
    // Catalogue" says exactly what the number actually is.
    { kind: "counted", value: roundUpTo(totalSkuCount, 50), suffix: "+", label: "SKUs in Catalogue" },
    { kind: "counted", value: roundUpTo(totalManufacturerCount, 5), suffix: "+", label: "Manufacturers Sourced" },
    ...TEXT_STATS,
  ] as const;

  // Every category that actually holds stock — the shop-by-category runway
  // (ShopDiscovery, below) shows all of these, not just the ones deep enough
  // to have carried the old fixed-size grid's "equal visual weight" problem.
  // A runway card is uniform width regardless of catalogue depth, so a
  // 1-SKU category (birch ply) sitting beside a 2,464-SKU one (laminates) is
  // the intended "we carry everything" read, not a credibility issue.
  const stockedCategories = CATEGORIES.filter((c) => (categoryCounts[c.dbCategory] || 0) > 0).sort(
    (a, b) => (categoryCounts[b.dbCategory] || 0) - (categoryCounts[a.dbCategory] || 0)
  );
  // A short reel of real products per stocked category — the tiles cycle
  // through these rather than showing one fixed photo.
  //
  // Ordering is derived from the slug, not randomised: a random pick during
  // render is impure, defeats caching, and makes a bad crop unreproducible
  // when someone reports it. The hero and the category runway start from
  // opposite ends of the same reel so the two sections aren't showing the
  // visitor the same laminate at the same moment.
  const reelCategories = stockedCategories;

  const samples = await Promise.all(
    reelCategories.map(async (category) => {
      const products = await getCategorySampleProducts(category.dbCategory, 16);
      const urls = products
        .map((p) => p.main_img_url)
        .filter((url): url is string => isRepresentativeImage(url));
      const seed = [...category.slug].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      // Rotate the list by the seed so different categories don't all open on
      // whatever the query happened to return first.
      const rotated = urls.map((_, i) => urls[(seed + i) % urls.length]);
      return {
        slug: category.slug,
        hero: rotated.slice(0, IMAGES_PER_TILE),
        grid: [...rotated].reverse().slice(0, IMAGES_PER_TILE),
      };
    })
  );
  const heroImagesBySlug = Object.fromEntries(samples.map((sample) => [sample.slug, sample.hero]));
  const gridImagesBySlug = Object.fromEntries(samples.map((sample) => [sample.slug, sample.grid]));

  // The hero's material fan: one blade per FAN_CATEGORY_SLUGS entry, built
  // from the same counts/images every other section on this page uses — a
  // zero-count category (wall-panels, hardware) gets "on request" everywhere
  // instead of a fabricated number, and its blade face falls back to a drawn
  // CSS treatment because there is no product photo to show.
  const fanBlades: FanBlade[] = FAN_CATEGORY_SLUGS.map((slug): FanBlade | null => {
    const category = CATEGORIES.find((c) => c.slug === slug);
    if (!category) return null;
    const count = categoryCounts[category.dbCategory] || 0;
    const spec = FAN_SPEC[slug];
    return {
      slug,
      name: category.name,
      tag: category.name,
      href: `/products/${slug}`,
      count,
      spec: count > 0 ? `${count.toLocaleString("en-IN")} product${count === 1 ? "" : "s"} · ${spec}` : `No SKUs yet — ${spec}`,
      brands: categoryBrandNames[category.dbCategory] ?? [],
      sourcedOnRequest: getSourceOnlyBrandsByCategory(slug).map((b) => b.name),
      image: heroImagesBySlug[slug]?.[0] ?? null,
      treatment: FAN_TREATMENT[slug],
    };
  }).filter((b): b is FanBlade => b !== null);

  const heroBelt = [
    ...HERO_BELT_SLUGS.map((slug) => {
      const b = brands.find((x) => x.slug === slug);
      return b ? { name: b.name, src: BRAND_LOGOS[b.name] } : null;
    }),
    ...HERO_BELT_SOURCE_ONLY.map((slug) => {
      const b = SOURCE_ONLY_BRANDS.find((x) => x.slug === slug);
      return b ? { name: b.name, src: `/brand-logos/${b.file}` } : null;
    }),
  ].filter((b): b is { name: string; src: string } => b !== null && Boolean(b.src));
  const heroBeltMoreCount = Math.max(0, brands.length + SOURCE_ONLY_BRANDS.length - heroBelt.length);

  const discoveryTiles: DiscoveryTile[] = stockedCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    count: categoryCounts[c.dbCategory] || 0,
    images: gridImagesBySlug[c.slug] ?? [],
    treatment: treatmentForCategory(c.slug),
    blurb: CATEGORY_BLURBS[c.slug] ?? c.heroTagline,
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
      {/* ---------- Hero ----------
          Two slides: the proposition, then the mechanic. The old hero was
          pulled up behind the fixed header by --chrome-h so the header floated
          as glass over it — that is dropped here, because slide two inverts to
          near-black and a translucent white header sitting over it reads as
          muddy rather than as glass. */}
      <section className="reveal is-visible relative">
        <HeroCarousel
          labels={["Every material your project needs", "Stop chasing suppliers"]}
          slides={[
            // Both slides stretch to the taller of the two, so this one centres
            // its content in the space rather than sitting against the top with
            // a void underneath.
            <div key="proposition" className="flex h-full items-center px-7 py-12 md:py-14">
              <div className="mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 text-center lg:grid-cols-[1.1fr_0.9fr] lg:text-left">
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
                    Plywood to Hinges.
                    <br className="hidden sm:block" /> One Quote.
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl lg:mx-0" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
                    Boards, laminates, veneers, solid surface, adhesives and hardware —{" "}
                    {totalSkuCount.toLocaleString("en-IN")} products from {brands.length} manufacturers in stock, and{" "}
                    {SOURCE_ONLY_BRANDS.length} more we source on request. Send your list; we price every line.
                  </p>
                  <p className="tracked-caps mx-auto mt-4 text-xs lg:mx-0" style={{ color: "var(--burgundy)" }}>
                    First response in under 15 minutes, during business hours.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3 lg:justify-start">
                    <RequestQuoteButton label="Get My Quote" />
                    <Link href="/products" className={buttonClasses("secondary")}>
                      Browse Products
                    </Link>
                  </div>
                  {heroBelt.length > 0 && (
                    <div className="mt-7">
                      <p className="tracked-caps mx-auto lg:mx-0" style={{ fontSize: 11, color: "var(--line-strong)" }}>
                        Brands we stock and source
                      </p>
                      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 lg:justify-start">
                        {heroBelt.map((b) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={b.name}
                            src={b.src}
                            alt={b.name}
                            loading="lazy"
                            decoding="async"
                            className="h-6 w-auto object-contain grayscale opacity-60 transition-[filter,opacity] duration-200 hover:grayscale-0 hover:opacity-100"
                          />
                        ))}
                        {heroBeltMoreCount > 0 && (
                          <Link href="/brands" className="text-sm font-medium" style={{ color: "var(--burgundy)" }}>
                            +{heroBeltMoreCount} more
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex justify-center lg:justify-end lg:pt-2">
                  <div className="w-full max-w-md lg:max-w-none">
                    <MaterialFan blades={fanBlades} />
                  </div>
                </div>
              </div>
            </div>,
            <CompareSlide key="mechanic" />,
          ]}
        />
      </section>

      {/* ---------- Shop discovery — category runway + brand belt, opposite
          directions, immediately under the hero ---------- */}
      <ShopDiscovery categories={discoveryTiles} brands={brands} />

      {/* ---------- Trust Stats (thin strip, not a full beat) ---------- */}
      <Reveal className="border-t px-7 py-6" style={{ borderColor: "var(--line)" }}>
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-x-10 gap-y-2 text-center">
          {stats.map((s) => (
            <p key={s.label} className="text-sm" style={{ color: "var(--line-strong)" }}>
              <span className="serif" style={{ fontSize: "18px", color: "var(--burgundy)" }}>
                {s.kind === "counted" ? <AnimatedStat value={s.value} suffix={s.suffix} /> : s.value}
              </span>{" "}
              <span className="tracked-caps text-xs">{s.label}</span>
            </p>
          ))}
        </div>
      </Reveal>

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
