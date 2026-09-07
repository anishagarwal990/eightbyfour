// Enquiry OS — how a quote's state reads to an operator.
//
// The stored `quotes.status` is the CURRENT version's status. That alone is
// misleading once a revision exists: a quote whose V2 was SENT and whose V3 is
// a fresh DRAFT stores "DRAFT", which looks like nothing was ever sent. This
// derives a display status that distinguishes "current version status" from
// "this quote has been sent before".
//
// Zero imports — unit-testable under `node --test`.

export interface QuoteVersionSummary {
  version_no: number;
  status: string; // "DRAFT" | "READY"
  frozen_at: string | null;
  sent_at: string | null;
}

export type QuoteTone = "draft" | "ready" | "sent" | "revision";

export interface QuoteDisplay {
  /** Operator-facing status of the whole quote. */
  label: string;
  tone: QuoteTone;
  currentVersionNo: number;
  /** Status of just the current version. */
  currentVersionLabel: "Draft" | "Ready" | "Sent";
  /** The newest version that was actually sent, if any. */
  lastSent: { versionNo: number; at: string } | null;
}

function versionLabel(v: QuoteVersionSummary): "Draft" | "Ready" | "Sent" {
  if (v.sent_at) return "Sent";
  return v.status === "READY" ? "Ready" : "Draft";
}

export function quoteDisplayStatus(
  quoteStatus: string,
  versions: QuoteVersionSummary[]
): QuoteDisplay {
  const sorted = [...versions].sort((a, b) => b.version_no - a.version_no);
  const current = sorted[0];

  if (!current) {
    const label = quoteStatus === "SENT" ? "Sent" : quoteStatus === "READY" ? "Ready" : "Draft";
    return { label, tone: label.toLowerCase() as QuoteTone, currentVersionNo: 0, currentVersionLabel: "Draft", lastSent: null };
  }

  const sent = sorted.filter((v) => v.sent_at);
  const lastSentV = sent[0] ?? null;
  const lastSent = lastSentV ? { versionNo: lastSentV.version_no, at: lastSentV.sent_at as string } : null;
  const currentVersionLabel = versionLabel(current);

  // Current version is itself the sent one.
  if (current.sent_at) {
    return { label: "Sent", tone: "sent", currentVersionNo: current.version_no, currentVersionLabel, lastSent };
  }

  // A newer, unsent version sits on top of a sent one — this is a revision.
  if (lastSent) {
    return {
      label: current.status === "READY" ? "Revision ready" : "Revision draft",
      tone: "revision",
      currentVersionNo: current.version_no,
      currentVersionLabel,
      lastSent,
    };
  }

  // Never sent.
  return {
    label: currentVersionLabel,
    tone: current.status === "READY" ? "ready" : "draft",
    currentVersionNo: current.version_no,
    currentVersionLabel,
    lastSent: null,
  };
}
