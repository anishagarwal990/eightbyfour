// Enquiry OS — shared domain model.
//
// One place that decides what a status/source/priority is called, so the
// inbox, the detail page, the filters and the server actions can never
// disagree. Values here must stay in sync with the CHECK constraints in
// supabase/enquiry-os-slice1.sql.

export const ENQUIRY_STATUSES = [
  "NEW",
  "REQUIREMENT_VERIFIED",
  "PRICING",
  "QUOTE_READY",
  "QUOTE_SENT",
  "NEGOTIATION",
  "AWAITING_CUSTOMER",
  "AWAITING_SUPPLIER",
  "WON",
  "LOST",
  "ON_HOLD",
] as const;

export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  REQUIREMENT_VERIFIED: "Requirement verified",
  PRICING: "Pricing",
  QUOTE_READY: "Quote ready",
  QUOTE_SENT: "Quote sent",
  NEGOTIATION: "Negotiation",
  AWAITING_CUSTOMER: "Awaiting customer",
  AWAITING_SUPPLIER: "Awaiting supplier",
  WON: "Won",
  LOST: "Lost",
  ON_HOLD: "On hold",
};

// Pre-migration rows carried a lowercase 'new'; the CHECK constraint still
// allows it so a cached copy of the old website bundle can't 500 on a real
// customer. Everything reading a status goes through here.
export function normalizeStatus(raw: string | null | undefined): EnquiryStatus {
  const upper = (raw ?? "NEW").toUpperCase();
  return (ENQUIRY_STATUSES as readonly string[]).includes(upper) ? (upper as EnquiryStatus) : "NEW";
}

export function statusLabel(raw: string | null | undefined): string {
  return STATUS_LABELS[normalizeStatus(raw)];
}

/** Tone for the status pill. Deliberately three buckets, not eleven colours. */
export function statusTone(raw: string | null | undefined): "open" | "won" | "lost" | "idle" {
  const status = normalizeStatus(raw);
  if (status === "WON") return "won";
  if (status === "LOST") return "lost";
  if (status === "ON_HOLD") return "idle";
  return "open";
}

export const ENQUIRY_SOURCES = ["WHATSAPP", "WEBSITE", "PHONE", "WALK_IN", "REFERRAL", "OTHER"] as const;
export type EnquirySource = (typeof ENQUIRY_SOURCES)[number];

const SOURCE_LABELS: Record<EnquirySource, string> = {
  WHATSAPP: "WhatsApp",
  WEBSITE: "Website",
  PHONE: "Phone",
  WALK_IN: "Walk-in",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export function sourceLabel(raw: string | null | undefined): string {
  if (!raw) return "—";
  const upper = raw.toUpperCase();
  return (SOURCE_LABELS as Record<string, string>)[upper] ?? raw;
}

export const ENQUIRY_PRIORITIES = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type EnquiryPriority = (typeof ENQUIRY_PRIORITIES)[number];

export const LOST_REASONS = [
  "PRICE",
  "NO_RESPONSE",
  "COMPETITOR",
  "AVAILABILITY",
  "DELIVERY_TIMELINE",
  "REQUIREMENT_CANCELLED",
  "OTHER",
] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  PRICE: "Price",
  NO_RESPONSE: "No response",
  COMPETITOR: "Competitor",
  AVAILABILITY: "Availability",
  DELIVERY_TIMELINE: "Delivery timeline",
  REQUIREMENT_CANCELLED: "Requirement cancelled",
  OTHER: "Other",
};

/** Units staff actually type. Free text is still accepted — this is the quick list. */
export const ENQUIRY_UNITS = ["sheets", "nos", "sqft", "sqm", "kg", "litres", "packs", "rft", "sets"] as const;

export interface RequirementSpec {
  category: string | null;
  material: string | null;
  requested_brand: string | null;
  requested_product: string | null;
  thickness: string | null;
  size: string | null;
  grade: string | null;
  finish: string | null;
  quantity: number | null;
  unit: string | null;
}

/**
 * Whether a requirement line is specific enough to price without going back to
 * the customer: a quantity, a unit, and something that actually *specifies*
 * the material.
 *
 * The subtlety is the thickness column, which staff use as a catch-all ("19mm"
 * on one line, "Liner" on the next). A dimensional value there is a real spec;
 * a bare word is only a name, and a name alone cannot be priced — which liner,
 * in what material, at what thickness? So a non-dimensional thickness has to be
 * backed by a product, brand, category or material before the line counts as
 * complete.
 *
 *   "19mm"  x 45 sheets                  -> complete   (dimensional)
 *   "Liner" x 50 sheets                  -> INCOMPLETE (name only)
 *   "Liner" x 50 sheets, material "HDF"  -> complete
 *
 * The system flags the gap; it never fills it in. This is the suggested
 * default only — `specification_complete` is stored per row so staff can
 * override either way once they have spoken to the customer.
 */
export function isSpecificationComplete(item: RequirementSpec): boolean {
  const hasQuantity = item.quantity !== null && item.quantity > 0;
  const hasUnit = !!item.unit?.trim();
  // A digit is what separates "19mm" / "0.8" / "8x4" from "Liner".
  const dimensionalThickness = /\d/.test(item.thickness ?? "");
  const namedElsewhere = Boolean(
    item.requested_product?.trim() || item.category?.trim() || item.material?.trim() || item.requested_brand?.trim()
  );
  return hasQuantity && hasUnit && (dimensionalThickness || namedElsewhere);
}

/** Human summary of a requirement line for dense table cells. */
export function requirementLabel(item: RequirementSpec & { notes?: string | null }): string {
  const head = [item.thickness, item.requested_product, item.material, item.category].find((v) => v?.trim());
  return (head || item.notes || "Unspecified").trim();
}

/**
 * Reference for a staff-created enquiry: ENQ-<base36 time><random>, uppercase.
 * Distinct prefix from the website form's QUOTE-/REF- refs so the origin of a
 * reference is readable without a lookup, and long enough that two people
 * creating enquiries in the same second can't collide.
 */
export function generateEnquiryRef(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `ENQ-${stamp}${rand}`;
}

/** Whole days since `iso`, for the inbox "Age" column. */
export function ageInDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

export function isOverdue(dueAt: string | null | undefined): boolean {
  return !!dueAt && new Date(dueAt).getTime() < Date.now();
}

/** Quick-pick follow-up offsets, in days. `null` means "pick a date". */
export const FOLLOWUP_PRESETS: { label: string; days: number | null }[] = [
  { label: "Today", days: 0 },
  { label: "Tomorrow", days: 1 },
  { label: "2 days", days: 2 },
  { label: "3 days", days: 3 },
  { label: "Custom", days: null },
];

/**
 * 10:00 local on the target day, as a `YYYY-MM-DDTHH:mm` wall-clock string —
 * a follow-up due "today" means this morning's call list, not this instant.
 *
 * Deliberately NOT toISOString(): that converts to UTC, and a `datetime-local`
 * input reads its value as local wall-clock. Feeding it UTC shifted every
 * preset by the timezone offset — "Tomorrow" rendered as 04:30 in IST instead
 * of 10:00. The value is parsed back as local time on submit, which is what
 * turns it into the correct instant.
 */
export function followupDateFor(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const IMAGE_TYPES = /^image\//;
const SPREADSHEET_TYPES = /(spreadsheet|excel|csv)/i;
const DOC_TYPES = /(word|document|text\/plain)/i;

export type AttachmentKind = "IMAGE" | "PDF" | "SPREADSHEET" | "DOCUMENT" | "OTHER";

export function attachmentKindFor(mimeType: string | null | undefined, fileName: string): AttachmentKind {
  const mime = mimeType ?? "";
  if (IMAGE_TYPES.test(mime)) return "IMAGE";
  if (mime === "application/pdf" || /\.pdf$/i.test(fileName)) return "PDF";
  if (SPREADSHEET_TYPES.test(mime) || /\.(xlsx?|csv)$/i.test(fileName)) return "SPREADSHEET";
  if (DOC_TYPES.test(mime) || /\.(docx?|txt)$/i.test(fileName)) return "DOCUMENT";
  return "OTHER";
}
