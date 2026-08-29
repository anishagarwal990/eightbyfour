"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { SaveIcon } from "@/components/icons/SaveIcon";
import { EMAIL, PHONE_DISPLAY, PHONE_TEL } from "@/lib/contact";
import { CATEGORIES } from "@/lib/categories";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteBrandMark } from "@/components/SiteBrandMark";
import type { BrandMenuEntry } from "@/lib/data/brands";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";
import { HyderabadLinkList } from "@/components/HyderabadLinkList";
import { POPULAR_SEARCHES, CATEGORY_LINKS } from "@/lib/hyderabadLinks";
import { MobileMenu } from "@/components/MobileMenu";

// Comparisons left the top bar — one route holding two documents was taking
// the same nav weight as the whole catalogue. It stays reachable from /guides,
// the footer and the sitemap, so no route or link equity is lost.
const NAV_LINKS = [
  { href: "/applications", label: "Applications" },
  { href: "/guides", label: "Guides" },
];

const HYDERABAD_GUIDE_LINKS = [
  { label: "Contractor Procurement in Hyderabad", href: "/hyderabad/contractor-procurement" },
  { label: "Architect Material Sourcing in Hyderabad", href: "/hyderabad/architect-material-sourcing" },
  { label: "Materials for Your Home in Hyderabad", href: "/hyderabad/homeowner-materials" },
];

// A few source-only logo files are a small icon+wordmark centered in a
// mostly-white square canvas — at the standard menu height they render as
// nearly invisible. Bump just those so they're legible next to the rest.
const MENU_LOGO_HEIGHT_OVERRIDES: Record<string, number> = {
  hettich: 42,
  godrej: 42,
  ozone: 42,
  "vivre-panels": 15,
};

const PRODUCTS_MENU_COLUMNS = [
  { title: "Boards & Panels", slugs: ["plywood", "birch-plywood", "boil-boards", "mdf-and-hdhmr", "nfc-boards"] },
  { title: "Surfaces & Finishes", slugs: ["laminates", "veneers"] },
  { title: "Solid Surface & Adhesives", slugs: ["corian-acrylic-solid-surface", "adhesive"] },
].map((col) => ({
  title: col.title,
  categories: col.slugs.map((slug) => CATEGORIES.find((c) => c.slug === slug)!).filter(Boolean),
}));

function ProductsMegaMenu({
  active,
  counts,
  brands,
}: {
  active: boolean;
  counts: Record<string, number>;
  brands: BrandMenuEntry[];
}) {
  const totalProducts = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <div className="group relative">
      <Link
        href="/products"
        className="group/link relative py-1 transition-colors duration-200 hover:text-[var(--burgundy)]"
      >
        Products
        <span
          aria-hidden="true"
          className={`absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] ${
            active ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-100"
          }`}
          style={{ background: "var(--burgundy)" }}
        />
      </Link>
      <div
        className="invisible absolute left-0 top-full z-30 max-h-[calc(100vh-140px)] w-[900px] max-w-[calc(100vw-3.5rem)] translate-y-2 overflow-y-auto opacity-0 transition-[opacity,visibility,transform] duration-200 [transition-timing-function:var(--ease-out-soft)] group-hover:visible group-hover:translate-y-1 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-1 group-focus-within:opacity-100"
      >
        <div
          className="grid grid-cols-[1fr_1fr_1fr_0.9fr] gap-7 rounded-sm border p-6 shadow-[var(--shadow-lg)]"
          style={{ background: "var(--paper)", borderColor: "var(--line)" }}
        >
          {PRODUCTS_MENU_COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
                {col.title}
              </p>
              <ul className="mt-3 flex flex-col gap-3">
                {col.categories.map((cat) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/products/${cat.slug}`}
                      className="group/item -mx-2 block rounded-sm px-2 py-1 transition-colors hover:bg-[var(--paper-dim)]"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium transition-colors group-hover/item:text-[var(--burgundy)]">
                          {cat.name}
                        </span>
                        <span className="tracked-caps text-[11px]" style={{ color: "var(--line-strong)" }}>
                          {counts[cat.dbCategory] || 0}
                        </span>
                      </span>
                      <span
                        className="mt-0.5 block text-xs leading-snug"
                        style={{ color: "var(--line-strong)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                      >
                        {cat.heroTagline}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div className="flex flex-col rounded-sm p-5" style={{ background: "var(--burgundy)", color: "var(--paper)" }}>
            <p className="serif" style={{ fontSize: "20px" }}>
              Full Materials Catalogue
            </p>
            <p className="mt-2 text-xs leading-relaxed opacity-90">
              {totalProducts}+ SKUs across {CATEGORIES.length} categories, sourced directly from manufacturers for
              Hyderabad projects.
            </p>
            <dl className="mt-4 flex flex-col gap-2 text-xs">
              <div className="flex justify-between border-t border-white/20 pt-2">
                <dt className="opacity-80">Categories</dt>
                <dd className="font-medium">{CATEGORIES.length}</dd>
              </div>
              <div className="flex justify-between border-t border-white/20 pt-2">
                <dt className="opacity-80">Total SKUs</dt>
                <dd className="font-medium">{totalProducts}+</dd>
              </div>
            </dl>
            <Link
              href="/products"
              className="mt-auto inline-block rounded-sm px-3 py-2 text-center text-xs font-medium"
              style={{ background: "var(--paper)", color: "var(--burgundy)", marginTop: "16px" }}
            >
              Browse all products →
            </Link>
          </div>
        </div>

        <div
          className="mt-3 rounded-sm border p-6 shadow-[var(--shadow-lg)]"
          style={{ background: "var(--paper)", borderColor: "var(--line)" }}
        >
          <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
            Shop by Brand
          </p>
          <div className="mt-3 grid grid-cols-4 gap-x-6 gap-y-5">
            {brands.map((brand) => (
              <div key={brand.slug}>
                <Link href={`/brands/${brand.slug}`} className="group/brand block">
                  <BrandLogo brand={brand.name} height={16} />
                  <span
                    className="mt-1 block text-xs transition-colors group-hover/brand:text-[var(--burgundy)]"
                    style={{ color: "var(--line-strong)" }}
                  >
                    {brand.productCount} products
                  </span>
                </Link>
                <ul className="mt-1.5 flex flex-col gap-1">
                  {brand.sampleProducts.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/products/${p.slug}`}
                        className="block truncate text-xs transition-colors hover:text-[var(--burgundy)]"
                      >
                        {p.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandsMegaMenu({ active, brands }: { active: boolean; brands: BrandMenuEntry[] }) {
  return (
    <div className="group relative">
      <Link
        href="/brands"
        className="group/link relative py-1 transition-colors duration-200 hover:text-[var(--burgundy)]"
      >
        Brands
        <span
          aria-hidden="true"
          className={`absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] ${
            active ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-100"
          }`}
          style={{ background: "var(--burgundy)" }}
        />
      </Link>
      <div
        className="invisible absolute left-0 top-full z-30 max-h-[calc(100vh-140px)] w-[620px] max-w-[calc(100vw-3.5rem)] translate-y-2 overflow-y-auto opacity-0 transition-[opacity,visibility,transform] duration-200 [transition-timing-function:var(--ease-out-soft)] group-hover:visible group-hover:translate-y-1 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-1 group-focus-within:opacity-100"
      >
        <div
          className="rounded-sm border p-6 shadow-[var(--shadow-lg)]"
          style={{ background: "var(--paper)", borderColor: "var(--line)" }}
        >
          <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
            All Brands
          </p>
          <div className="mt-3 grid grid-cols-4 gap-x-5 gap-y-4">
            {brands.map((brand) => (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="group/brand flex flex-col items-start gap-1.5 rounded-sm px-2 py-1.5 -mx-2 transition-colors hover:bg-[var(--paper-dim)]"
              >
                <div className="flex h-7 items-center">
                  <BrandLogo brand={brand.name} height={26} className="mix-blend-multiply" />
                </div>
                <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>
                  {brand.productCount} SKUs
                </span>
              </Link>
            ))}
            {SOURCE_ONLY_BRANDS.map((brand) => (
              <Link
                key={brand.slug}
                href={`/brands/${brand.slug}`}
                className="flex items-center rounded-sm px-2 py-1.5 -mx-2 transition-colors hover:bg-[var(--paper-dim)]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/brand-logos/${brand.file}`}
                  alt={`${brand.name} logo`}
                  loading="lazy"
                  decoding="async"
                  className="w-auto max-w-full object-contain mix-blend-multiply"
                  style={{ height: MENU_LOGO_HEIGHT_OVERRIDES[brand.slug] ?? 26 }}
                />
              </Link>
            ))}
          </div>

          <Link
            href="/brands"
            className="mt-5 block rounded-sm border px-4 py-2.5 text-center text-sm font-medium transition-colors hover:text-[var(--burgundy)]"
            style={{ background: "var(--paper)", borderColor: "var(--line)" }}
          >
            View all brands →
          </Link>
        </div>
      </div>
    </div>
  );
}

function HyderabadMegaMenu({ active }: { active: boolean }) {
  return (
    <div className="group relative">
      <Link
        href="/hyderabad"
        className="group/link relative py-1 transition-colors duration-200 hover:text-[var(--burgundy)]"
      >
        Hyderabad
        <span
          aria-hidden="true"
          className={`absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] ${
            active ? "scale-x-100" : "scale-x-0 group-hover/link:scale-x-100"
          }`}
          style={{ background: "var(--burgundy)" }}
        />
      </Link>
      <div
        className="invisible absolute left-0 top-full z-30 max-h-[calc(100vh-140px)] w-[700px] max-w-[calc(100vw-3.5rem)] translate-y-2 overflow-y-auto opacity-0 transition-[opacity,visibility,transform] duration-200 [transition-timing-function:var(--ease-out-soft)] group-hover:visible group-hover:translate-y-1 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-1 group-focus-within:opacity-100"
      >
        <div
          className="grid grid-cols-3 gap-7 rounded-sm border p-6 shadow-[var(--shadow-lg)]"
          style={{ background: "var(--paper)", borderColor: "var(--line)" }}
        >
          <HyderabadLinkList title="Popular Searches" entries={POPULAR_SEARCHES} />
          <HyderabadLinkList title="Shop by Category" entries={CATEGORY_LINKS} />
          <div>
            <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
              Hyderabad Guides
            </p>
            <ul className="mt-3 flex flex-col gap-2">
              {HYDERABAD_GUIDE_LINKS.map((g) => (
                <li key={g.href} className="text-sm leading-snug">
                  <Link href={g.href} className="hover:underline" style={{ color: "var(--ink)" }}>
                    {g.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link
              href="/hyderabad"
              className="mt-5 inline-block rounded-sm border px-3 py-2 text-center text-xs font-medium"
              style={{ borderColor: "var(--line)" }}
            >
              View all Hyderabad pages →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`group relative py-1 transition-colors duration-200 hover:text-[var(--burgundy)] ${active ? "font-semibold" : ""}`}
    >
      {label}
      <span
        aria-hidden="true"
        className={`absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
        style={{ background: "var(--burgundy)" }}
      />
    </Link>
  );
}

export function SiteHeader({
  categoryCounts,
  brandsMenu,
}: {
  categoryCounts: Record<string, number>;
  brandsMenu: BrandMenuEntry[];
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [chromeHidden, setChromeHidden] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);
  const headerElRef = useRef<HTMLElement>(null);
  const [chromeHeight, setChromeHeight] = useState<number | null>(null);
  // Anchor for the hide/show hysteresis. Deliberately NOT "y at the previous
  // scroll event": that reset the baseline on every event, so a slow drag or a
  // pixel of jitter could cross the threshold in both directions within a few
  // frames and flap the header. It only moves when the header actually flips,
  // so travel since the last flip has to accumulate past the threshold.
  const anchorYRef = useRef(0);
  const tickingRef = useRef(false);

  useEffect(() => {
    // 24px, not 10: below roughly one wheel notch the header would toggle on
    // scrolls too small for the visitor to have meant anything by them.
    const FLIP_THRESHOLD = 24;

    function update() {
      const y = window.scrollY;
      setScrolled(y > 8);

      if (y <= 80) {
        setChromeHidden(false);
        anchorYRef.current = y;
        return;
      }
      const delta = y - anchorYRef.current;
      if (delta > FLIP_THRESHOLD) {
        setChromeHidden(true);
        anchorYRef.current = y;
      } else if (delta < -FLIP_THRESHOLD) {
        setChromeHidden(false);
        anchorYRef.current = y;
      }
    }

    // Coalesced to one read per frame. The handler measures scrollY and then
    // sets state that restyles a fixed, backdrop-blurred bar; running that on
    // every scroll event (which can outpace frames) is work the frame budget
    // does not have during a fling.
    function handleScroll() {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(() => {
        tickingRef.current = false;
        update();
      });
    }

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    function measure() {
      const h = (contactRef.current?.offsetHeight ?? 0) + (headerElRef.current?.offsetHeight ?? 0);
      if (h > 0) {
        setChromeHeight(h);
        // Exposed as a CSS var so the homepage hero can pull itself up behind
        // the fixed header by the same amount (see app/page.tsx) — kept in
        // sync with this measurement instead of a separate guessed constant.
        document.documentElement.style.setProperty("--chrome-h", `${h}px`);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const isHome = pathname === "/";
  const transparentAtRest = isHome && !scrolled;

  return (
    <>
      {/* Fixed (not sticky) so hiding it is a pure transform — it never resizes
          the document, which would otherwise feed back into scroll position via
          the browser's scroll-anchoring and flicker. The spacer below reserves
          its space in the flow at a constant height so content never jumps. */}
      <div
        className="fixed inset-x-0 z-20 transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)]"
        style={{
          top: "var(--sku-ribbon-h)",
          transform: chromeHidden ? "translateY(-100%)" : "translateY(0)",
        }}
      >
        <div
          ref={contactRef}
          className="hidden flex-wrap items-center justify-center gap-x-6 gap-y-1 px-7 py-1.5 text-xs font-medium lg:flex"
          style={{ background: "var(--burgundy)", color: "var(--paper)" }}
        >
          <a href={`tel:${PHONE_TEL}`} className="hover:opacity-80">
            Call us: {PHONE_DISPLAY}
          </a>
          <span aria-hidden="true" className="opacity-50">
            |
          </span>
          <a href={`mailto:${EMAIL}`} className="hover:opacity-80">
            Write us: {EMAIL}
          </a>
        </div>
        <header
          ref={headerElRef}
          className={`grid grid-cols-[auto_1fr_auto] items-center gap-5 border-b px-7 backdrop-blur-md transition-[padding,background-color,border-color,box-shadow,backdrop-filter] duration-300 [transition-timing-function:var(--ease-out-soft)] ${
            scrolled ? "py-2 shadow-[var(--shadow-sm)]" : transparentAtRest ? "py-3.5 shadow-[0_1px_24px_-4px_rgba(18,18,18,0.08)]" : "border-b-2 py-3.5"
          }`}
          style={{
            borderColor: scrolled ? "var(--line-strong)" : transparentAtRest ? "rgba(18,18,18,0.08)" : "var(--ink)",
            background: scrolled ? "rgba(255,255,255,0.72)" : transparentAtRest ? "rgba(255,255,255,0.55)" : "var(--paper)",
          }}
        >
          <Link href="/" className="transition-opacity duration-150 hover:opacity-75">
            <SiteBrandMark scrolled={scrolled} />
          </Link>
          <nav className="hidden items-center justify-center gap-5 text-sm lg:flex" aria-label="Primary">
            <ProductsMegaMenu active={pathname?.startsWith("/products") ?? false} counts={categoryCounts} brands={brandsMenu} />
            <BrandsMegaMenu active={pathname?.startsWith("/brands") ?? false} brands={brandsMenu} />
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} label={link.label} active={pathname?.startsWith(link.href) ?? false} />
            ))}
            <HyderabadMegaMenu active={pathname?.startsWith("/hyderabad") ?? false} />
          </nav>
          <div className="col-start-3 flex items-center gap-3">
            <div className="hidden lg:block">
              <SearchBar />
            </div>
            <Link
              href="/saved"
              aria-label="Saved products"
              className="hidden items-center text-[var(--ink)] transition-colors duration-150 hover:text-[var(--burgundy)] lg:flex"
            >
              <SaveIcon filled={pathname?.startsWith("/saved") ?? false} />
            </Link>
            <MobileMenu />
          </div>
        </header>
      </div>
      <div aria-hidden="true" style={{ height: chromeHeight ?? 0 }} />
    </>
  );
}
