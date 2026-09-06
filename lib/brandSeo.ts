import { CATEGORIES } from "@/lib/categories";

// Brand pages rank markedly worse in GSC (~pos 20) than the SKU pages beneath
// them (~pos 8), and the old title — "{brand} Dealer in Hyderabad — Products,
// Downloads & Pricing" — led with a low-intent phrase and never said what the
// brand actually sells. Most brand searches are "{brand} {category}" /
// "{brand} {category} price" / "{brand} shades", so the title leads with the
// brand's dominant category and the price/selection angle instead.

/** The brand's single dominant category name, or null when it spans several. */
export function brandPrimaryCategory(dbCategories: string[]): string | null {
  if (dbCategories.length !== 1) return null;
  const match = CATEGORIES.find((c) => c.dbCategory === dbCategories[0]);
  return match ? match.name : dbCategories[0];
}

export function brandSeoTitle(brandName: string, dbCategories: string[], page?: number): string {
  const isEightByFour = brandName === "EightByFour" || brandName === "EightxFour";
  const primary = brandPrimaryCategory(dbCategories);
  const pageSuffix = page && page > 1 ? ` — Page ${page}` : "";

  if (isEightByFour) {
    return `EightxFour Products — Prices, Range & Downloads${pageSuffix}`;
  }
  if (primary) {
    return `${brandName} ${primary} — Prices, Shades & Finishes${pageSuffix}`;
  }
  return `${brandName} — Prices, Range & Downloads${pageSuffix}`;
}

export function brandSeoDescription(brandName: string, dbCategories: string[], overview: string | null, page?: number): string {
  const primary = brandPrimaryCategory(dbCategories);
  const pagePart = page && page > 1 ? ` Page ${page}.` : "";
  if (overview && !page) return overview;
  const subject = primary ? `${brandName} ${primary.toLowerCase()}` : `${brandName} products`;
  return `Browse ${subject} with prices, shade codes, finishes and specs on one page. Samples and project delivery from Eight x Four.${pagePart}`;
}
