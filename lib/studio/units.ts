/**
 * Length handling for the visual configurator.
 *
 * Everything downstream of the input fields is millimetres. Feet are a display
 * unit and an entry unit, never a storage unit — a wardrobe entered as 8'-4"
 * and one entered as 2540 mm have to be the same object, and the moment two
 * units are both stored they drift apart on the third rounding.
 */

export type LengthUnit = "ft" | "in" | "mm";

export const MM_PER_FT = 304.8;
export const MM_PER_IN = 25.4;

export function toMm(value: number, unit: LengthUnit): number {
  if (unit === "ft") return value * MM_PER_FT;
  if (unit === "in") return value * MM_PER_IN;
  return value;
}

export function fromMm(mm: number, unit: LengthUnit): number {
  if (unit === "ft") return mm / MM_PER_FT;
  if (unit === "in") return mm / MM_PER_IN;
  return mm;
}

/** Feet as a decimal — the unit the existing pricing engine works in. */
export function mmToFeet(mm: number): number {
  return mm / MM_PER_FT;
}

export function feetToMm(ft: number): number {
  return ft * MM_PER_FT;
}

/**
 * Architectural dimension string: 8'-0", 8'-4", 2'-6".
 * Inches are rounded to the nearest whole inch — this tool is explicitly not
 * producing a shop drawing, and 8'-3.72" would imply a precision the input
 * ("rough measurements are enough") does not have.
 */
export function formatFeetInches(mm: number): string {
  const totalInches = Math.round(mm / MM_PER_IN);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'-${inches}"`;
}

/** Short form for compartment widths, where feet-and-inches is too heavy. */
export function formatInches(mm: number): string {
  return `${Math.round(mm / MM_PER_IN)}″`;
}

/** Millimetres, for the pro-mode readout and the component inspector. */
export function formatMm(mm: number): string {
  return `${Math.round(mm)} mm`;
}

/** "8 ft 4 in" — how the dimension reads back in the entry row. */
export function formatFeetAndInches(mm: number): string {
  const totalInches = Math.round(mm / MM_PER_IN);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  if (inches === 0) return `${feet} ft`;
  return `${feet} ft ${inches} in`;
}

/**
 * Split millimetres into whole feet plus remaining inches, for the two-box
 * feet+inches entry. Rounds to the inch, then carries 12 back into feet so the
 * boxes never show "7 ft 12 in".
 */
export function splitFeetInches(mm: number): { feet: number; inches: number } {
  const totalInches = Math.round(mm / MM_PER_IN);
  return { feet: Math.floor(totalInches / 12), inches: totalInches % 12 };
}

export function joinFeetInches(feet: number, inches: number): number {
  return (feet * 12 + inches) * MM_PER_IN;
}

/** Clamp to a range expressed in millimetres. */
export function clampMm(mm: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, mm));
}

/**
 * One length, in whatever unit the customer is reading in.
 *
 * This is the function every readout in the visual configurator goes through,
 * so the unit control changes the drawing, the compartment widths, the loft
 * band and the component inspector together. Anything formatting a length its
 * own way is a readout that will disagree with the rest of the screen.
 */
export function formatLength(mm: number, unit: LengthUnit): string {
  if (unit === "mm") return `${Math.round(mm)} mm`;
  if (unit === "in") return `${Math.round(mm / MM_PER_IN)}″`;
  // Feet-and-inches degrades below a foot: a 19 mm board reads as 0'-1", which
  // is worse than useless on a panel thickness. Small lengths stay in inches
  // even in feet mode, to one decimal so a board thickness stays honest.
  if (mm < MM_PER_FT) return `${Math.round((mm / MM_PER_IN) * 10) / 10}″`;
  return formatFeetInches(mm);
}

/** The W × H × D readout above the drawing. */
export function formatTriple(w: number, h: number, d: number, unit: LengthUnit): string {
  if (unit === "mm") return `${Math.round(w)} × ${Math.round(h)} × ${Math.round(d)} mm`;
  return `${formatLength(w, unit)} × ${formatLength(h, unit)} × ${formatLength(d, unit)}`;
}

/** Spoken form, for aria-labels — "8 feet 4 inches" beats "8'-4"". */
export function speakLength(mm: number, unit: LengthUnit): string {
  if (unit === "mm") return `${Math.round(mm)} millimetres`;
  if (unit === "in") return `${Math.round(mm / MM_PER_IN)} inches`;
  const { feet, inches } = splitFeetInches(mm);
  if (inches === 0) return `${feet} feet`;
  return `${feet} feet ${inches} inches`;
}
