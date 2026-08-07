"use client";

import Link from "next/link";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";

function SourceOnlyBrandTile({ name, slug, file }: { name: string; slug: string; file: string }) {
  return (
    <Link href={`/brands/${slug}`} className={cardClasses("flex flex-col items-center gap-3 p-5 text-center")} style={CARD_BASE_STYLE}>
      <div className="relative h-12 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/brand-logos/${file}`} alt={`${name} logo`} loading="lazy" decoding="async" className="h-full w-full object-contain" />
      </div>
    </Link>
  );
}

export function SourceOnlyBrandTiles() {
  return (
    <>
      {SOURCE_ONLY_BRANDS.map((m) => (
        <SourceOnlyBrandTile key={m.slug} name={m.name} slug={m.slug} file={m.file} />
      ))}
    </>
  );
}

export function MoreBrandsTile() {
  const { openModal } = useQuoteModal();
  return (
    <button
      type="button"
      onClick={() =>
        openModal(undefined, "Tell us what you're looking for and we'll get back to you in less than 15 minutes.", "Tell Us What You Need")
      }
      className={cardClasses("flex flex-col items-center justify-center gap-2 p-5 text-center")}
      style={CARD_BASE_STYLE}
    >
      <p className="serif" style={{ fontSize: "var(--fs-h2)" }}>
        Sourcing even more
      </p>
      <p className="text-xs tracked-caps" style={{ color: "var(--accent)" }}>
        Tell us what you need
      </p>
    </button>
  );
}
