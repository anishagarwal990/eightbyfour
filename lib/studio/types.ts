/**
 * Studio EightxFour — the fabrication / installation / execution layer.
 *
 * Everything a service page needs to exist is declared here rather than
 * hardcoded into a page component, so adding "Glass & Mirror Fabrication" or
 * "Door Installation" later is a data change, not a new page tree.
 */

/** How a customer can start a service. Configuration is always primary. */
export type EntryMode = "configure" | "upload" | "assist";

export interface ServiceEntry {
  mode: EntryMode;
  label: string;
  /** One line under the label — what actually happens when they click. */
  detail: string;
  href: string;
}

export interface StudioService {
  slug: string;
  /** Two-digit index shown as an editorial rule number on cards. */
  index: string;
  name: string;
  /** Nav label — shorter than `name` where the full name wraps. */
  navLabel: string;
  /** The single sentence that has to land in under three seconds. */
  tagline: string;
  description: string;
  /** Concrete things this service makes. Shown as a spec list, not marketing. */
  scope: string[];
  /** Material categories on the EightByFour side that feed this service. */
  feedsFrom: string[];
  entries: ServiceEntry[];
  /** False while the configurator is still being built — page still ships. */
  hasConfigurator: boolean;
  /** Indicative starting rate, shown with its unit, never as a total. */
  fromRate?: { amount: number; unit: string };
}

/** A priced line inside a quote. Materials keep their brand and their maths. */
export interface QuoteLine {
  label: string;
  /** e.g. "7 sheets × ₹3,240" — the arithmetic stays visible. */
  detail?: string;
  amount: number;
  /** Set on material lines that map to a real EightByFour catalogue category. */
  catalogueHref?: string;
}

export type QuoteGroupKey = "materials" | "fabrication" | "installation" | "delivery";

export interface QuoteGroup {
  key: QuoteGroupKey;
  label: string;
  lines: QuoteLine[];
  subtotal: number;
}

export interface Quote {
  /** e.g. "Wardrobe — 8′ × 8′ × 2′" */
  title: string;
  /** Human-readable specification, one chip per decision. */
  spec: string[];
  groups: QuoteGroup[];
  total: number;
  /** Per-unit-of-measure rate, for comparison across configurations. */
  rate?: { amount: number; unit: string };
}
