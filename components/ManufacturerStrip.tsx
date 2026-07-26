"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { AutoScrollRow } from "@/components/AutoScrollRow";

interface RealBrand {
  slug: string;
  name: string;
  logo_url: string | null;
}

// Manufacturers EightByFour sources from but doesn't yet stock as SKUs —
// clicking opens an inquiry instead of a (nonexistent) brand catalogue page.
const SOURCE_ONLY_BRANDS = [
  { name: "Hafele", file: "hafele.png" },
  { name: "Hettich", file: "hettich.png" },
  { name: "Blum", file: "blum.png" },
  { name: "EBCO", file: "ebco.png" },
  { name: "Godrej", file: "godrej.webp" },
  { name: "Action Tesa", file: "action-tesa.png" },
  { name: "BisonPanel", file: "bisonpanel.webp" },
  { name: "Ozone", file: "ozone.png" },
  { name: "Dorset", file: "dorset.webp" },
  { name: "Europa", file: "europa.webp" },
  { name: "Saburi Ply", file: "saburi-ply.png" },
  { name: "Vivanta Solid Surfaces", file: "vivanta.jpeg" },
  { name: "LX Hausys", file: "lx-hausys.jpeg" },
  { name: "Staron", file: "staron.png" },
  { name: "PTA Fastener", file: "pta-fastener.jpeg" },
];

const logoClasses =
  "h-14 w-auto object-contain grayscale opacity-75 transition-[filter,opacity] duration-200 hover:grayscale-0 hover:opacity-100";

function LogoItem({ brand }: { brand: RealBrand }) {
  if (brand.logo_url) {
    return (
      <Link href={`/brands/${brand.slug}`} className="flex shrink-0 items-center">
        <Image
          src={brand.logo_url}
          alt={`${brand.name} logo`}
          width={220}
          height={56}
          className={logoClasses}
          style={{ width: "auto", height: "56px" }}
        />
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
  const { openModal } = useQuoteModal();

  function renderItems(keyPrefix: string) {
    return (
      <>
        {brands.map((b) => (
          <LogoItem key={`${keyPrefix}-${b.slug}`} brand={b} />
        ))}
        {SOURCE_ONLY_BRANDS.map((m) => (
          <button
            key={`${keyPrefix}-${m.file}`}
            type="button"
            onClick={() =>
              openModal(`${m.name} products`, `Tell us what you need from ${m.name} and we'll get back to you in less than 15 minutes.`)
            }
            className="flex shrink-0 items-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/brand-logos/${m.file}`} alt={m.name} className={logoClasses} />
          </button>
        ))}
      </>
    );
  }

  return (
    <section className="py-16" aria-label="Manufacturers we source from">
      <p className="tracked-caps px-7 text-center text-sm" style={{ color: "var(--accent)" }}>
        Manufacturers We Source From
      </p>
      <AutoScrollRow className="brand-ribbon-mask mt-8" trackClassName="flex items-center gap-16 px-7" speed={24}>
        {renderItems("a")}
        {renderItems("b")}
      </AutoScrollRow>
    </section>
  );
}
