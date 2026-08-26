// Single source of truth for which `products` columns are editable and how
// each converts between a database value and a flat cell.
//
// Shared by the admin UI (app/admin) and the CLI (scripts/catalogue.mjs).
// Node strips TypeScript types natively, so the .mjs scripts import this file
// directly rather than keeping a second copy that drifts.
//
// The allowlist is the safety property both surfaces rely on: `id`, `slug`,
// `created_at` and `updated_at` are structurally unreachable. `slug` is the
// product's live URL — renaming it would 404 an indexed page.

export type FieldKind = "text" | "longtext" | "list";

export interface FieldSpec {
  kind: FieldKind;
  label: string;
  /** Shown in the admin form and flagged in the CLI diff. */
  warn?: string;
  help?: string;
}

export const EDITABLE_FIELDS: Record<string, FieldSpec> = {
  category: { kind: "text", label: "Category", warn: "moves the product to a different category page" },
  brand: { kind: "text", label: "Brand", warn: "changes which brand page the product appears on" },
  name: { kind: "text", label: "Name" },
  collection: { kind: "text", label: "Collection" },
  grade: { kind: "text", label: "Grade", help: "MR, BWR, BWP, FR, STR…" },
  size: { kind: "text", label: "Sheet size", help: "Drives the per-sheet price calculation — keep the dimensions in the label." },
  thicknesses: { kind: "list", label: "Thicknesses", help: "Order matters: the first entry is the product page's default selection." },
  sd_code: { kind: "text", label: "Shade code" },
  eb_code: { kind: "text", label: "Edge band code" },
  finish: { kind: "text", label: "Finish" },
  finishes: { kind: "list", label: "Finishes" },
  mood: { kind: "text", label: "Mood" },
  tone: { kind: "text", label: "Tone" },
  description: { kind: "longtext", label: "Description", help: "First sentence becomes the meta description." },
  core: { kind: "text", label: "Core" },
  density: { kind: "text", label: "Density" },
  warranty: { kind: "text", label: "Warranty" },
  certifications: { kind: "list", label: "Certifications", help: "Shown on price pages and drives the marine/IS 710 filters." },
  applications: { kind: "list", label: "Applications" },
  features: { kind: "list", label: "Features" },
  how_to_apply: { kind: "list", label: "How to apply" },
  catalogue_url: { kind: "text", label: "Catalogue URL" },
  tech_sheet_url: { kind: "text", label: "Tech sheet URL" },
  installation_guide_url: { kind: "text", label: "Installation guide URL" },
  main_img_url: { kind: "text", label: "Main image URL" },
  edge_img_url: { kind: "text", label: "Edge image URL" },
  app_img_url: { kind: "text", label: "Application image URL" },
  gallery_img_urls: { kind: "list", label: "Gallery image URLs" },
};

export const FIELD_NAMES = Object.keys(EDITABLE_FIELDS);

/** Columns whose JSON shape has its own editor, not a plain cell. */
export const STRUCTURED_COLUMNS = ["price_table", "variants", "spec_table", "custom_faqs"];

/** Never writable from either surface, for any reason. */
export const IMMUTABLE_COLUMNS = ["id", "slug", "created_at", "updated_at"];

const LIST_SEPARATOR = " | ";

export function toCell(field: string, value: unknown): string {
  if (EDITABLE_FIELDS[field]?.kind === "list") return Array.isArray(value) ? value.join(LIST_SEPARATOR) : "";
  return value === null || value === undefined ? "" : String(value);
}

export function fromCell(field: string, cell: string): string | string[] | null {
  if (EDITABLE_FIELDS[field]?.kind === "list") {
    const parts = cell.split("|").map((p) => p.trim()).filter(Boolean);
    return parts.length ? parts : null;
  }
  // An empty cell means NULL, not "" — that is what every consumer in the app
  // checks for (`product.description ? … : fallback`).
  return cell === "" ? null : cell;
}

/**
 * Structural equality that ignores object key order.
 *
 * PostgREST returns JSONB keys in the database's own order, which is not the
 * order these tools write them in. Comparing with JSON.stringify would call
 * every rebuilt `variants` object a change, so a no-op save would rewrite the
 * row and fill the audit log with edits nobody made.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || a === undefined || b === null || b === undefined) {
    return (a === null || a === undefined) && (b === null || b === undefined);
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((value, i) => deepEqual(value, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every(
      (key) =>
        Object.prototype.hasOwnProperty.call(b, key) &&
        deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])
    );
  }
  return false;
}
