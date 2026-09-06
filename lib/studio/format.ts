/** Indian-grouped rupees, no decimals — ₹1,24,800 rather than ₹124,800. */
export function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

/** Short form for headline figures — ₹1.25 L, ₹12.4 L, ₹1.2 Cr. */
export function inrShort(amount: number): string {
  const n = Math.round(amount);
  if (n >= 1_00_00_000) return `₹${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `₹${(n / 1_00_000).toFixed(2)} L`;
  return inr(n);
}

/** Signed delta for "what this change costs you" annotations. */
export function delta(amount: number): string {
  if (amount === 0) return "no change";
  return `${amount > 0 ? "+" : "−"}${inr(Math.abs(amount))}`;
}

/** Feet with a prime mark, dropping a trailing .0 — 8′, 1.5′. */
export function ft(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)}′`;
}
