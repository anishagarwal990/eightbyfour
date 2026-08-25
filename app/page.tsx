import type { Metadata } from "next";
import Link from "next/link";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { getCategoryCounts, getCategorySampleProducts } from "@/lib/data/products";
import { CATEGORIES } from "@/lib/categories";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";
import { isRepresentativeImage, treatmentForCategory } from "@/lib/categoryArt";
import { getAllContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { Reveal } from "@/components/Reveal";
import { ManufacturerStrip } from "@/components/ManufacturerStrip";
import { HowItWorks } from "@/components/HowItWorks";
import { UseCaseNav } from "@/components/UseCaseNav";
import { Testimonials } from "@/components/Testimonials";
import { getTestimonials } from "@/lib/data/testimonials";
import { HeroActions } from "@/components/home/HeroActions";
import { HeroMaterial, type HeroMaterialTile } from "@/components/home/HeroMaterial";
import { ProofBand } from "@/components/home/ProofBand";
import { TwoDoors } from "@/components/home/TwoDoors";
import { MaterialDiscovery, type DiscoveryTile } from "@/components/home/MaterialDiscovery";
import { RequirementExample } from "@/components/home/RequirementExample";
import { WhyEightByFour } from "@/components/home/WhyEightByFour";
import { TrustBlock } from "@/components/home/TrustBlock";
import { WhoWeServe } from "@/components/home/WhoWeServe";

// A residential-to-commercial spread, not every application page — the
// homepage points at these four and links to /applications for the rest.
const HOMEPAGE_APPLICATION_SLUGS = ["modular-kitchen", "wardrobes", "commercial-spaces", "retail-stores"];

// A category holding one, two or four SKUs reads as a broken tile rather than
// as depth, and sitting it beside 2,464 laminates as an equal is the exact
// credibility problem this redesign exists to fix. Ten is the floor for
// merchandising a category on the homepage; below it the category keeps its
// route, its page, its mega-menu entry and its place in the text row further
// down — it just isn't presented as stock you can shop.
const MERCHANDISE_FLOOR = 10;

// The three surfaces that carry the first viewport, in order of catalogue
// depth. Laminates leads because it is 77% of live stock — the old hero
// eyebrow led with Plywood and Hardware, one of which is 0.8% of stock and
// the other of which has none at all.
const HERO_CATEGORY_SLUGS = ["laminates", "veneers", "corian-acrylic-solid-surface"];

// One-line reasons a category is worth opening, for the two lead tiles.
const CATEGORY_BLURBS: Record<string, string> = {
  laminates: "Shade codes, finishes and textures from Merino, Greenlam, Century and more — searchable by code.",
  veneers: "Natural and reconstituted veneers, including bookmatched and embossed sheets.",
  "corian-acrylic-solid-surface": "Seamless acrylic solid surface in stocked colours, for counters and vanities.",
  "stone-panels": "Large-format stone and sintered panels for walls, counters and facades.",
  plywood: "MR, BWP and fire-retardant grades in standard 8×4 ft sheets.",
  adhesive: "Site-grade adhesives, including marine and heat-resistant grades.",
  "mdf-and-hdhmr": "MDF and HDHMR boards for shutters, mouldings and wet areas.",
};

export const metadata: Metadata = buildMetadata({
  title: "EightxFour — Interior & Construction Material Procurement in Hyderabad",
  description:
    "Send one requirement — BOQ, product list, drawing or a sentence — and get one consolidated quote. Laminates, veneers, plywood, solid surface, boards and adhesives, sourced across 25+ manufacturers for Hyderabad projects.",
  path: "/",
});

export default async function Home() {
  // Category counts, per-category samples, brands and testimonials are
  // independent, so they resolve as one Promise.all — homepage TTFB is bounded
  // by the slowest, not their sum. Counts come from one grouped RPC and are
  // the single source of truth for every number rendered on this page.
  const [brands, categoryCounts, testimonials] = await Promise.all([
    getAllBrandsWithCounts(),
    getCategoryCounts(),
    getTestimonials(),
  ]);

  const stockedCategories = CATEGORIES.filter((c) => (categoryCounts[c.dbCategory] || 0) > 0).sort(
    (a, b) => (categoryCounts[b.dbCategory] || 0) - (categoryCounts[a.dbCategory] || 0)
  );
  const merchandisable = stockedCategories.filter((c) => (categoryCounts[c.dbCategory] || 0) >= MERCHANDISE_FLOOR);
  const alsoSourced = CATEGORIES.filter((c) => !merchandisable.includes(c)).map((c) => ({
    slug: c.slug,
    name: c.name,
  }));

  const totalSkus = Object.values(categoryCounts).reduce((sum, n) => sum + n, 0);
  const brandCount = brands.length + SOURCE_ONLY_BRANDS.length;

  // One representative photo per merchandised category. The pick is derived
  // from the slug rather than randomised: a random choice per render is impure
  // during render, defeats caching, and makes the hero's composition
  // unreproducible when someone reports that a crop looks wrong.
  const samples = await Promise.all(
    merchandisable.map(async (category) => {
      const products = await getCategorySampleProducts(category.dbCategory, 10);
      const withImages = products.filter((p) => isRepresentativeImage(p.main_img_url));
      const seed = [...category.slug].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const pick = (offset: number) =>
        withImages.length > 0 ? (withImages[(seed + offset) % withImages.length]?.main_img_url ?? null) : null;
      // Two different photos per category so the hero and the discovery grid
      // aren't showing the visitor the same laminate twice on one page.
      return { slug: category.slug, hero: pick(0), grid: pick(withImages.length > 1 ? 1 : 0) };
    })
  );
  const heroImageBySlug = Object.fromEntries(samples.map((s) => [s.slug, s.hero]));
  const gridImageBySlug = Object.fromEntries(samples.map((s) => [s.slug, s.grid]));

  const heroTiles: HeroMaterialTile[] = HERO_CATEGORY_SLUGS.map((slug) => {
    const category = CATEGORIES.find((c) => c.slug === slug);
    const image = heroImageBySlug[slug];
    if (!category || !image) return null;
    return {
      slug,
      name: category.name,
      count: categoryCounts[category.dbCategory] || 0,
      image,
      treatment: treatmentForCategory(slug),
    };
  }).filter((t): t is HeroMaterialTile => t !== null);

  const discoveryTiles: DiscoveryTile[] = merchandisable.map((c) => ({
    slug: c.slug,
    name: c.name,
    count: categoryCounts[c.dbCategory] || 0,
    image: gridImageBySlug[c.slug] ?? null,
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
          Definition first, in real type, then the position, then the material.
          The old hero set the only sentence that said what the company is at
          14px grey above a 78px slogan that could have belonged to a freight
          broker — and showed no material at all above the fold. */}
      <section
        data-hero
        className="reveal is-visible px-7 pb-14 pt-6 md:pb-20 md:pt-16"
        style={{ background: "var(--surface-page)" }}
      >
        {/* `contents` on mobile lets the two text blocks become direct grid
            items alongside the material band, so the band can sit between the
            headline and the actions — that is what gets a real material into
            the first 844px on a phone. At lg the wrapper becomes a normal
            block again and the layout returns to two columns. */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-x-16 gap-y-8 lg:grid-cols-[1.12fr_0.88fr]">
          <div className="contents lg:block">
            <div className="order-1">
              {/* The one burgundy mark above the fold besides the CTA — a rule,
                  not a badge or a tracked-caps eyebrow. It ties the hero to the
                  burgundy "×" in the mark and gives the brand a signal here
                  without tinting the whole first screen. */}
              <span
                aria-hidden="true"
                className="mb-4 block h-[3px] w-10 md:mb-5"
                style={{ background: "var(--brand-primary)" }}
              />
              <p
                className="max-w-lg"
                style={{ fontSize: "var(--fs-body-lg)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}
              >
                EightxFour is a material procurement partner for interior and construction projects in Hyderabad.
              </p>
              <h1
                className="mt-4 max-w-2xl md:mt-5"
                style={{ fontSize: "var(--fs-display)", lineHeight: "var(--lh-tight)", letterSpacing: "var(--tr-display)" }}
              >
                Every material your project needs. Sourced by one partner.
              </h1>
            </div>
            <div className="order-3 lg:mt-6">
              <p
                className="max-w-xl"
                style={{ fontSize: "var(--fs-body-lg)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}
              >
                Send one requirement — a BOQ, a product list, a drawing, or just a description. We organise it, source
                it across {brandCount}+ manufacturers, and come back with a single consolidated quote.
              </p>
              <div className="mt-7">
                <HeroActions browseLabel={`Browse ${totalSkus.toLocaleString("en-IN")} materials`} />
              </div>
            </div>
          </div>
          <div className="order-2 lg:order-none lg:pl-4">
            <HeroMaterial tiles={heroTiles} />
          </div>
        </div>
      </section>

      {/* ---------- Proof of depth ---------- */}
      <ProofBand
        stats={[
          { value: (categoryCounts["Laminates"] || 0).toLocaleString("en-IN"), label: "Laminate shades, by code", href: "/products/laminates" },
          { value: (categoryCounts["Veneers"] || 0).toLocaleString("en-IN"), label: "Veneer sheets", href: "/products/veneers" },
          { value: totalSkus.toLocaleString("en-IN"), label: "Live SKUs you can browse", href: "/products" },
          { value: `${brandCount}+`, label: "Manufacturers sourced", href: "/brands" },
        ]}
        note="Counts read live from the catalogue. We source well beyond what's listed here — anything not on the site can still go on your requirement."
      />

      {/* ---------- Material discovery ---------- */}
      <MaterialDiscovery tiles={discoveryTiles} sourced={alsoSourced} />

      {/* ---------- How it works ---------- */}
      <HowItWorks />

      {/* ---------- Show the output ---------- */}
      <RequirementExample />

      {/* ---------- Why ---------- */}
      <WhyEightByFour />

      {/* ---------- Who it's for ---------- */}
      <WhoWeServe />

      {/* ---------- Manufacturers ---------- */}
      <ManufacturerStrip brands={brands} />

      {/* ---------- Discovery by application — the "still choosing" path ---------- */}
      <UseCaseNav applications={homepageApplications} />

      {/* ---------- Trust ---------- */}
      <TrustBlock />

      {/* Real reviews when there are real reviews — the component states
          plainly that there aren't yet rather than inventing any. */}
      <Reveal as="section" className="px-7 py-14" style={{ background: "var(--surface-secondary)" }}>
        <div className="mx-auto max-w-6xl">
          <Testimonials initialTestimonials={testimonials} />
        </div>
      </Reveal>

      {/* ---------- Resources (SEO internal-linking utility — compact, off the main narrative) ---------- */}
      {guides.length > 0 || hyderabadPages.length > 0 ? (
        <Reveal as="section" className="border-t px-7 py-12" style={{ borderColor: "var(--border-subtle)" }}>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-2">
            {guides.length > 0 ? (
              <div>
                <p className="tracked-caps" style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>
                  Buying guides &amp; comparisons
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {guides.map((g) => (
                    <Link key={`${g.section}-${g.slug}`} href={`/${g.section}/${g.slug}`} className="text-sm hover:text-[var(--brand-primary)]">
                      {g.frontmatter.title}
                    </Link>
                  ))}
                </div>
                <Link href="/guides" className="mt-3 inline-block text-sm underline underline-offset-4" style={{ color: "var(--brand-primary)" }}>
                  All guides
                </Link>
              </div>
            ) : null}
            {hyderabadPages.length > 0 ? (
              <div>
                <p className="tracked-caps" style={{ fontSize: "var(--fs-label)", color: "var(--text-muted)" }}>
                  Serving Telangana &amp; Andhra Pradesh
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {hyderabadPages.map((h) => (
                    <Link key={h.slug} href={`/hyderabad/${h.slug}`} className="text-sm hover:text-[var(--brand-primary)]">
                      {h.frontmatter.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Reveal>
      ) : null}

      {/* ---------- Close: the two doors ----------
          This is where the old "Tell Us What You're Building." block sat — a
          centred headline over two pills, which asked for the decision without
          restating either option. The two doors close the page instead: by
          this point the visitor has seen the catalogue depth, the process and
          the output, so the only thing left is which way in they want. */}
      <TwoDoors totalSkus={totalSkus} brandCount={brandCount} />
    </main>
  );
}
