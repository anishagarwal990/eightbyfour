"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

export interface ScrollSpyItem {
  slug: string;
  name: string;
  tagline: string;
  total: number;
  /** null for "coming soon" categories with no live products yet — renders a placeholder instead of a photo. */
  image: string | null;
}

function StepPhoto({ item, priority }: { item: ScrollSpyItem; priority?: boolean }) {
  if (!item.image) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-center" style={{ background: "var(--paper-dim)" }}>
        <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
          Coming Soon
        </p>
      </div>
    );
  }
  return (
    <Image
      src={item.image}
      alt={item.name}
      fill
      sizes="(max-width: 640px) 45vw, (max-width: 1024px) 35vw, 420px"
      className="object-cover"
      priority={priority}
    />
  );
}

// How far (as a fraction of viewport height) from dead-center an item can be
// before it's fully dimmed. Inside that band, brightness scales continuously
// with distance — driven by scroll position every frame, not a one-shot
// IntersectionObserver trigger.
const DIM_BAND_VH = 0.55;

/**
 * A vertically-scrolling list with a companion photo that tracks near
 * viewport-center — following whichever name is currently active — instead
 * of sitting `position: sticky` at a fixed offset. A fixed offset only looks
 * right for a short list; once the list is long enough to scroll for a
 * while, a sticky-at-a-fixed-top photo drifts away from whatever's actually
 * active. The photo here is `position: fixed`, with its vertical position
 * recomputed every scroll frame and clamped to the section's own start/end
 * so it never floats above or below the list itself.
 */
export function CategoryScrollSpy({ items }: { items: ScrollSpyItem[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const colRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
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
      const section = sectionRef.current;
      const col = colRef.current;
      const photo = photoRef.current;
      if (!section || !col || !photo) return;

      const viewport = window.innerHeight;
      const center = viewport / 2;
      const band = viewport * DIM_BAND_VH;
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

      // Position the fixed photo: same width/left as its reserved grid
      // column, vertical center pinned to viewport-center but clamped so it
      // never leaves the section's own top/bottom bounds.
      const colRect = col.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const photoHeight = colRect.width * 1.25; // aspect-[4/5]

      photo.style.width = `${colRect.width}px`;
      photo.style.height = `${photoHeight}px`;
      photo.style.left = `${colRect.left}px`;

      const minTop = sectionRect.top;
      const maxTop = sectionRect.bottom - photoHeight;
      const desiredTop = center - photoHeight / 2;
      const clampedTop = maxTop >= minTop ? Math.min(Math.max(desiredTop, minTop), maxTop) : minTop;
      photo.style.top = `${clampedTop}px`;

      // Gate visibility on the same per-item distance already driving text
      // opacity above — not on the section's own scroll boundary. Those two
      // drifted out of sync once item spacing was tightened: with shorter
      // rows, the scroll distance needed for sectionRect.top to reach 0
      // covers several items' worth of movement, so the photo stayed hidden
      // well past the point where later items were already active. Tying it
      // to closestDist keeps it exactly synced to whichever item is active,
      // regardless of row height.
      const inView = closestDist < band;
      photo.style.opacity = inView ? "1" : "0";
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
    <section ref={sectionRef} className="relative px-7 py-10">
      <div className="mx-auto grid max-w-5xl grid-cols-[160px_1fr] gap-6 sm:grid-cols-[240px_1fr] sm:gap-10 lg:grid-cols-[420px_1fr] lg:gap-16">
        {/* Invisible spacer — reserves the column's width/position for the fixed photo to measure against. */}
        <div ref={colRef} className="invisible" aria-hidden="true" style={{ aspectRatio: "4 / 5" }} />

        <ul className="flex flex-col">
          {items.map((item, i) => (
            <li
              key={item.slug}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              className="py-5 sm:py-6"
              style={{ opacity: 0.32 }}
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

      <div ref={photoRef} className="pointer-events-none fixed z-10 opacity-0" style={{ transform: "rotate(-2.5deg)" }}>
        <div className="relative h-full w-full overflow-hidden rounded-sm shadow-[var(--shadow-lg)]" style={{ background: "var(--paper-dim)" }}>
          <div className="absolute inset-0 transition-opacity duration-500 [transition-timing-function:var(--ease-out-soft)]" style={{ opacity: frontIsA ? 1 : 0 }}>
            <StepPhoto item={items[slotA]} priority={slotA === 0} />
          </div>
          <div className="absolute inset-0 transition-opacity duration-500 [transition-timing-function:var(--ease-out-soft)]" style={{ opacity: frontIsA ? 0 : 1 }}>
            <StepPhoto item={items[slotB]} />
          </div>
        </div>
      </div>
    </section>
  );
}
