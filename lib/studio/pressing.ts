import { BALANCING_LAMINATES, PRESS_BOARDS, PRESS_LAMINATES } from "./catalogue";
import type { Quote, QuoteGroup, QuoteLine } from "./types";

/**
 * Laminate pressing — the most literal connection between the shop and the
 * studio. The customer is already buying a board and a laminate; this prices
 * the third thing, which is putting them together properly under a press
 * before they reach a site.
 *
 * The output is deliberately a per-finished-panel price as well as a total:
 * it is the number a carpenter compares against pressing it himself.
 */

export type PressSides = "single" | "double";

export interface PressConfig {
  boardId: string;
  frontLaminateId: string;
  backLaminateId: string;
  sides: PressSides;
  quantity: number;
  /** Cut the pressed sheet down to panel sizes before delivery. */
  cutToSize: boolean;
  /** Apply edge banding to the cut panels. */
  edgeBand: boolean;
}

export const DEFAULT_PRESS_CONFIG: PressConfig = {
  boardId: "bwp-ply-19",
  frontLaminateId: "gl-5347",
  backLaminateId: "bal-08",
  sides: "double",
  quantity: 10,
  cutToSize: false,
  edgeBand: false,
};

const PRESS_RATE_PER_SIDE = 340; // hot press, per 8×4 sheet face
const ADHESIVE_PER_SIDE = 190;
const CUT_RATE = 26; // ₹ per linear ft of cut
const CUTS_PER_SHEET = 28; // typical linear ft of cutting to break a sheet into panels
const BAND_RATE = 42; // ₹ per running ft
const BAND_FT_PER_SHEET = 34;
const DELIVERY_BASE = 1600;
const DELIVERY_PER_SHEET = 140;

export function pricePressing(config: PressConfig): Quote {
  const board = PRESS_BOARDS.find((b) => b.id === config.boardId) ?? PRESS_BOARDS[0];
  const front = PRESS_LAMINATES.find((l) => l.id === config.frontLaminateId) ?? PRESS_LAMINATES[0];
  const backOption = BALANCING_LAMINATES.find((l) => l.id === config.backLaminateId) ?? BALANCING_LAMINATES[0];
  // "Same as front" is priced at the front laminate's own rate.
  const back = backOption.rate === 0 ? { ...backOption, rate: front.rate, brand: front.brand, code: front.code } : backOption;

  const qty = Math.max(1, Math.round(config.quantity));
  const sideCount = config.sides === "double" ? 2 : 1;

  const materialLines: QuoteLine[] = [
    {
      label: `${board.brand} ${board.label}`,
      detail: `${board.thickness} · ${qty} sheets × ₹${board.rate.toLocaleString("en-IN")}`,
      amount: qty * board.rate,
      catalogueHref: board.catalogue,
    },
    {
      label: `${front.brand} ${front.label} — front face`,
      detail: `${front.code} · ${front.thickness} · ${qty} sheets × ₹${front.rate.toLocaleString("en-IN")}`,
      amount: qty * front.rate,
      catalogueHref: "/products/laminates",
    },
  ];

  if (sideCount === 2) {
    materialLines.push({
      label: `${back.brand} ${back.label} — back face`,
      detail: `${back.code} · ${back.thickness} · ${qty} sheets × ₹${back.rate.toLocaleString("en-IN")}`,
      amount: qty * back.rate,
      catalogueHref: "/products/laminates",
    });
  }

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
    { key: "materials", label: "Materials", lines: materialLines, subtotal: 0 },
    { key: "fabrication", label: "Pressing", lines: fabricationLines, subtotal: 0 },
    { key: "delivery", label: "Delivery", lines: deliveryLines, subtotal: 0 },
  ] satisfies QuoteGroup[]).map((g) => ({ ...g, subtotal: g.lines.reduce((s, l) => s + l.amount, 0) }));

  const total = groups.reduce((s, g) => s + g.subtotal, 0);

  return {
    title: `${qty} × pressed panel — ${board.thickness} ${board.brand} ${board.label}`,
    spec: [
      `${board.brand} ${board.label} ${board.thickness}`,
      `Front: ${front.brand} ${front.code}`,
      sideCount === 2 ? `Back: ${back.brand} ${back.code}` : "Single side",
      `${qty} sheets, 8′ × 4′`,
      config.cutToSize ? "Cut to size" : "Full sheets",
      config.edgeBand ? "Edge banded" : "No banding",
    ],
    groups,
    total,
    rate: { amount: Math.round(total / qty), unit: "per finished sheet" },
  };
}

/** What the same board would cost unpressed — the honest comparison. */
export function boardOnlyTotal(config: PressConfig): number {
  const board = PRESS_BOARDS.find((b) => b.id === config.boardId) ?? PRESS_BOARDS[0];
  return Math.max(1, Math.round(config.quantity)) * board.rate;
}
