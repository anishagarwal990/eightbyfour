"use client";

import { useEffect, useRef, useState } from "react";

/** Auto-scrolling horizontal row that visitors can also grab-drag (mouse) or swipe (touch) themselves. */
export function AutoScrollRow({
  children,
  trackClassName = "",
  speed = 30,
  className = "",
  reverse = false,
  label = "animation",
}: {
  children: React.ReactNode;
  trackClassName?: string;
  speed?: number;
  className?: string;
  /** Scrolls right-to-left instead of left-to-right — e.g. a brand belt moving opposite a category runway above it. */
  reverse?: boolean;
  /** Names this row in the pause control's accessible label, e.g. "category ribbon". */
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const hoveringRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  const lastXRef = useRef(0);
  const suppressClickRef = useRef(false);
  const pressTargetRef = useRef<Element | null>(null);

  // The visitor's explicit choice via the Pause/Play button. Kept separate from
  // the transient hover / drag / keyboard-focus pauses below — those must never
  // change what the button reports.
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  // prefers-reduced-motion: no auto-scroll runs at all, and the pause control is
  // not rendered (there is no motion to pause). Starts false so the first client
  // render matches the server markup, then syncs on mount.
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion) return;

    // Reverse rails start mid-way through the doubled content and count down,
    // so the two copies still meet seamlessly at the loop point.
    if (reverse) el.scrollLeft = el.scrollWidth / 2;

    // Pointer capture can be lost without a pointerup/pointercancel ever reaching
    // this element (e.g. the cursor drifts off during a window/focus change), which
    // would otherwise leave draggingRef stuck true and freeze the scroll forever.
    function clearDragging() {
      draggingRef.current = false;
    }
    window.addEventListener("pointerup", clearDragging);
    window.addEventListener("pointercancel", clearDragging);
    window.addEventListener("blur", clearDragging);

    let raf: number;
    let last = performance.now();
    let lastHoverCheck = 0;
    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      // Self-heal: pointerleave can be missed (tab-switch mid-hover, DOM covered by an
      // overlay, node re-rendered under the cursor) which would otherwise leave
      // hoveringRef stuck true and freeze the ribbon forever. :hover is authoritative.
      //
      // Throttled to 4x a second rather than run every frame: matches(":hover")
      // forces a style recalc, and this ribbon is sticky, full width and sits over
      // a backdrop-filtered band, so paying that on every frame taxed every scroll
      // on the site. A quarter-second of a stuck ribbon is imperceptible.
      if (hoveringRef.current && el && now - lastHoverCheck > 250) {
        lastHoverCheck = now;
        if (!el.matches(":hover")) hoveringRef.current = false;
      }
      // Keyboard focus inside the row pauses the scroll (WCAG 2.2.2) so a focused
      // link is never carried out from under the visitor. A DOM containment check,
      // not :focus-within — the latter forces a style recalc every frame the way
      // :hover does, and this loop already runs on every rail on the page.
      const focusInside = !!el && el.contains(document.activeElement);
      if (!pausedRef.current && !draggingRef.current && !hoveringRef.current && !focusInside && el) {
        const half = el.scrollWidth / 2;
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (reverse) {
          el.scrollLeft -= speed * dt;
          if (half > 0 && el.scrollLeft <= 0) {
            el.scrollLeft += half;
          } else if (half > maxScroll && el.scrollLeft <= 0) {
            el.scrollLeft = maxScroll;
          }
        } else {
          el.scrollLeft += speed * dt;
          if (half > 0 && el.scrollLeft >= half) {
            // Content (two copies) is wide enough to loop at the seam — the normal case.
            el.scrollLeft -= half;
          } else if (half > maxScroll && el.scrollLeft >= maxScroll) {
            // Content is too narrow for the viewport to ever reach the seam — the browser
            // clamps scrollLeft at maxScroll before we get there, which otherwise freezes
            // the ribbon forever instead of looping. Snap back to the start instead.
            el.scrollLeft = 0;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerup", clearDragging);
      window.removeEventListener("pointercancel", clearDragging);
      window.removeEventListener("blur", clearDragging);
    };
  }, [speed, reverse, reducedMotion]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    startScrollRef.current = ref.current.scrollLeft;
    // Captured before setPointerCapture below can affect hit-testing — this is
    // whatever was actually under the cursor at press time.
    pressTargetRef.current = e.target as Element;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || !ref.current) return;
    lastXRef.current = e.clientX;
    ref.current.scrollLeft = startScrollRef.current - (e.clientX - startXRef.current);
  }

  function endDrag() {
    // A real click still jitters a few px between pointerdown and pointerup — only
    // treat it as a drag (and swallow the click) once movement is clearly deliberate.
    if (draggingRef.current && Math.abs(lastXRef.current - startXRef.current) > 12) {
      suppressClickRef.current = true;
    }
    draggingRef.current = false;
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
      return;
    }
    // The ribbon keeps auto-scrolling between pointerdown and pointerup, so on a
    // quick (non-drag) click the content under the cursor can have shifted by the
    // time the browser fires "click" — landing on a gap or a different item than
    // what was actually pressed, silently swallowing the navigation. Detect that
    // mismatch and fire the click on the link that was really pressed instead.
    const pressedLink = pressTargetRef.current?.closest?.("a") ?? null;
    const clickedLink = (e.target as Element)?.closest?.("a") ?? null;
    if (pressedLink && pressedLink !== clickedLink) {
      e.preventDefault();
      e.stopPropagation();
      (pressedLink as HTMLElement).click();
    }
  }

  function onPointerEnter(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") hoveringRef.current = true;
  }

  function onPointerLeave(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse") hoveringRef.current = false;
  }

  return (
    <div className="ribbon-row relative h-full">
      <div
        ref={ref}
        className={`ribbon-scroll ${className}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onClickCapture={onClickCapture}
      >
        <div className={trackClassName}>{children}</div>
      </div>
      {!reducedMotion && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-pressed={paused}
          aria-label={paused ? `Resume ${label}` : `Pause ${label}`}
          className="ribbon-pause absolute right-1.5 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border opacity-55 transition-opacity duration-150 hover:opacity-100 focus-visible:opacity-100"
          style={{ background: "var(--paper)", borderColor: "var(--line)", color: "var(--ink)" }}
        >
          {paused ? (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" fill="currentColor">
              <path d="M2 1.2v7.6a.4.4 0 0 0 .61.34l6.1-3.8a.4.4 0 0 0 0-.68L2.61.86A.4.4 0 0 0 2 1.2Z" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" fill="currentColor">
              <rect x="1.6" y="1" width="2.6" height="8" rx="0.5" />
              <rect x="5.8" y="1" width="2.6" height="8" rx="0.5" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
