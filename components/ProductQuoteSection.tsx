"use client";

import { useState } from "react";
import type { ProductRow } from "@/lib/supabase/types";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { Button } from "@/components/ui/Button";

type PriceInfo =
  | { kind: "single"; amount: number; unit: string; cashbackPct: number | null }
  | { kind: "range"; min: number; max: number; unit: string; cashbackPct: number | null };

function resolvePrice(product: ProductRow): PriceInfo | null {
  const table = product.price_table;
  if (!table || typeof table !== "object") return null;
  const t = table as { starting_price?: unknown; min_price?: unknown; max_price?: unknown; unit?: unknown; cashback_pct?: unknown };
  const unit = typeof t.unit === "string" ? t.unit : "sqft";
  const cashbackPct = typeof t.cashback_pct === "number" ? t.cashback_pct : null;
  if (typeof t.min_price === "number" && typeof t.max_price === "number") {
    return { kind: "range", min: t.min_price, max: t.max_price, unit, cashbackPct };
  }
  if (typeof t.starting_price === "number") {
    return { kind: "single", amount: t.starting_price, unit, cashbackPct };
  }
  return null;
}

function unitLabel(unit: string): string {
  return unit === "sqft" ? "sq.ft" : unit;
}

export function ProductQuoteSection({ product }: { product: ProductRow }) {
  const [expanded, setExpanded] = useState(false);

  if (expanded) return <QuoteRequestForm product={product} />;

  const price = resolvePrice(product);

  return (
    <div
      className="flex items-center justify-between gap-4 rounded-sm border p-5"
      style={{ borderColor: "var(--line)", background: "var(--card)" }}
    >
      <div>
        {price ? (
          <p className="text-sm font-medium" style={{ color: "var(--burgundy)" }}>
            {price.kind === "range" ? (
              <>
                ₹{price.min} – ₹{price.max}/{unitLabel(price.unit)}
              </>
            ) : (
              <>
                Starting From ₹{price.amount}/{unitLabel(price.unit)}
              </>
            )}{" "}
            <span className="text-[10px] font-normal opacity-50">excl. GST</span>
          </p>
        ) : (
          <p className="text-sm font-medium" style={{ color: "var(--burgundy)" }}>
            Price: Available on Request
          </p>
        )}
        {price?.cashbackPct ? (
          <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--accent)" }}>
            Instant cashback up to {price.cashbackPct}%
          </p>
        ) : null}
        <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
          Receive a personalized commercial quotation in under 15 minutes.
        </p>
      </div>
      <Button type="button" variant="primary" className="shrink-0" onClick={() => setExpanded(true)}>
        Request a Quote
      </Button>
    </div>
  );
}
