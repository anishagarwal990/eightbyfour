"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface ScrollSpyItem {
  slug: string;
  name: string;
  tagline: string;
  total: number;
  image: string;
}

// How far (as a fraction of viewport height) from dead-center an item can be
// before it's fully dimmed. Inside that band, brightness scales continuously
// with distance — driven by scroll position every frame, not a one-shot
// IntersectionObserver trigger.
const DIM_BAND_VH = 0.55;

/**
 * A vertically-scrolling list of categories with one pinned photo panel that
 * swaps to match whichever name is nearest viewport-center. Inverse of the
 * pinned case-study blocks: there the frame stayed fixed and content cycled
 * inside it; here the list itself scrolls and only the photo is pinned.
 */
export function CategoryScrollSpy({ items }: { items: ScrollSpyItem[] }) {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const activeIndexRef = useRef(0);
  const [slotA, setSlotA] = useState(0);
  const [slotB, setSlotB] = useState(0);
  const frontIsARef = useRef(true);
  const [frontIsA, setFrontIsA] = useState(true);

  useEffect(() => {
    if (items.length === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      const center = window.innerHeight / 2;
      const band = window.innerHeight * DIM_BAND_VH;
      let closestIndex = activeIndexRef.current;
      let closestDist = Infinity;

      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const dist = Math.abs(mid - center);
        if (dist < closestDist) {
          closestDist = dist;
          closestIndex = i;
        }
        const t = reduceMotion ? (i === activeIndexRef.current ? 1 : 0) : Math.max(0, 1 - dist / band);
        el.style.opacity = String(0.32 + 0.68 * t);
      });

      if (closestIndex !== activeIndexRef.current) {
        activeIndexRef.current = closestIndex;
        if (frontIsARef.current) {
          setSlotB(closestIndex);
        } else {
          setSlotA(closestIndex);
        }
        frontIsARef.current = !frontIsARef.current;
        setFrontIsA(frontIsARef.current);
      }
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [items.length]);

  if (items.length === 0) return null;
  const activeIndex = frontIsA ? slotA : slotB;

  return (
    <section className="px-7 py-16">
      <div className="mx-auto grid max-w-5xl grid-cols-[160px_1fr] gap-6 sm:grid-cols-[240px_1fr] sm:gap-10 lg:grid-cols-[420px_1fr] lg:gap-16">
        <div className="sticky top-24 h-fit self-start">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-sm" style={{ background: "var(--paper-dim)" }}>
            <div className="absolute inset-0 transition-opacity duration-500 [transition-timing-function:var(--ease-out-soft)]" style={{ opacity: frontIsA ? 1 : 0 }}>
              <Image src={items[slotA].image} alt={items[slotA].name} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 35vw, 420px" className="object-cover" />
            </div>
            <div className="absolute inset-0 transition-opacity duration-500 [transition-timing-function:var(--ease-out-soft)]" style={{ opacity: frontIsA ? 0 : 1 }}>
              <Image src={items[slotB].image} alt={items[slotB].name} fill sizes="(max-width: 640px) 45vw, (max-width: 1024px) 35vw, 420px" className="object-cover" />
            </div>
          </div>
          <p className="mt-3 hidden text-xs sm:block" style={{ color: "var(--line-strong)" }}>
            {items[activeIndex].total.toLocaleString()} products &middot; {items[activeIndex].tagline}
          </p>
        </div>

        <ul className="flex flex-col">
          {items.map((item, i) => (
            <li
              key={item.slug}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="border-b py-8 last:border-b-0 sm:py-10"
              style={{ borderColor: "var(--line)", opacity: 0.32 }}
            >
              <Link href={`/products/${item.slug}`} className="group flex items-baseline justify-between gap-4">
                <span
                  className="serif transition-colors duration-300"
                  style={{ fontSize: "var(--fs-h1)", color: i === activeIndex ? "var(--burgundy)" : "var(--ink)" }}
                >
                  {item.name}
                </span>
                <span
                  className="shrink-0 text-sm opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ color: "var(--accent)" }}
                >
                  View all →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
