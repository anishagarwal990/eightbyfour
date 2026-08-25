"use client";

/**
 * The Requirement — the single object that connects browsing to procurement.
 *
 * This replaces the old "saved products" bookmark list. A bookmark was a dead
 * end: a visitor could assemble exactly the list the business asks for and had
 * no way to send it. A Requirement is the same list plus a quantity per line,
 * and it can be submitted as one enquiry.
 *
 * Storage is localStorage, device-local, no account — matching how the
 * business actually runs. The legacy key is read once and migrated so anyone
 * with an existing shortlist keeps it.
 */

import { useSyncExternalStore } from "react";

const KEY = "ebfour_requirement";
const LEGACY_KEY = "ebfour_saved_products";
/** Fired on every mutation so the header count and any open view stay in sync. */
export const REQUIREMENT_EVENT = "ebfour:requirement-change";

export interface RequirementLine {
  productId: number;
  qty: number;
}

function read(): RequirementLine[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null");
    if (Array.isArray(raw)) {
      return raw
        .filter((l) => l && typeof l.productId === "number")
        .map((l) => ({ productId: l.productId, qty: Number(l.qty) > 0 ? Number(l.qty) : 1 }));
    }
    // Migrate the old bookmark-only shape: number[] of product ids, qty 1 each.
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]");
    if (Array.isArray(legacy) && legacy.length > 0) {
      const migrated = legacy.filter((n) => typeof n === "number").map((productId: number) => ({ productId, qty: 1 }));
      write(migrated);
      return migrated;
    }
  } catch {
    // storage unavailable or corrupt — treat as empty
  }
  return [];
}

function write(lines: RequirementLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // storage unavailable — non-fatal
  }
  snapshot = lines;
  if (typeof window !== "undefined") window.dispatchEvent(new Event(REQUIREMENT_EVENT));
}

/* useSyncExternalStore requires a snapshot that is referentially stable
   between changes — re-parsing localStorage on every render would hand React
   a new array each time and loop forever. The cache is invalidated by write()
   and by the storage event (another tab). */
let snapshot: RequirementLine[] | null = null;

export function getRequirement(): RequirementLine[] {
  if (typeof window === "undefined") return EMPTY;
  if (snapshot === null) snapshot = read();
  return snapshot;
}

const EMPTY: RequirementLine[] = [];

/** Server snapshot for useSyncExternalStore — nothing is stored server-side. */
export function getServerRequirement(): RequirementLine[] {
  return EMPTY;
}

export function subscribeToRequirement(onChange: () => void): () => void {
  function handleExternal() {
    snapshot = null;
    onChange();
  }
  window.addEventListener(REQUIREMENT_EVENT, onChange);
  window.addEventListener("storage", handleExternal);
  return () => {
    window.removeEventListener(REQUIREMENT_EVENT, onChange);
    window.removeEventListener("storage", handleExternal);
  };
}

export function getRequirementCount(): number {
  return getRequirement().length;
}

export function isInRequirement(productId: number): boolean {
  return getRequirement().some((l) => l.productId === productId);
}

/** Adds the product if absent, removes it if present. Returns the new state. */
export function toggleRequirement(productId: number): boolean {
  const lines = getRequirement();
  const existing = lines.find((l) => l.productId === productId);
  if (existing) {
    write(lines.filter((l) => l.productId !== productId));
    return false;
  }
  write([...lines, { productId, qty: 1 }]);
  return true;
}

export function setRequirementQty(productId: number, qty: number) {
  const clamped = Math.max(1, Math.min(9999, Math.round(qty) || 1));
  write(getRequirement().map((l) => (l.productId === productId ? { ...l, qty: clamped } : l)));
}

export function removeFromRequirement(productId: number) {
  write(getRequirement().filter((l) => l.productId !== productId));
}

export function clearRequirement() {
  write([]);
}

/** Subscribes a component to the requirement; safe to call during SSR. */
export function useRequirement(): RequirementLine[] {
  return useSyncExternalStore(subscribeToRequirement, getRequirement, getServerRequirement);
}
