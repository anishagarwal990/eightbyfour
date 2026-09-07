// Indian phone-number normalisation for outbound links (WhatsApp / tel).
//
// Slice 1 established that stored numbers are messy: bare 10-digit, +91-
// prefixed, 0-prefixed STD, spaces and dashes. This turns the safe cases into
// a `91XXXXXXXXXX` WhatsApp destination and REFUSES the rest rather than
// guessing — a wrong wa.me link is worse than no button.
//
// Zero imports so it is unit-testable under `node --test`.

/**
 * A WhatsApp destination (E.164 digits, no `+`) for an Indian mobile, or null.
 *
 *   "9703739918"      -> "919703739918"
 *   "+91 97037 39918" -> "919703739918"
 *   "919703739918"    -> "919703739918"
 *   "09703739918"     -> "919703739918"   (leading STD 0)
 *   "0091 97037 39918"-> "919703739918"   (00 intl prefix)
 *   "91919703739918"  -> null              (already-doubled, ambiguous)
 *   "040 2345 6789"   -> null              (landline, not WhatsApp-reachable)
 *   "12345"           -> null
 */
export function toWhatsAppNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/[^0-9]/g, "");
  // Drop an international-access "00" or a domestic trunk "0".
  d = d.replace(/^0+/, "");

  // Bare Indian mobile: exactly 10 digits starting 6-9.
  if (d.length === 10) return /^[6-9]/.test(d) ? `91${d}` : null;

  // Country-coded Indian mobile: 91 + 10 digits starting 6-9.
  if (d.length === 12 && /^91[6-9]\d{9}$/.test(d)) return d;

  // Anything else (too short, too long, doubled 91, unknown country) — refuse.
  return null;
}

/** `wa.me` deep link with a prefilled message, or null if the number is not
 *  safely reachable. */
export function whatsAppLink(raw: string | null | undefined, message: string): string | null {
  const dest = toWhatsAppNumber(raw);
  if (!dest) return null;
  return `https://wa.me/${dest}?text=${encodeURIComponent(message)}`;
}
