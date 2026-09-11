import { CATEGORIES } from "@/lib/categories";

// Brand pages rank markedly worse in GSC (~pos 20) than the SKU pages beneath
// them (~pos 8), and the old title — "{brand} Dealer in Hyderabad — Products,
// Downloads & Pricing" — led with a low-intent phrase and never said what the
// brand actually sells. Most brand searches are "{brand} {category}" /
// "{brand} {category} price" / "{brand} shades", so the title leads with the
// brand's dominant category and the price/selection angle instead.

// Catalogues bought by shade code — their brand hubs carry a code finder and
// "most searched codes", and "{brand} laminate codes" is a real query shape.
const SHADE_CODE_CATEGORIES = new Set(["Laminates", "Corian - Acrylic Solid Surface"]);

/** The brand's single dominant category name, or null when it spans several. */
export function brandPrimaryCategory(dbCategories: string[]): string | null {
  if (dbCategories.length !== 1) return null;
  const match = CATEGORIES.find((c) => c.dbCategory === dbCategories[0]);
  return match ? match.name : dbCategories[0];
}

/** "Merino Laminates" — but "Century Laminates", not "Century Laminates Laminates". */
export function brandHubName(brandName: string, categoryName: string): string {
  return brandName.toLowerCase().endsWith(categoryName.toLowerCase()) ? brandName : `${brandName} ${categoryName}`;
}

export function brandSeoTitle(brandName: string, dbCategories: string[], page?: number): string {
  const isEightByFour = brandName === "EightByFour" || brandName === "EightxFour";
  const primary = brandPrimaryCategory(dbCategories);
  const pageSuffix = page && page > 1 ? ` — Page ${page}` : "";

  if (isEightByFour) {
    return `EightxFour Products — Prices, Range & Downloads${pageSuffix}`;
  }
  if (primary) {
    const angle = SHADE_CODE_CATEGORIES.has(dbCategories[0]) ? "Shade Codes, Finishes & Prices" : "Prices, Shades & Finishes";
    return `${brandHubName(brandName, primary)} — ${angle}${pageSuffix}`;
  }
  return `${brandName} — Prices, Range & Downloads${pageSuffix}`;
}

export function brandSeoDescription(brandName: string, dbCategories: string[], overview: string | null, page?: number): string {
  const primary = brandPrimaryCategory(dbCategories);
  const pagePart = page && page > 1 ? ` Page ${page}.` : "";
  if (overview && !page) return overview;
  const subject = primary ? brandHubName(brandName, primary.toLowerCase()) : `${brandName} products`;
  return `Browse ${subject} with prices, shade codes, finishes and specs on one page. Project pricing and delivery from Eight x Four.${pagePart}`;
}
