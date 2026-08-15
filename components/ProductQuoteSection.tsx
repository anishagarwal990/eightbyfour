"use client";

import { useState } from "react";
import type { ProductRow } from "@/lib/supabase/types";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { Button } from "@/components/ui/Button";
import { resolvePrice, unitLabel } from "@/lib/pricing";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { productDisplayName } from "@/lib/productDisplay";

export function ProductQuoteSection({ product }: { product: ProductRow }) {
  const [expanded, setExpanded] = useState(false);

  if (expanded) return <QuoteRequestForm product={product} />;

  const price = resolvePrice(product);

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border p-6 shadow-[var(--shadow-md)]"
      style={{
        borderColor: "color-mix(in srgb, var(--burgundy) 20%, var(--line))",
        background: "linear-gradient(135deg, color-mix(in srgb, var(--burgundy) 6%, var(--paper)), var(--paper))",
      }}
    >
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
  );
}
