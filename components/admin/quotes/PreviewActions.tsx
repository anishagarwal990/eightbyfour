"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { markQuoteSent } from "@/app/(admin)/admin/quotes/actions";
import { FOLLOWUP_PRESETS } from "@/lib/enquiry";
import { useAction } from "./useAction";

export function PreviewActions({
  quoteId,
  versionNo,
  status,
  pdfHref,
  pdfName,
  whatsappHref,
  currentDisplay,
}: {
  quoteId: string;
  versionNo?: number;
  status: string;
  pdfHref: string;
  pdfName: string;
  whatsappHref: string | null;
  currentDisplay: "EX_GST" | "INCL_GST";
}) {
  const router = useRouter();
  const { pending, result, run } = useAction();
  const [sending, setSending] = useState(false);

  const base = `/admin/quotes/${quoteId}/preview${versionNo ? `?v=${versionNo}&` : "?"}`;

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded border text-xs" style={{ borderColor: "var(--line)" }}>
          <Link
            href={`${base}display=EX_GST`}
            className="px-2 py-1"
            style={currentDisplay === "EX_GST" ? { background: "var(--burgundy)", color: "var(--paper)" } : { color: "var(--line-strong)" }}
          >
            Excl. GST
          </Link>
          <Link
            href={`${base}display=INCL_GST`}
            className="px-2 py-1"
            style={currentDisplay === "INCL_GST" ? { background: "var(--burgundy)", color: "var(--paper)" } : { color: "var(--line-strong)" }}
          >
            Incl. GST
          </Link>
        </div>

        <a
          href={pdfHref}
          download={pdfName}
          className="rounded-md border px-3 py-1.5 text-sm"
          style={{ borderColor: "var(--line)" }}
        >
          Download PDF
        </a>

        {whatsappHref ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border px-3 py-1.5 text-sm"
            style={{ borderColor: "var(--line)" }}
          >
            Open WhatsApp
          </a>
        ) : (
          <span className="rounded-md border px-3 py-1.5 text-sm opacity-50" style={{ borderColor: "var(--line)" }} title="No WhatsApp-reachable number on file for this customer">
            WhatsApp — no valid number
          </span>
        )}

        {status === "READY" ? (
          <button
            type="button"
            onClick={() => setSending((v) => !v)}
            className="rounded-md px-3 py-1.5 text-sm font-medium"
            style={{ background: "var(--burgundy)", color: "var(--paper)" }}
          >
            Mark sent
          </button>
        ) : (
          <span
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{ background: "color-mix(in srgb, #1a7f4b 14%, var(--paper))", color: "#136138" }}
          >
            {status === "SENT" ? "Sent" : status}
          </span>
        )}
      </div>

      {whatsappHref ? (
        <p className="text-[11px]" style={{ color: "var(--line-strong)" }}>
          WhatsApp opens with a prefilled message — download the PDF first and attach it manually.
        </p>
      ) : null}

      {sending && status === "READY" ? (
        <form
          action={(fd) => run(() => markQuoteSent(quoteId, fd), { onSuccess: () => { setSending(false); router.refresh(); } })}
          className="flex flex-wrap items-center gap-2 rounded-md border p-2"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        >
          <span className="text-xs" style={{ color: "var(--line-strong)" }}>Sent to customer. Follow up in:</span>
          {FOLLOWUP_PRESETS.filter((p) => p.days !== null && p.days > 0).map((p) => (
            <button
              key={p.label}
              type="submit"
              name="followup_days"
              value={String(p.days)}
              disabled={pending}
              className="rounded border px-2 py-1 text-xs disabled:opacity-50"
              style={{ borderColor: "var(--line)" }}
            >
              {p.label}
            </button>
          ))}
          <button
            type="submit"
            name="followup_days"
            value=""
            disabled={pending}
            className="rounded px-2 py-1 text-xs font-medium disabled:opacity-50"
            style={{ background: "var(--burgundy)", color: "var(--paper)" }}
          >
            Mark sent, no follow-up
          </button>
        </form>
      ) : null}

      {result ? (
        <span className="text-xs" style={{ color: result.ok ? "#136138" : "var(--burgundy)" }}>{result.message}</span>
      ) : null}
    </div>
  );
}
