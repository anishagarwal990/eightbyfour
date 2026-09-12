"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface FanBlade {
  slug: string;
  /** Full category name, used in the card. */
  name: string;
  /** Short label on the blade tip — same as `name` unless it would wrap badly at 10px. */
  tag: string;
  href: string;
  /** 0 means "no SKUs yet" — rendered as "on request" everywhere instead of "0". */
  count: number;
  /** "29 products · 4–25 mm" or, for a zero-count category, "No SKUs yet — sourced to order". */
  spec: string;
  /** Brands with live SKUs in this category, from getCategoryBrandNames(). */
  brands: string[];
  /** Source-only manufacturers mapped to this category (see SOURCE_ONLY_BRANDS). */
  sourcedOnRequest: string[];
  /** A real product photo for the blade face, or null for the three categories with none. */
  image: string | null;
  /** How the face image is framed — mirrors lib/categoryArt.ts's surface/packshot split. */
  treatment: "surface" | "packshot" | "drawn-panels" | "drawn-adhesive" | "drawn-hardware";
}

// The blades open once on load, then walk this subset before settling — a
// deliberate spread across the catalogue's shape (a board, a surface, the two
// biggest counts, and the one category with no stock at all) rather than every
// blade in order, which would take 30+ seconds to make its point.
const TOUR_SLUGS = ["plywood", "mdf-and-hdhmr", "laminates", "corian-acrylic-solid-surface", "veneers", "hardware"];

function reduceMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The homepage hero's opening object: a designer's own sample fan, reloaded
 * with categories instead of laminate shades. One blade per section of the
 * catalogue — boards, surfaces, adhesives, hardware — each naming its real
 * count and the brands behind it, so the first second says "everything we
 * carry" instead of "we sell laminates".
 *
 * Opens once on load, auto-walks a handful of blades, then goes quiet the
 * moment a visitor hovers, focuses or clicks one. Rests fully open with no
 * tour under prefers-reduced-motion.
 */
export function MaterialFan({ blades }: { blades: FanBlade[] }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [swap, setSwap] = useState(false);
  const tourTimer = useRef<number | null>(null);

  useEffect(() => {
    // 0ms under prefers-reduced-motion rather than setting state synchronously
    // in the effect body (still resolves on the next tick, which is enough to
    // stay out of the render phase and keep this a plain scheduled update).
    const t = window.setTimeout(() => setOpen(true), reduceMotion() ? 0 : 400);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (reduceMotion()) return;
    const tourIndexes = TOUR_SLUGS.map((slug) => blades.findIndex((b) => b.slug === slug)).filter((i) => i >= 0);
    if (tourIndexes.length === 0) return;
    let step = 0;
    const startDelay = window.setTimeout(() => {
      show(tourIndexes[0]);
      tourTimer.current = window.setInterval(() => {
        step += 1;
        if (step >= tourIndexes.length) {
          if (tourTimer.current) window.clearInterval(tourTimer.current);
          tourTimer.current = null;
          return;
        }
        show(tourIndexes[step]);
      }, 2300);
    }, 1700);
    return () => {
      window.clearTimeout(startDelay);
      if (tourTimer.current) window.clearInterval(tourTimer.current);
    };
    // Intentionally mount-only (deps: [blades] alone): this timer is the
    // *initial* tour and must not restart when `active` changes from a
    // visitor's own hover.
  }, [blades]);

  function show(i: number) {
    setActive((current) => {
      if (i === current) return current;
      setSwap(true);
      window.setTimeout(() => setSwap(false), 170);
      return i;
    });
  }

  function take(i: number) {
    if (tourTimer.current) {
      window.clearInterval(tourTimer.current);
      tourTimer.current = null;
    }
    show(i);
  }

  const current = blades[active];
  if (!current) return null;

  return (
    <div className="material-fan">
      <div className="material-fan-stage">
        <div className={`fan${open ? " fan--open" : ""}`}>
          {blades.map((b, i) => (
            <button
              key={b.slug}
              type="button"
              className={`fan-blade${i === active ? " fan-blade--on" : ""}`}
              style={{ "--i": i } as React.CSSProperties}
              aria-label={`${b.name} — ${b.spec}`}
              onPointerEnter={() => take(i)}
              onFocus={() => take(i)}
              onClick={() => take(i)}
            >
              <span className="fan-tag">
                <b>{b.tag}</b>
                <span>{b.count > 0 ? b.count.toLocaleString("en-IN") : "on request"}</span>
              </span>
              <span className={`fan-face fan-face--${b.treatment}`}>
                {b.image ? <Image src={b.image} alt="" fill sizes="120px" className="object-cover" /> : null}
              </span>
              <span className="fan-base" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="fan-card" aria-live="polite">
        <div className={`fan-card-body${swap ? " fan-card-body--swap" : ""}`}>
          <p className="tracked-caps" style={{ fontSize: 11, color: "var(--line-strong)" }}>
            {String(active + 1).padStart(2, "0")} / {blades.length}
          </p>
          <p className="serif mt-2" style={{ fontSize: 25, lineHeight: 1.1 }}>
            {current.name}
          </p>
          <p className="mt-1" style={{ fontSize: 13, fontWeight: 500, color: "var(--burgundy)" }}>
            {current.spec}
          </p>
          {current.brands.length > 0 && (
            <p className="mt-2.5" style={{ fontSize: 13.5, lineHeight: 1.45 }}>
              {current.brands.join(", ")}
            </p>
          )}
          {current.sourcedOnRequest.length > 0 && (
            <p className="mt-1" style={{ fontSize: 12.5, lineHeight: 1.45, color: "var(--line-strong)" }}>
              Sourced on request: {current.sourcedOnRequest.join(", ")}
            </p>
          )}
          <Link
            href={current.href}
            className="mt-3 inline-flex items-center gap-1.5"
            style={{ fontSize: 14, fontWeight: 500, color: "var(--burgundy)" }}
          >
            {current.count > 0 ? `Browse ${current.name.toLowerCase()}` : `Ask for ${current.name.toLowerCase()}`}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
