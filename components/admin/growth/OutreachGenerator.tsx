"use client";

import { useState } from "react";
import type { ProspectData } from "@/lib/growth/types";

/**
 * Composes an outreach draft from the prospect's own real fields —
 * deterministic templating, not a call to any LLM (none is wired into this
 * app). Answers "why would THIS company specifically care" by requiring
 * reasonForFit/likelyNeed to actually be filled in on the prospect first;
 * if they're blank, the draft says so rather than inventing a reason.
 */
function buildMessage(kind: "linkedin" | "whatsapp" | "email" | "followup" | "call_notes", company: string, d: Partial<ProspectData>): string {
  const contact = d.contactPerson || "there";
  const reason = d.reasonForFit || "[fill in why this company specifically fits before sending]";
  const need = d.likelyNeed || "[fill in the likely material/procurement need]";

  switch (kind) {
    case "linkedin":
      return `Hi ${contact} — noticed ${company} ${reason.startsWith("[") ? "is executing projects that could use a local material partner" : reason}. We run material procurement for interior projects in Hyderabad — one consolidated quote across plywood, laminate, hardware and more instead of five vendor calls. Worth a quick chat on your next project's requirement?`;
    case "whatsapp":
      return `Hi ${contact}, this is EightByFour — we handle interior material procurement in Hyderabad. ${need.startsWith("[") ? "Happy to quote your next requirement." : `For ${need.toLowerCase()}, we can put together one consolidated quote.`} Send your list whenever you're ready.`;
    case "email":
      return `Subject: Material procurement for ${company}'s Hyderabad projects\n\nHi ${contact},\n\n${reason.startsWith("[") ? `We work with companies executing interior projects in Hyderabad.` : reason}. EightByFour sources plywood, laminates, hardware and more direct from 25+ manufacturers, and returns one consolidated, compared quote per requirement — instead of managing five separate vendor threads per project.\n\n${need.startsWith("[") ? "If a project is coming up, send the material list and we'll return a priced quote." : `Given ${need.toLowerCase()}, this could remove a real coordination cost from your next project.`}\n\nWorth a short call?`;
    case "followup":
      return `Hi ${contact} — following up on EightByFour's material procurement offer for ${company}. No pressure — happy to send a sample consolidated quote against a real material list whenever useful, so you can see the format before committing to anything.`;
    case "call_notes":
      return `Call notes — ${company} (${contact || "contact TBD"})\n\nReason for fit: ${reason}\nLikely need: ${need}\nObjections raised: \nNext action: `;
  }
}

const KINDS = [
  { key: "linkedin", label: "LinkedIn Message" },
  { key: "whatsapp", label: "WhatsApp Message" },
  { key: "email", label: "Email" },
  { key: "followup", label: "Follow-Up" },
  { key: "call_notes", label: "Call Notes" },
] as const;

export function OutreachGenerator({ company, data }: { company: string; data: Partial<ProspectData> }) {
  const [active, setActive] = useState<(typeof KINDS)[number]["key"] | null>(null);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {KINDS.map((k) => (
          <button
            key={k.key}
            onClick={() => setActive(active === k.key ? null : k.key)}
            className="px-2 py-1 text-xs"
            style={{
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-xs)",
              background: active === k.key ? "var(--paper-dim)" : "transparent",
            }}
          >
            {k.label}
          </button>
        ))}
      </div>
      {active ? (
        <div>
          <textarea
            readOnly
            rows={5}
            value={buildMessage(active, company, data)}
            className="w-full border p-2 font-mono text-xs"
            style={{ borderColor: "var(--line)", background: "var(--paper-dim)", borderRadius: "var(--radius-xs)" }}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
            Draft composed from this prospect&apos;s own fields — not from an AI model (none is wired for outreach generation). Edit before
            sending, especially any bracketed placeholder.
          </p>
        </div>
      ) : null}
    </div>
  );
}
