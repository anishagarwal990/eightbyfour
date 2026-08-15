"use client";

import Image from "next/image";
import Link from "next/link";
import { AutoScrollRow } from "@/components/AutoScrollRow";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";

interface RealBrand {
  slug: string;
  name: string;
  logo_url: string | null;
}

// No `w-auto`: that would override the aspect-ratio next/image derives from
// width/height below, leaving the browser nothing to reserve layout space
// with until each logo decodes — the CLS culprit on this ribbon. Fixed
// height + the intrinsic aspect-ratio lets the browser compute a stable
// width up front; object-contain handles any real logo whose true aspect
// ratio differs from the nominal 220×56 box.
const logoClasses =
  "h-14 object-contain grayscale opacity-75 transition-[filter,opacity] duration-200 hover:grayscale-0 hover:opacity-100";

function LogoItem({ brand }: { brand: RealBrand }) {
  if (brand.logo_url) {
    return (
      <Link href={`/brands/${brand.slug}`} className="flex shrink-0 items-center">
        <Image src={brand.logo_url} alt={`${brand.name} logo`} width={220} height={56} className={logoClasses} />
      </Link>
    );
  }
  return (
    <Link
      href={`/brands/${brand.slug}`}
      className="serif shrink-0 whitespace-nowrap text-lg opacity-75 transition-opacity hover:opacity-100"
    >
      {brand.name}
    </Link>
  );
}

export function ManufacturerStrip({ brands }: { brands: RealBrand[] }) {
  function renderItems(keyPrefix: string) {
    return (
      <>
        {brands.map((b) => (
          <LogoItem key={`${keyPrefix}-${b.slug}`} brand={b} />
        ))}
        {SOURCE_ONLY_BRANDS.map((m) => (
          <Link key={`${keyPrefix}-${m.slug}`} href={`/brands/${m.slug}`} className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/brand-logos/${m.file}`}
              alt={m.name}
              width={220}
              height={56}
              loading="lazy"
              decoding="async"
              className={logoClasses}
            />
          </Link>
        ))}
      </>
    );
  }

  return (
    <section className="py-16" aria-label="Manufacturers we source from">
      <p className="tracked-caps px-7 text-center text-sm" style={{ color: "var(--accent)" }}>
        Manufacturers We Source From
      </p>
      <AutoScrollRow className="brand-ribbon-mask mt-8" trackClassName="flex items-center gap-16 px-7" speed={45}>
        {renderItems("a")}
        {renderItems("b")}
      </AutoScrollRow>
    </section>
  );
}
