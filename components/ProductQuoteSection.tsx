"use client";

import { useState } from "react";
import type { ProductRow } from "@/lib/supabase/types";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { VariantPicker } from "@/components/VariantPicker";
import { Button } from "@/components/ui/Button";
import { resolvePrice, unitLabel, parseVariants, firstSize, firstThickness } from "@/lib/pricing";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { productDisplayName } from "@/lib/productDisplay";

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
      className="flex flex-col gap-5 rounded-2xl border p-6 shadow-[var(--shadow-md)]"
      style={{
        borderColor: "color-mix(in srgb, var(--burgundy) 20%, var(--line))",
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
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div>
          {price ? (
            <p className="serif" style={{ fontSize: "var(--fs-h2)", lineHeight: "var(--lh-tight)", color: "var(--burgundy)" }}>
              {price.kind === "range" ? (
                <>
                  ₹{price.min}–{price.max}
                  <span className="text-base font-normal" style={{ color: "var(--line-strong)" }}>
                    /{unitLabel(price.unit)}
                  </span>
                </>
              ) : (
                <>
                  ₹{price.amount}
                  <span className="text-base font-normal" style={{ color: "var(--line-strong)" }}>
                    /{unitLabel(price.unit)}
                  </span>
                </>
              )}
            </p>
          ) : (
            <p className="serif" style={{ fontSize: "var(--fs-h2)", lineHeight: "var(--lh-tight)", color: "var(--burgundy)" }}>
              Price on Request
            </p>
          )}
          <p className="mt-1.5 text-xs" style={{ color: "var(--line-strong)" }}>
            Receive a personalized commercial quotation in under 15 minutes.
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Button type="button" variant="primary" onClick={() => setExpanded(true)}>
            Request a Quote
          </Button>
          <a
            href={buildWhatsAppUrl(`Hi, I'm interested in ${productDisplayName(product)}. Can you share pricing and availability?`)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs underline"
            style={{ color: "var(--line-strong)" }}
          >
            Ask on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
