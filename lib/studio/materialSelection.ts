import { inr } from "./format.ts";

/**
 * What a Studio material picker returns — a real catalogue product with a
 * chosen thickness, a hand-entered material, or (for a back face) "same as the
 * front". Kept out of the picker component so pure pricing code can import the
 * type without pulling a client component into the bundle.
 */
export type MaterialSelection =
  | {
      kind: "catalogue";
      slug: string;
      name: string;
      brand: string;
      /** One-line label for the collapsed state and the quote. */
      label: string;
      thickness: string | null;
      sheetPrice: { amount: number; from: boolean } | null;
      href: string;
    }
  | { kind: "manual"; brand: string; code: string; finish: string }
  | { kind: "same-as-front" };

export function selectionLabel(s: MaterialSelection | null): string {
  if (!s) return "Not chosen";
  if (s.kind === "same-as-front") return "Same as the front";
  if (s.kind === "manual") return [s.brand, s.code, s.finish].filter(Boolean).join(" · ") || "Entered manually";
  return s.label;
}

export function selectionPriceNote(s: MaterialSelection | null): string {
  if (!s || s.kind === "same-as-front") return "";
  if (s.kind === "manual") return "Rate confirmed on your order";
  if (!s.sheetPrice) return "Rate on request";
  return `${s.sheetPrice.from ? "from " : ""}${inr(s.sheetPrice.amount)} per sheet`;
}

/** The per-sheet rupee figure to bill, or null when it must be confirmed later. */
export function selectionSheetPrice(s: MaterialSelection | null): number | null {
  if (!s || s.kind !== "catalogue") return null;
  return s.sheetPrice ? s.sheetPrice.amount : null;
}
