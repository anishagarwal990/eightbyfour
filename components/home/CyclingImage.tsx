"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * A category tile that cycles through several real products from that
 * category, crossfading on a timer.
 *
 * Three things it deliberately does NOT do:
 *
 * 1. It doesn't mount every frame up front. Ten tiles × six images would be
 *    sixty requests on first paint for images most visitors never see. Layers
 *    mount one ahead of the one showing, so the next frame is decoded and
 *    ready to fade in but nothing further down the list has loaded yet.
 * 2. It doesn't run a timer while off-screen, when `gateOnVisibility` is on —
 *    an IntersectionObserver gates it, so the category grid isn't animating
 *    behind the hero. Callers inside a horizontal scroll container must turn
 *    this OFF: IntersectionObserver honours ancestor overflow clipping, and
 *    `rootMargin` cannot see past it, so a slide that scrolls sideways reads
 *    as not-intersecting no matter how generous the margin. Gating on that
 *    tears the timer down on every carousel advance.
 * 3. It doesn't cycle at all under prefers-reduced-motion — a crossfade every
 *    five seconds is exactly the kind of ambient movement that setting exists
 *    to stop. The first image stays put.
 *
 * `delayMs` staggers each tile's phase. Without it every tile in the grid
 * flips on the same frame, which reads as a page glitch rather than as
 * material being shown.
 */
export function CyclingImage({
  images,
  alt,
  sizes,
  imageClassName,
  priority,
  intervalMs = 5000,
  delayMs = 0,
  gateOnVisibility = true,
}: {
  images: string[];
  alt: string;
  sizes: string;
  imageClassName: string;
  priority?: boolean;
  intervalMs?: number;
  delayMs?: number;
  /** Turn off inside a horizontal scroller — see the note above. */
  gateOnVisibility?: boolean;
}) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const [index, setIndex] = useState(0);
  // How many layers are in the DOM: always one beyond the visible frame, so
  // the next crossfade has something decoded to fade to.
  const [mounted, setMounted] = useState(() => Math.min(2, images.length));
  const [inView, setInView] = useState(!gateOnVisibility);

  useEffect(() => {
    if (!gateOnVisibility) return;
    const host = hostRef.current;
    if (!host) return;
    const observer = new IntersectionObserver((entries) => setInView(entries[0]?.isIntersecting ?? false), {
      rootMargin: "200px",
    });
    observer.observe(host);
    return () => observer.disconnect();
  }, [gateOnVisibility]);

  useEffect(() => {
    if (images.length < 2 || !inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        // Two independent updaters, not one nested inside the other's
        // callback: an updater has to stay pure, and `mounted` only ever
        // grows, so it doesn't need to read the index at all.
        setIndex((i) => (i + 1) % images.length);
        setMounted((m) => Math.min(images.length, m + 1));
      }, intervalMs);
    }, delayMs);

    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [delayMs, images.length, intervalMs, inView]);

  return (
    <span ref={hostRef} className="absolute inset-0 block">
      {images.slice(0, mounted).map((src, i) => (
        <Image
          key={src}
          src={src}
          // Only the first frame carries the alt text; the rest are alternate
          // views of the same category and would just repeat it to a screen
          // reader.
          alt={i === 0 ? alt : ""}
          fill
          priority={priority && i === 0}
          sizes={sizes}
          className={`${imageClassName} transition-opacity duration-700 [transition-timing-function:var(--ease-out-soft)] motion-reduce:transition-none`}
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
    </span>
  );
}
