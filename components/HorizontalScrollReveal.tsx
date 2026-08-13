"use client";

import { useEffect, useRef, type ReactNode } from "react";

const SEGMENT_VH = 45;

/**
 * Pins the section while the user scrolls vertically through it, panning a
 * horizontal row of cards left to reveal them one at a time — the row starts
 * with only the first card visible and the rest off-screen right, and scroll
 * progress drives a single continuous translateX until the last card's edge
 * reaches the viewport edge, at which point the section releases.
 */
export function HorizontalScrollReveal({ children }: { children: ReactNode[] }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);
  const count = children.length;

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const row = rowRef.current;
    if (!wrapper || !row || count <= 1) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = wrapper.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = rect.height - viewport;
      const raw = total > 0 ? -rect.top / total : 0;
      const progress = Math.min(1, Math.max(0, raw));

      const maxTranslate = Math.max(0, row.scrollWidth - window.innerWidth);
      row.style.transform = `translateX(-${progress * maxTranslate}px)`;
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
  }, [count]);

  return (
    <div ref={wrapperRef} style={{ height: `${Math.max(1, count - 1) * SEGMENT_VH + 100}vh`, position: "relative" }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <div ref={rowRef} className="flex gap-6 px-7" style={{ willChange: "transform" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
