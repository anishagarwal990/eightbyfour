"use client";

import { useState } from "react";
import type { ProductRow } from "@/lib/supabase/types";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { VariantPicker } from "@/components/VariantPicker";
import { Button, buttonClasses } from "@/components/ui/Button";
import { resolvePrice, unitLabel, parseVariants, firstSize, firstThickness } from "@/lib/pricing";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { productDisplayName } from "@/lib/productDisplay";

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M6.5 17.5 5 20l2.6-1.4A8 8 0 1 0 5 12a7.9 7.9 0 0 0 1.5 4.6Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 9.8c.2-.5.4-.5.7-.5h.5c.2 0 .4 0 .6.4l.6 1.4c.1.2 0 .4-.1.5l-.5.6c-.1.2-.1.3 0 .5.4.7 1.3 1.6 2 2 .2.1.3.1.5 0l.6-.5c.2-.1.3-.2.5-.1l1.4.6c.3.2.3.4.3.6-.1.5-.7 1-1.2 1.1-.8.2-1.6.1-3.2-.6-1.9-.9-3.1-2.8-3.2-3-.1-.1-.9-1.2-.9-2.3 0-.2 0-.4.1-.7Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function ProductQuoteSection({ product }: { product: ProductRow }) {
  const [expanded, setExpanded] = useState(false);
  const variants = parseVariants(product.variants);

  const defaultCore = variants?.cores[0];
  const defaultSize = defaultCore ? firstSize(defaultCore) : undefined;
  const defaultThickness = defaultSize ? firstThickness(defaultSize) : undefined;

  const [coreKey, setCoreKey] = useState(defaultCore?.key ?? "");
  const [sizeKey, setSizeKey] = useState(defaultSize?.key ?? "");
  const [thicknessKey, setThicknessKey] = useState(defaultThickness?.key ?? "");

  const selectedCore = variants?.cores.find((c) => c.key === coreKey) ?? defaultCore;
  const selectedSize = selectedCore?.sizes.find((s) => s.key === sizeKey) ?? defaultSize;
  const selectedThickness = selectedSize?.thicknesses.find((t) => t.key === thicknessKey) ?? defaultThickness;

  if (expanded) {
    return (
      <QuoteRequestForm
        product={product}
        variantSelection={
          variants && selectedCore && selectedSize && selectedThickness
            ? {
                summary: `${selectedCore.label} · ${selectedSize.label} · ${selectedThickness.label}`,
                thickness: selectedThickness.label,
                price: selectedThickness.price,
                unit: variants.unit,
              }
            : undefined
        }
      />
    );
  }

  const price = variants && selectedThickness ? { kind: "single" as const, amount: selectedThickness.price, unit: variants.unit, cashbackPct: null } : resolvePrice(product);

  return (
    <div
      className="flex flex-col gap-5 rounded-2xl p-6 shadow-[var(--shadow-md)]"
      style={{
        background: "linear-gradient(135deg, color-mix(in srgb, var(--burgundy) 6%, var(--paper)), var(--paper))",
      }}
    >
      {variants && selectedCore && selectedSize ? (
        <VariantPicker
          variants={variants}
          coreKey={selectedCore.key}
          sizeKey={selectedSize.key}
          thicknessKey={thicknessKey}
          onChange={(next) => {
            setCoreKey(next.coreKey);
            setSizeKey(next.sizeKey);
            setThicknessKey(next.thicknessKey);
          }}
        />
      ) : null}
      <div
        className={variants ? "flex flex-col gap-4 border-t pt-5" : "flex flex-col gap-4"}
        style={{ borderColor: "var(--line)" }}
      >
        <div>
          <p className="tracked-caps text-[11px] font-medium" style={{ color: "color-mix(in srgb, var(--burgundy) 75%, var(--ink))" }}>
            Your Price
          </p>
          {price ? (
            <p
              className="serif mt-1 [font-variant-numeric:tabular-nums]"
              style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-tight)", color: "var(--burgundy)" }}
            >
              {price.kind === "range" ? (
                <>₹{price.min}–{price.max}</>
              ) : (
                <>
                  <span className="text-lg font-normal" style={{ color: "var(--line-strong)" }}>
                    From{" "}
                  </span>
                  ₹{price.amount}
                </>
              )}
              <span className="ml-1.5 text-sm font-normal" style={{ color: "var(--line-strong)" }}>
                /{unitLabel(price.unit)}
              </span>
            </p>
          ) : (
            <p className="serif mt-1" style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-tight)", color: "var(--burgundy)" }}>
              Price on Request
            </p>
          )}
          <p className="mt-1.5 text-xs" style={{ color: "var(--line-strong)" }}>
            Receive a personalized commercial quotation in under 15 minutes.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button type="button" variant="primary" onClick={() => setExpanded(true)} className="w-full">
            Request a Quote
          </Button>
          <a
            href={buildWhatsAppUrl(`Hi, I'm interested in ${productDisplayName(product)}. Can you share pricing and availability?`)}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("secondary", "md", "w-full")}
          >
            <WhatsAppIcon />
            WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
