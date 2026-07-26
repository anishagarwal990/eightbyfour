import Image from "next/image";
import type { HeroPreviewImage } from "@/lib/data/products";

/** Splits a mixed image list into `n` columns by taking every nth item, so each column stays mixed too. */
function toColumns(images: HeroPreviewImage[], n: number): HeroPreviewImage[][] {
  const columns: HeroPreviewImage[][] = Array.from({ length: n }, () => []);
  images.forEach((img, i) => columns[i % n].push(img));
  return columns;
}

function ImageColumn({ images, reverse }: { images: HeroPreviewImage[]; reverse: boolean }) {
  if (images.length === 0) return null;
  const items = [...images, ...images];

  return (
    <div className="hero-column-mask h-[420px] w-20 overflow-hidden rounded-md">
      <div
        className={`hero-column-track flex flex-col gap-3 ${reverse ? "hero-column-track-reverse" : ""}`}
      >
        {items.map((img, i) => (
          <div key={`${img.src}-${i}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md shadow-[var(--shadow-sm)]">
            <Image src={img.src} alt={img.alt} fill sizes="80px" className="object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroImagePreview({ images, side }: { images: HeroPreviewImage[]; side: "left" | "right" }) {
  const half = Math.ceil(images.length / 2);
  const mine = side === "left" ? images.slice(0, half) : images.slice(half);
  const [colA, colB] = toColumns(mine, 2);
  if (!colA?.length && !colB?.length) return null;

  return (
    <div
      className={`pointer-events-none absolute top-1/2 hidden -translate-y-1/2 gap-3 xl:flex ${side === "left" ? "left-6" : "right-6"}`}
      aria-hidden="true"
    >
      <ImageColumn images={colA ?? []} reverse={false} />
      <ImageColumn images={colB ?? []} reverse={true} />
    </div>
  );
}
