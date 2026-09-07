/**
 * Render a wardrobe estimate as the shared Quote shape.
 *
 * QuotePanel is the signature Studio component and every configurator feeds
 * it, so the wardrobe estimate is translated rather than given its own panel.
 * Only `publicGroups` is read — the internal buckets (margin, miscellaneous)
 * never reach the customer through this path.
 */

import { inr } from "../format.ts";
import type { Quote, QuoteGroup, QuoteGroupKey } from "../types.ts";
import { CARCASS_MATERIALS, HARDWARE_PACKAGES, SHUTTER_CORES, SHUTTER_FINISHES } from "./config.ts";
import type { WardrobeEstimate, WardrobeEstimateInput } from "./types.ts";

export function toQuote(
  estimate: WardrobeEstimate,
  input: WardrobeEstimateInput,
  title: string
): Quote {
  const carcass = CARCASS_MATERIALS.find((m) => m.id === input.carcassMaterialId);
  const core = SHUTTER_CORES.find((c) => c.id === input.shutterCoreId);
  const finish = SHUTTER_FINISHES.find((f) => f.id === input.shutterFinishId);
  const hardware = HARDWARE_PACKAGES.find((h) => h.id === input.hardwarePackageId);

  const spec = [
    `${round(input.widthFt)}′ W × ${round(input.heightFt)}′ H × ${round(input.depthFt)}′ D`,
    input.buildMethod === "carpenter" ? "Carpenter made" : "Factory made",
    carcass ? `${carcass.label} carcass` : null,
    estimate.carcassFinish.includedBecausePrelaminated ? "Pre-finished board" : "Laminate finish",
    input.shutterSystem === "board"
      ? [core?.label, finish && !finish.isPrelam ? finish.label : null].filter(Boolean).join(" + ")
      : "Aluminium + glass shutters",
    hardware ? `${hardware.label} hardware` : null,
  ].filter((x): x is string => Boolean(x));

  const groups: QuoteGroup[] = estimate.publicGroups.map((g) => ({
    key: g.key as QuoteGroupKey,
    label: g.label,
    subtotal: g.total,
    lines: (g.lines ?? [{ label: g.label, total: g.total }]).map((l) => ({
      label: l.label,
      detail: l.detail,
      amount: l.total,
      catalogueHref: g.key === "materials" ? carcass?.catalogueHref : undefined,
    })),
  }));

  return {
    title,
    spec,
    groups,
    total: estimate.finalTotal,
    rate: { amount: Math.round(estimate.finalRatePerSqft), unit: "per sq ft of elevation" },
  };
}

const round = (n: number) => (Number.isInteger(n) ? n : Math.round(n * 10) / 10);

/** Short honesty line. Shown wherever a number is. */
export function indicativeNote(estimate: WardrobeEstimate): string {
  return estimate.hasAssumedRates
    ? "Indicative from your current selections. Final dimensions and live material rates are confirmed before production."
    : "Indicative from your current selections. Final dimensions are confirmed on site before production.";
}

void inr;
