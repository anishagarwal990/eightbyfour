import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/lib/categories";
import { cardClasses } from "@/components/ui/Card";

export function HomeCategoryGrid({
  counts,
  images,
}: {
  counts: Record<string, number>;
  images: Record<string, string[]>;
}) {
  return (
    <section className="px-7 pb-16">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((cat) => {
          const photos = images[cat.dbCategory] ?? [];
          return (
            <Link key={cat.slug} href={`/products/${cat.slug}`} className={cardClasses("block")} style={{ borderColor: "var(--line)", background: "var(--card)" }}>
              <div className="relative aspect-square w-full overflow-hidden" style={{ background: "var(--paper-dim)" }}>
                {photos.map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className={`object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.06] ${
                      photos.length > 1 ? "hero-crossfade-img" : ""
                    }`}
                    style={photos.length > 1 ? { animationDuration: "4s", animationDelay: `${i * (4 / photos.length)}s` } : undefined}
                  />
                ))}
              </div>
              <div className="p-3">
                <p className="serif" style={{ fontSize: "14px" }}>
                  {cat.name}
                </p>
                <p className="mt-0.5 text-xs" style={{ color: "var(--line-strong)" }}>
                  {(counts[cat.dbCategory] || 0).toLocaleString()} in stock
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
