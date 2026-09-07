// Shared number/date formatting for the customer quote (preview HTML + PDF).
// Dependency-free.
//
// `sym` defaults to the rupee sign for the HTML preview. The PDF passes "Rs "
// because the base-14 Helvetica the PDF uses has no ₹ (U+20B9) glyph.

export function inr(n: number, sym = "₹"): string {
  const r = Math.round((n + Number.EPSILON) * 100) / 100;
  return `${sym}${r.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function rate(n: number | null | undefined, sym = "₹"): string {
  if (n == null) return "—";
  const r = Math.round((n + Number.EPSILON) * 10000) / 10000;
  return `${sym}${r.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function quoteDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export const PDF_SYM = "Rs ";
