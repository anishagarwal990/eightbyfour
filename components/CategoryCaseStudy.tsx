"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductRow } from "@/lib/supabase/types";

interface CategoryCaseStudyProps {
  slug: string;
  name: string;
  tagline: string;
  total: number;
  products: ProductRow[];
}

const SEGMENT_VH = 55;
// Fraction of each step spent crossfading in from the previous step's content.
const TRANSITION_FRACTION = 0.22;

function StepContent({
  step,
  name,
  tagline,
  total,
  products,
}: {
  step: number;
  name: string;
  tagline: string;
  total: number;
  products: ProductRow[];
}) {
  const product = step > 0 ? products[step - 1] : null;
  return (
    // Some product photos (adhesives especially) are transparent-background
    // cutouts, not full-bleed lifestyle shots — a neutral fallback here keeps
    // that transparency from exposing the burgundy title-card color behind it.
    <div className="absolute inset-0" style={{ background: product ? "var(--paper-dim)" : "var(--burgundy)" }}>
      {product ? (
        <Image src={product.main_img_url as string} alt={product.name} fill sizes="100vw" className="object-cover" priority={step === 1} />
      ) : null}
      <div
        className="absolute inset-0"
        style={{ background: product ? "linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0) 50%)" : "linear-gradient(to top, rgba(0,0,0,0.25), rgba(0,0,0,0) 50%)" }}
      />
      <div className="absolute inset-x-0 bottom-0 px-7 py-8 sm:px-12 sm:py-10">
        {product ? (
          <div className="max-w-md">
            <p className="tracked-caps text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
              {product.brand}
            </p>
            <h3 className="serif mt-1" style={{ fontSize: "var(--fs-h2)", color: "#fff" }}>
              {product.name}
            </h3>
          </div>
        ) : (
          <div className="max-w-xl">
            <p className="tracked-caps text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
              {total.toLocaleString()} products
            </p>
            <h2 className="serif mt-1" style={{ fontSize: "var(--fs-h1)", color: "#fff" }}>
              {name}
            </h2>
            <p className="mt-2 max-w-md text-sm" style={{ color: "rgba(255,255,255,0.85)", lineHeight: "var(--lh-normal)" }}>
              {tagline}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * One category, pinned while the user scrolls through it: a title card first
 * (name + tagline + count), then N product photos revealed one at a time.
 * Two content layers crossfade directly into each other — the outgoing
 * step's content stays rendered underneath while the incoming step fades
 * over it, so the block's own burgundy backdrop never gets exposed between
 * product steps, only at the title card itself.
 */
export function CategoryCaseStudy({ slug, name, tagline, total, products }: CategoryCaseStudyProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const layerARef = useRef<HTMLDivElement>(null);
  const layerBRef = useRef<HTMLDivElement>(null);
  const [slotA, setSlotA] = useState(0);
  const [slotB, setSlotB] = useState(0);
  const [frontIsA, setFrontIsA] = useState(true);
  const frontIsARef = useRef(true);
  const currentStepRef = useRef(0);

  const steps = 1 + products.length; // step 0 = title card, 1..N = products

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const layerA = layerARef.current;
    const layerB = layerBRef.current;
    if (!wrapper || !layerA || !layerB || steps <= 1) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;

    const update = () => {
      raf = 0;
      const rect = wrapper.getBoundingClientRect();
      const viewport = window.innerHeight;
      const total = rect.height - viewport;
      const raw = total > 0 ? -rect.top / total : 0;
      const progress = Math.min(1, Math.max(0, raw));

      const scaled = progress * steps;
      const stepIndex = Math.min(steps - 1, Math.floor(scaled));
      const stepLocal = scaled - stepIndex;

      if (stepIndex !== currentStepRef.current) {
        // Sync BOTH slots explicitly — a fast flick/fling can jump the step
        // index by more than 1 between animation frames, so the "back" slot
        // must be pinned to whatever step we were actually just showing
        // (prevStep), not left holding whatever it rendered several steps
        // ago, or the two crossfade layers show mismatched, overlapping text.
        const prevStep = currentStepRef.current;
        currentStepRef.current = stepIndex;
        if (frontIsARef.current) {
          setSlotB(stepIndex);
          setSlotA(prevStep);
        } else {
          setSlotA(stepIndex);
          setSlotB(prevStep);
        }
        frontIsARef.current = !frontIsARef.current;
        setFrontIsA(frontIsARef.current);
      }

      const t = reduceMotion ? 1 : Math.min(1, stepLocal / TRANSITION_FRACTION);
      const frontOpacity = t;
      const backOpacity = 1 - t;
      if (frontIsARef.current) {
        layerA.style.opacity = String(frontOpacity);
        layerB.style.opacity = String(backOpacity);
      } else {
        layerB.style.opacity = String(frontOpacity);
        layerA.style.opacity = String(backOpacity);
      }
    };

    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [steps]);

  if (products.length === 0) return null;
  const displayedStep = frontIsA ? slotA : slotB; // whichever slot is currently at the front (opacity 1)

  return (
    <div ref={wrapperRef} style={{ height: `${steps * SEGMENT_VH}vh`, position: "relative" }}>
      <div className="sticky top-0 h-[70vh] w-full overflow-hidden sm:h-[85vh]">
        <Link href={`/products/${slug}`} className="group relative block h-full w-full" style={{ background: "var(--burgundy)" }}>
          <div ref={layerARef} className="absolute inset-0">
            <StepContent step={slotA} name={name} tagline={tagline} total={total} products={products} />
          </div>
          <div ref={layerBRef} className="absolute inset-0" style={{ opacity: 0 }}>
            <StepContent step={slotB} name={name} tagline={tagline} total={total} products={products} />
          </div>

          <span
            className="absolute bottom-8 right-7 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:bottom-10 sm:right-12"
            style={{ borderColor: "rgba(255,255,255,0.4)", color: "#fff" }}
            aria-hidden="true"
          >
            ↗
          </span>

          <div className="absolute right-7 top-6 flex gap-1.5 sm:right-12 sm:top-8" aria-hidden="true">
            {Array.from({ length: steps }).map((_, i) => (
              <span
                key={i}
                className="h-1 w-5 rounded-full transition-colors duration-300"
                style={{ background: i === displayedStep ? "#fff" : "rgba(255,255,255,0.35)" }}
              />
            ))}
          </div>
        </Link>
      </div>
    </div>
  );
}
