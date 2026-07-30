"use client";

import { useEffect, useRef } from "react";

/** Auto-scrolling horizontal row that visitors can also grab-drag (mouse) or swipe (touch) themselves. */
export function AutoScrollRow({
  children,
  trackClassName = "",
  speed = 30,
  className = "",
}: {
  children: React.ReactNode;
  trackClassName?: string;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const hoveringRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  const lastXRef = useRef(0);
  const suppressClickRef = useRef(false);
  const pressTargetRef = useRef<Element | null>(null);

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
      if (!draggingRef.current && !hoveringRef.current && el) {
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

  return (
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
  );
}
