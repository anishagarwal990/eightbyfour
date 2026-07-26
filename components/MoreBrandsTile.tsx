"use client";

import { useQuoteModal } from "@/context/QuoteModalContext";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";

function SourceOnlyBrandTile({ name, file }: { name: string; file: string }) {
  const { openModal } = useQuoteModal();
  return (
    <button
      type="button"
      onClick={() => openModal(`${name} products`, `Tell us what you need from ${name} and we'll get back to you in less than 15 minutes.`)}
      className={cardClasses("flex flex-col items-center gap-3 p-5 text-center")}
      style={CARD_BASE_STYLE}
    >
      <div className="relative h-12 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/brand-logos/${file}`} alt={`${name} logo`} className="h-full w-full object-contain" />
      </div>
    </button>
  );
}

export function SourceOnlyBrandTiles() {
  return (
    <>
      {SOURCE_ONLY_BRANDS.map((m) => (
        <SourceOnlyBrandTile key={m.file} name={m.name} file={m.file} />
      ))}
    </>
  );
}

export function MoreBrandsTile() {
  const { openModal } = useQuoteModal();
  return (
    <button
      type="button"
      onClick={() => openModal(undefined, "Tell us what you're looking for and we'll get back to you in less than 15 minutes.")}
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
