"use client";

import { toggleRequirement, useRequirement } from "@/lib/requirement";
import { SaveIcon } from "@/components/icons/SaveIcon";
import { trackEvent } from "@/lib/analytics";

/**
 * The catalogue-side half of the Requirement. Without this, a visitor can
 * browse 3,184 SKUs and still have no way to hand us the four they want as one
 * list — which is exactly what the old bookmark-only "Save" did.
 */
export function AddToRequirementButton({
  productId,
  productName,
  className,
}: {
  productId: number;
  productName?: string;
  className?: string;
}) {
  // Subscribing to the whole requirement (rather than a boolean) keeps this in
  // sync when the line is removed from the requirement page in another tab.
  const lines = useRequirement();
  const active = lines.some((l) => l.productId === productId);

  return (
    <button
      type="button"
      aria-label={active ? `Remove ${productName ?? "product"} from your requirement` : `Add ${productName ?? "product"} to your requirement`}
      aria-pressed={active}
      title={active ? "In your requirement" : "Add to requirement"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleRequirement(productId);
        if (added) trackEvent("add_to_requirement", { product_id: productId, product_name: productName });
      }}
      className={`inline-flex h-9 w-9 items-center justify-center transition-colors duration-150 ${className ?? ""}`}
      style={{
        borderRadius: "var(--radius-xs)",
        background: active ? "var(--brand-primary)" : "rgba(255,255,255,0.92)",
        color: active ? "var(--brand-on-primary)" : "var(--text-primary)",
        boxShadow: "0 1px 2px rgba(26,25,23,0.14)",
      }}
    >
      <SaveIcon filled={active} />
    </button>
  );
}
