"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface FanBlade {
  slug: string;
  /** Full category name — card only. Several are far too long for a blade tip. */
  name: string;
  /** Short label printed on the blade tip, ~10 characters of room. */
  tag: string;
  href: string;
  /** 0 means "no SKUs yet" — rendered as "on request" everywhere, never as "0". */
  count: number;
  /** "29 products · 4–25 mm", or "No SKUs yet — sourced to order" for a zero-count category. */
  spec: string;
  /** Brands with live SKUs in this category, from getCategoryBrandNames(). */
  brands: string[];
  /** Source-only manufacturers mapped to this category (see SOURCE_ONLY_BRANDS). */
  sourcedOnRequest: string[];
  /** Blade face: a `.fan-face--*` modifier in globals.css (photo crop, or drawn). */
  face: string;
}

// The blades open once on load, then walk this subset before settling — a
// deliberate spread across the catalogue's shape (a board, a surface, the two
// biggest counts, and the one category with no stock at all) rather than every
// blade in order, which would take 30+ seconds to make its point.
const TOUR_SLUGS = ["plywood", "mdf-and-hdhmr", "laminates", "corian-acrylic-solid-surface", "veneers", "hardware"];

// Brand lists run from 1 name (Veneers) to 9 (Hardware). Capping them keeps the
// caption a stable height as the tour cycles, so the hero doesn't jump.
const MAX_BRANDS = 5;
const MAX_ON_REQUEST = 4;

function nameList(names: string[], max: number): string {
  return names.length <= max ? names.join(", ") : `${names.slice(0, max).join(", ")} +${names.length - max}`;
}

function reduceMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * The homepage hero's opening object: a designer's own sample fan, reloaded
 * with categories instead of laminate shades. One blade per section of the
 * catalogue — boards, surfaces, adhesives, hardware — so the first second says
 * "everything we carry" instead of "we sell laminates".
 *
 * The caption sits *under* the fan rather than over it, and a blade carries
 * only a short name: an overlapped blade shows about 40px of itself, which is
 * enough for "Plywood" and nothing more. Full name, count, spec and brands all
 * live in the caption, which is also why it doesn't need aria-live — every
 * blade is a button whose aria-label already carries its name and spec, so a
 * screen reader gets the whole thing on focus instead of being interrupted six
 * times by the opening tour.
 *
 * Opens once on load, auto-walks six categories, then goes quiet the moment a
 * visitor hovers, focuses or clicks one. Rests fully open, no tour, under
 * prefers-reduced-motion.
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

  // "Browse solid surface", not "browse nfc (natural fibre composite) boards".
  // The escape is deliberate: tags carry a soft hyphen (U+00AD) so a single
  // long word like "Blockboard" can break on the blade, and an invisible
  // literal sitting inside a regex is a silent trap for the next reader.
  const shortLabel = current.tag.replace(/\u00AD/g, "").toLowerCase();

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
              </span>
              <span className={`fan-face fan-face--${b.face}`} />
              <span className="fan-base" aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      <div className="fan-card">
        <div className={`fan-card-body${swap ? " fan-card-body--swap" : ""}`}>
          <p className="fan-card-head">
            <span className="serif fan-card-name">{current.name}</span>
            <span className="fan-card-i">
              {String(active + 1).padStart(2, "0")} / {blades.length}
            </span>
          </p>
          <p className="fan-card-spec">{current.spec}</p>
          {current.brands.length > 0 && <p className="fan-card-brands">{nameList(current.brands, MAX_BRANDS)}</p>}
          {current.sourcedOnRequest.length > 0 && (
            <p className="fan-card-req">On request: {nameList(current.sourcedOnRequest, MAX_ON_REQUEST)}</p>
          )}
          <Link href={current.href} className="fan-card-link">
            {current.count > 0 ? `Browse ${shortLabel}` : `Ask for ${shortLabel}`}
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
