"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    if (!lightboxOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setLightboxOpen(false);
      else if (e.key === "ArrowRight") setActive((i) => (i + 1) % images.length);
      else if (e.key === "ArrowLeft") setActive((i) => (i - 1 + images.length) % images.length);
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, images.length]);

  if (images.length === 0) {
    return (
      <div
        className="flex aspect-video items-center justify-center serif"
        style={{ background: "var(--paper-dim)" }}
      >
        {alt}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        className="relative block aspect-square w-full cursor-zoom-in overflow-hidden"
        style={{ background: "var(--paper-dim)" }}
        aria-label="View full-size image"
      >
        <Image
          key={active}
          src={images[active]}
          alt={`${alt} — image ${active + 1}`}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="filter-fade object-contain"
          priority
        />
      </button>

      {images.length > 1 ? (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={active === i}
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border-2 transition-[border-color,transform] duration-150 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5"
              style={{ borderColor: active === i ? "var(--burgundy)" : "var(--line)", background: "var(--paper-dim)" }}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      ) : null}

      {lightboxOpen ? (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close"
            className="absolute right-5 top-5 text-3xl leading-none text-white transition-transform duration-150 hover:scale-110"
          >
            ×
          </button>

          {images.length > 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActive((i) => (i - 1 + images.length) % images.length);
              }}
              aria-label="Previous image"
              className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-6 text-4xl leading-none text-white transition-transform duration-150 hover:scale-125 sm:left-5"
            >
              ‹
            </button>
          ) : null}

          <div className="relative h-full max-h-[85vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image
              key={active}
              src={images[active]}
              alt={`${alt} — image ${active + 1}`}
              fill
              sizes="100vw"
              className="filter-fade object-contain"
            />
          </div>

          {images.length > 1 ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActive((i) => (i + 1) % images.length);
              }}
              aria-label="Next image"
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-6 text-4xl leading-none text-white transition-transform duration-150 hover:scale-125 sm:right-5"
            >
              ›
            </button>
          ) : null}

          {images.length > 1 ? (
            <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white/80">
              {active + 1} / {images.length}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
