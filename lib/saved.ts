const KEY = "ebfour_saved_products";

export function getSavedIds(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(raw) ? raw.filter((n) => typeof n === "number") : [];
  } catch {
    return [];
  }
}

export function isSaved(productId: number): boolean {
  return getSavedIds().includes(productId);
}

/** Toggles saved state for a product and returns the new state. */
export function toggleSaved(productId: number): boolean {
  const ids = getSavedIds();
  const idx = ids.indexOf(productId);
  const next = idx === -1;
  const updated = next ? [...ids, productId] : ids.filter((id) => id !== productId);
  try {
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {
    // storage unavailable — non-fatal
  }
  return next;
}
