"use client";

import Link from "next/link";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { SOURCE_ONLY_BRANDS } from "@/lib/source-only-brands";

function SourceOnlyBrandTile({ name, slug, file }: { name: string; slug: string; file: string }) {
  return (
    <Link href={`/brands/${slug}`} className="group flex flex-col items-center gap-3 text-center">
      <div className="relative h-12 w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/brand-logos/${file}`}
          alt={`${name} logo`}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-contain grayscale opacity-75 transition-[filter,opacity] duration-200 group-hover:grayscale-0 group-hover:opacity-100"
        />
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
    // Dashed border deliberately kept — this is a CTA prompt, not a logo, so
    // it should read as distinct from the borderless logos surrounding it.
    <button
      type="button"
      onClick={() =>
        openModal(undefined, "Tell us what you're looking for and we'll get back to you in less than 15 minutes.", "Tell Us What You Need")
      }
      className="flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed p-5 text-center transition-[border-color] duration-200 hover:border-[var(--burgundy)]"
      style={{ borderColor: "var(--line)" }}
    >
      <p className="serif" style={{ fontSize: "18px" }}>
        Sourcing even more
      </p>
      <p className="text-xs tracked-caps" style={{ color: "var(--accent)" }}>
        Tell us what you need
      </p>
    </button>
  );
}
