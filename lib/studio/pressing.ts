import type { MaterialSelection } from "./materialSelection.ts";
import { selectionLabel, selectionSheetPrice } from "./materialSelection.ts";
import type { Quote, QuoteGroup, QuoteLine } from "./types.ts";

/**
 * Laminate pressing — the most literal connection between the shop and the
 * studio. The customer is already buying a board and a laminate; this prices
 * the third thing, which is putting them together properly under a press
 * before they reach a site.
 *
 * The board and both laminates are now real catalogue selections
 * (MaterialSelection), not ids into a hand-picked list. A selection can carry
 * a per-sheet rate, carry none ("rate on request"), or be entered by hand —
 * the last two produce a ₹0 material line and a `pendingNote` on the quote so
 * the total is never read as final.
 *
 * The output is a per-finished-panel price as well as a total: it is the
 * number a carpenter compares against pressing it himself.
 */

export type PressSides = "single" | "double";

/**
 * Where the board and laminate come from.
 *  - "eightbyfour": priced as material lines on the quote.
 *  - "own": the customer brings both to the workshop. Only the press work,
 *    the press-grade adhesive, any trimming and delivery are charged.
 */
export type PressMaterialSource = "eightbyfour" | "own";

export interface PressConfig {
  board: MaterialSelection;
  frontLaminate: MaterialSelection;
  /** May be `{ kind: "same-as-front" }`. */
  backLaminate: MaterialSelection;
  sides: PressSides;
  quantity: number;
  /** Cut the pressed sheet down to panel sizes before delivery. */
  cutToSize: boolean;
  /** Apply edge banding to the cut panels. */
  edgeBand: boolean;
  materialSource: PressMaterialSource;
}

export const DEFAULT_PRESS_CONFIG: PressConfig = {
  board: {
    kind: "catalogue",
    slug: "century-sainik-710-ply",
    name: "Century Sainik 710",
    brand: "Century",
    label: "Century · Century Sainik 710 · 19mm",
    thickness: "19mm",
    sheetPrice: { amount: Math.round(43 * 32), from: true },
    href: "/products/century-sainik-710-ply",
  },
  frontLaminate: {
    kind: "catalogue",
    slug: "merino-14603-huron-lowa-walnut",
    name: "Merino Huron Lowa Walnut",
    brand: "Merino",
    label: "Merino · Huron Lowa Walnut",
    thickness: "1 mm",
    sheetPrice: { amount: 1300, from: false },
    href: "/products/merino-14603-huron-lowa-walnut",
  },
  backLaminate: { kind: "same-as-front" },
  sides: "double",
  quantity: 10,
  cutToSize: false,
  edgeBand: false,
  materialSource: "eightbyfour",
};

const PRESS_RATE_PER_SIDE = 340; // hot press, per 8×4 sheet face
const ADHESIVE_PER_SIDE = 190;
const CUT_RATE = 26; // ₹ per linear ft of cut
const CUTS_PER_SHEET = 28; // typical linear ft of cutting to break a sheet into panels
const BAND_RATE = 42; // ₹ per running ft
const BAND_FT_PER_SHEET = 34;
const DELIVERY_BASE = 1600;
const DELIVERY_PER_SHEET = 140;

/** Resolve a "same as front" back-laminate to the actual front selection. */
function resolveBack(config: PressConfig): MaterialSelection {
  return config.backLaminate.kind === "same-as-front" ? config.frontLaminate : config.backLaminate;
}

export function pricePressing(config: PressConfig): Quote {
  const qty = Math.max(1, Math.round(config.quantity));
  const sideCount = config.sides === "double" ? 2 : 1;
  const ownMaterial = config.materialSource === "own";
  const back = resolveBack(config);

  const materialLines: QuoteLine[] = [];
  let pending = false;

  if (!ownMaterial) {
    const faces: { role: string; sel: MaterialSelection }[] = [
      { role: "board", sel: config.board },
      { role: "front face", sel: config.frontLaminate },
      ...(sideCount === 2 ? [{ role: "back face", sel: back }] : []),
    ];

    for (const { role, sel } of faces) {
      const rate = selectionSheetPrice(sel);
      const noun = role === "board" ? "" : ` — ${role}`;
      if (rate === null) {
        pending = true;
        materialLines.push({
          label: `${selectionLabel(sel)}${noun}`,
          detail: `${qty} sheets · rate confirmed on your order`,
          amount: 0,
          catalogueHref: catalogueHrefOf(sel),
        });
      } else {
        // A board's catalogue rate is a per-sq-ft range across its thicknesses,
        // so the sheet figure is the bottom of that range — "from", and
        // confirmed for the actual thickness on the order.
        const isFrom = sel.kind === "catalogue" && sel.sheetPrice?.from === true;
        materialLines.push({
          label: `${selectionLabel(sel)}${noun}`,
          detail: `${qty} sheets × ${isFrom ? "from " : ""}₹${rate.toLocaleString("en-IN")}${isFrom ? " — confirmed for your thickness" : ""}`,
          amount: qty * rate,
          catalogueHref: catalogueHrefOf(sel),
        });
      }
    }
  }

  // Press-grade adhesive is applied in the workshop under controlled spread
  // and open time — part of the press, not something the customer brings.
  materialLines.push({
    label: "Press-grade adhesive",
    detail: `${qty * sideCount} faces × ₹${ADHESIVE_PER_SIDE}`,
    amount: qty * sideCount * ADHESIVE_PER_SIDE,
    catalogueHref: "/products/adhesive",
  });

  const fabricationLines: QuoteLine[] = [
    {
      label: config.sides === "double" ? "Double-side pressing" : "Single-side pressing",
      detail: `${qty * sideCount} faces × ₹${PRESS_RATE_PER_SIDE} — hot press, trimmed`,
      amount: qty * sideCount * PRESS_RATE_PER_SIDE,
    },
  ];

  if (config.cutToSize) {
    fabricationLines.push({
      label: "Cut to panel sizes",
      detail: `${qty} sheets × ~${CUTS_PER_SHEET} ft of cut × ₹${CUT_RATE}`,
      amount: Math.round(qty * CUTS_PER_SHEET * CUT_RATE),
    });
  }

  if (config.edgeBand) {
    fabricationLines.push({
      label: "Edge banding",
      detail: `${qty} sheets × ~${BAND_FT_PER_SHEET} running ft × ₹${BAND_RATE}`,
      amount: Math.round(qty * BAND_FT_PER_SHEET * BAND_RATE),
    });
  }

  const deliveryLines: QuoteLine[] = [
    { label: "Delivery within Hyderabad", detail: `${qty} pressed sheets`, amount: DELIVERY_BASE + qty * DELIVERY_PER_SHEET },
  ];

  const groups: QuoteGroup[] = ([
    { key: "materials", label: ownMaterial ? "Consumables" : "Materials", lines: materialLines, subtotal: 0 },
    { key: "fabrication", label: "Pressing", lines: fabricationLines, subtotal: 0 },
    { key: "delivery", label: "Delivery", lines: deliveryLines, subtotal: 0 },
  ] satisfies QuoteGroup[]).map((g) => ({ ...g, subtotal: g.lines.reduce((s, l) => s + l.amount, 0) }));

  const total = groups.reduce((s, g) => s + g.subtotal, 0);
  const boardLabel = selectionLabel(config.board);

  return {
    title: ownMaterial
      ? `${qty} × pressing — ${config.sides} side`
      : `${qty} × pressed panel — ${boardLabel}`,
    spec: [
      ownMaterial ? "Board & laminate supplied by you" : `Board: ${boardLabel}`,
      ownMaterial ? "" : `Front: ${selectionLabel(config.frontLaminate)}`,
      sideCount === 2 ? (ownMaterial ? "Double side" : `Back: ${selectionLabel(back)}`) : "Single side",
      `${qty} sheets, 8′ × 4′`,
      config.cutToSize ? "Cut to size" : "Full sheets",
      config.edgeBand ? "Edge banded" : "No banding",
    ].filter(Boolean),
    groups,
    total,
    rate: { amount: Math.round(total / qty), unit: ownMaterial ? "per sheet pressed" : "per finished sheet" },
    pendingNote: pending
      ? "One or more chosen materials have no rate on file — those lines are ₹0 here and confirmed on your order."
      : undefined,
  };
}

function catalogueHrefOf(sel: MaterialSelection): string | undefined {
  return sel.kind === "catalogue" ? sel.href : undefined;
}

/**
 * What the same board would cost unpressed — the honest comparison shown in
 * the bundle flow. Meaningless when the customer supplies the board or the
 * board has no rate, so it returns 0 and the UI drops the comparison.
 */
export function boardOnlyTotal(config: PressConfig): number {
  if (config.materialSource === "own") return 0;
  const rate = selectionSheetPrice(config.board);
  if (rate === null) return 0;
  return Math.max(1, Math.round(config.quantity)) * rate;
}
