"use client";

import Image from "next/image";
import Link from "next/link";
import { AutoScrollRow } from "@/components/AutoScrollRow";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";
import { CategoryTile, CATEGORY_MARK_SLUGS, CATEGORY_MARK_LABEL } from "@/components/CategoryMark";

interface RealBrand {
  slug: string;
  name: string;
  logo_url: string | null;
}

// A bounded, consistently-sized box for every logo regardless of its native
// aspect ratio — object-contain never distorts, and the box itself (not the
// image) is what carries the card's size and hover treatment. No border or
// card background here — this is a flowing logo belt, not a grid of tiles.
const LOGO_BOX = "flex h-14 w-full items-center justify-center overflow-hidden";
const LOGO_IMG = "max-h-14 max-w-full object-contain grayscale opacity-75 transition-[filter,opacity] duration-200 group-hover:grayscale-0 group-hover:opacity-100";

const CARD =
  "group flex w-[136px] shrink-0 flex-col items-center gap-2 text-center transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] hover:z-10 hover:-translate-y-1 hover:scale-[1.03]";

function LogoCard({ href, name, logoSrc, logoFile }: { href: string; name: string; logoSrc?: string | null; logoFile?: string }) {
  return (
    <Link href={href} className={CARD}>
      <span className={LOGO_BOX}>
        {logoSrc ? (
          <Image src={logoSrc} alt={`${name} logo`} width={220} height={56} className={LOGO_IMG} />
        ) : logoFile ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/brand-logos/${logoFile}`} alt={`${name} logo`} width={220} height={56} loading="lazy" decoding="async" className={LOGO_IMG} />
        ) : (
          <span className="serif text-base opacity-75 transition-opacity group-hover:opacity-100">{name}</span>
        )}
      </span>
      <span className="truncate text-xs font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ color: "var(--line-strong)" }}>
        {name}
      </span>
    </Link>
  );
}

export function ManufacturerStrip({ brands, reverse = false }: { brands: RealBrand[]; reverse?: boolean }) {
  function renderItems(keyPrefix: string) {
    return (
      <>
        {CATEGORY_MARK_SLUGS.map((slug) => (
          <Link key={`${keyPrefix}-eightxfour-${slug}`} href={`/brands/eightbyfour`} className={CARD}>
            <span className={LOGO_BOX}>
              <CategoryTile
                slug={slug}
                size={56}
                className="grayscale opacity-75 transition-[filter,opacity] duration-200 group-hover:grayscale-0 group-hover:opacity-100"
              />
            </span>
            <span className="truncate text-xs font-medium opacity-0 transition-opacity duration-200 group-hover:opacity-100" style={{ color: "var(--line-strong)" }}>
              {CATEGORY_MARK_LABEL[slug]}
            </span>
          </Link>
        ))}
        {brands.map((b) => (
          <LogoCard key={`${keyPrefix}-${b.slug}`} href={`/brands/${b.slug}`} name={b.name} logoSrc={b.logo_url} />
        ))}
        {SOURCE_ONLY_BRANDS.map((m) => (
          <LogoCard key={`${keyPrefix}-${m.slug}`} href={`/brands/${m.slug}`} name={m.name} logoFile={m.file} />
        ))}
      </>
    );
  }

  return (
    <AutoScrollRow className="edge-fade-mask" trackClassName="flex items-stretch gap-3 px-7" speed={38} reverse={reverse}>
      {renderItems("a")}
      {renderItems("b")}
    </AutoScrollRow>
  );
}
