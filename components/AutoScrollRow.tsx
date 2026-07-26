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
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollRef = useRef(0);
  const lastXRef = useRef(0);
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf: number;
    let last = performance.now();
    function tick(now: number) {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current && !draggingRef.current && el) {
        el.scrollLeft += speed * dt;
        const half = el.scrollWidth / 2;
        if (half > 0 && el.scrollLeft >= half) el.scrollLeft -= half;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [speed]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType !== "mouse" || !ref.current) return;
    draggingRef.current = true;
    startXRef.current = e.clientX;
    lastXRef.current = e.clientX;
    startScrollRef.current = ref.current.scrollLeft;
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || !ref.current) return;
    lastXRef.current = e.clientX;
    ref.current.scrollLeft = startScrollRef.current - (e.clientX - startXRef.current);
  }

  function endDrag() {
    if (draggingRef.current && Math.abs(lastXRef.current - startXRef.current) > 5) {
      suppressClickRef.current = true;
    }
    draggingRef.current = false;
    // Safety net: a drag that ends outside the element (pointer capture can
    // suppress the matching pointerleave) must never leave the pause stuck on.
    pausedRef.current = false;
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClickRef.current = false;
    }
  }

  return (
    <div
      ref={ref}
      className={`ribbon-scroll ${className}`}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") pausedRef.current = true;
      }}
      onPointerLeave={(e) => {
        if (e.pointerType === "mouse") {
          pausedRef.current = false;
          endDrag();
        }
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={onClickCapture}
    >
      <div className={trackClassName}>{children}</div>
    </div>
  );
}
