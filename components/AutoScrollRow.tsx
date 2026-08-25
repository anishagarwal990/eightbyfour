"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Width of the gradient fade applied over an edge that has content scrolled past it. */
const FADE = 32;

/** Auto-scrolling horizontal row that visitors can also grab-drag (mouse) or swipe (touch) themselves. */
export function AutoScrollRow({
  children,
  trackClassName = "",
  speed = 30,
  className = "",
  label,
}: {
  children: React.ReactNode;
  trackClassName?: string;
  speed?: number;
  className?: string;
  /** Accessible name for the scrollable region — required for the keyboard affordance to be announced. */
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const hoveringRef = useRef(false);
  const focusedRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  const lastXRef = useRef(0);
  const suppressClickRef = useRef(false);
  const pressTargetRef = useRef<Element | null>(null);
  // Which edges actually have content past them — a fade over an edge with
  // nothing behind it just dims the first/last item for no reason.
  const [fade, setFade] = useState({ start: false, end: false });

  const syncFade = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    // 1px slack: fractional scroll positions never land exactly on 0 / max.
    setFade({ start: el.scrollLeft > 1, end: el.scrollLeft < max - 1 });
  }, []);

  // Fade state has to settle even when the marquee never animates (reduced
  // motion, or content narrower than the viewport), so it lives outside the
  // rAF effect below.
  useEffect(() => {
    syncFade();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(syncFade);
    ro.observe(el);
    return () => ro.disconnect();
  }, [syncFade, children]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

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
    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      // Self-heal: pointerleave can be missed (tab-switch mid-hover, DOM covered by an
      // overlay, node re-rendered under the cursor) which would otherwise leave
      // hoveringRef stuck true and freeze the ribbon forever. :hover is authoritative.
      if (hoveringRef.current && el && !el.matches(":hover")) {
        hoveringRef.current = false;
      }
      if (!draggingRef.current && !hoveringRef.current && !focusedRef.current && el) {
        el.scrollLeft += speed * dt;
        const half = el.scrollWidth / 2;
        const maxScroll = el.scrollWidth - el.clientWidth;
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
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerup", clearDragging);
      window.removeEventListener("pointercancel", clearDragging);
      window.removeEventListener("blur", clearDragging);
    };
  }, [speed]);

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

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const step = e.key === "Home" || e.key === "End" ? el.scrollWidth : el.clientWidth * 0.8;
    if (e.key === "ArrowRight") el.scrollLeft += 80;
    else if (e.key === "ArrowLeft") el.scrollLeft -= 80;
    else if (e.key === "PageDown") el.scrollLeft += step;
    else if (e.key === "PageUp") el.scrollLeft -= step;
    else if (e.key === "Home") el.scrollLeft = 0;
    else if (e.key === "End") el.scrollLeft = el.scrollWidth;
    else return;
    e.preventDefault();
    syncFade();
  }

  // Mask is a computed value (which edges, how wide) so it can't be a
  // static utility class.
  const maskImage =
    fade.start || fade.end
      ? `linear-gradient(to right, transparent 0, black ${fade.start ? FADE : 0}px, black calc(100% - ${fade.end ? FADE : 0}px), transparent 100%)`
      : undefined;

  return (
    <div
      ref={ref}
      className={`ribbon-scroll ${className}`}
      // Focusable so keyboard users can reach and scroll the region; without
      // a name and role it would be an unlabelled tab stop.
      tabIndex={0}
      role="region"
      aria-label={label}
      onKeyDown={onKeyDown}
      onFocus={() => {
        focusedRef.current = true;
      }}
      onBlur={() => {
        focusedRef.current = false;
      }}
      onScroll={syncFade}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onClickCapture={onClickCapture}
      style={{ WebkitMaskImage: maskImage, maskImage }}
    >
      <div className={trackClassName}>{children}</div>
    </div>
  );
}
