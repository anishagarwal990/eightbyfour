"use client";

import { useState } from "react";
import type { ProductRow } from "@/lib/supabase/types";
import { QuoteRequestForm } from "@/components/QuoteRequestForm";
import { Button } from "@/components/ui/Button";
import { resolvePrice, unitLabel } from "@/lib/pricing";

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
                From ₹{price.min} – ₹{price.max}/{unitLabel(price.unit)}
              </>
            ) : (
              <>
                Starting From ₹{price.amount}/{unitLabel(price.unit)}
              </>
            )}
          </p>
        ) : (
          <p className="text-sm font-medium" style={{ color: "var(--burgundy)" }}>
            Price: Available on Request
          </p>
        )}
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
