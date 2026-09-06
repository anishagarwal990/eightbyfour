"use client";

import { useRef, useState } from "react";
import { inr } from "@/lib/studio/format";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * The upload desk. Deliberately not a contact form: the visitor drops files,
 * sees them listed and classified, and gets shown the SHAPE of the quote that
 * comes back — materials, fabrication, installation and logistics as separate
 * lines — before they hand over any contact details.
 *
 * In this preview nothing is transmitted. Files are read only for their name
 * and size, and the classification is by extension and filename. The panel on
 * the right is a worked example of a returned quote, labelled as one.
 */

type Doc = { id: string; name: string; size: number; kind: string };

const KINDS: { match: RegExp; kind: string }[] = [
  { match: /boq|bill|quant/i, kind: "BOQ" },
  { match: /cut|panel|list/i, kind: "Cutting list" },
  { match: /schedule|spec/i, kind: "Material schedule" },
  { match: /\.(dwg|dxf|pdf|skp|rvt)$/i, kind: "Drawing" },
  { match: /\.(xls|xlsx|csv)$/i, kind: "Schedule" },
  { match: /\.(jpg|jpeg|png|heic|webp)$/i, kind: "Site photo" },
];

function classify(name: string): string {
  return KINDS.find((k) => k.match.test(name))?.kind ?? "Document";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACCEPTED = [
  { label: "BOQ", detail: "Excel, CSV or PDF — item, unit, quantity" },
  { label: "Drawings", detail: "PDF, DWG, DXF, SKP — plans and elevations" },
  { label: "Material schedule", detail: "Brand, grade, thickness, shade code" },
  { label: "Cutting list", detail: "Panel sizes, quantities, grain direction" },
];

/** A worked example of what comes back — clearly labelled as an example. */
const SAMPLE_QUOTE = {
  project: "3 BHK fit-out — Gachibowli",
  scope: "Wardrobes ×3, TV unit, crockery unit, kitchen",
  groups: [
    {
      label: "Materials",
      amount: 486000,
      lines: [
        { label: "Century BWP Plywood 19 mm", detail: "62 sheets", amount: 215760 },
        { label: "Action Tesa HDHMR 18 mm", detail: "24 sheets", amount: 64320 },
        { label: "Greenlam laminate, 4 shades", detail: "78 sheets", amount: 118560 },
        { label: "Hettich hardware schedule", detail: "Per elevation drawing", amount: 87360 },
      ],
    },
    { label: "Fabrication", amount: 268000, lines: [{ label: "Carpentry, 412 sq ft elevation", detail: "Carpenter made", amount: 268000 }] },
    { label: "Installation", amount: 74000, lines: [{ label: "Fitting, hardware, alignment", detail: "412 sq ft", amount: 74000 }] },
    { label: "Logistics", amount: 32000, lines: [{ label: "Phased delivery, 4 despatches", detail: "Hyderabad", amount: 32000 }] },
  ],
};

export function UploadDesk() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function add(files: FileList | null) {
    if (!files) return;
    const next = Array.from(files).map((f) => ({
      id: `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 7)}`,
      name: f.name,
      size: f.size,
      kind: classify(f.name),
    }));
    setDocs((d) => [...d, ...next]);
  }

  const total = SAMPLE_QUOTE.groups.reduce((s, g) => s + g.amount, 0);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] lg:gap-10">
      <div>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            add(e.dataTransfer.files);
          }}
          className="rounded-[4px] border-2 border-dashed p-8 text-center transition-colors"
          style={{
            borderColor: dragging ? "var(--burgundy)" : "var(--studio-line-strong)",
            background: dragging ? "color-mix(in srgb, var(--burgundy) 5%, var(--paper))" : "var(--paper)",
          }}
        >
          <p className="serif text-[22px] leading-tight">Drop the drawing set here</p>
          <p className="mx-auto mt-2 max-w-[46ch] text-[13px] leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            BOQ, elevations, material schedule, cutting list — whatever you already have. Multiple files are fine, and
            a photographed handwritten list is fine too.
          </p>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="mt-5 rounded-[3px] px-5 py-2.5 text-[14px] font-semibold text-white transition-colors"
            style={{ background: "var(--burgundy)" }}
          >
            Choose files
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(e) => {
              add(e.target.files);
              e.target.value = "";
            }}
          />
          <p className="mt-3 text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
            Preview only — files stay in your browser and nothing is uploaded.
          </p>
        </div>

        {docs.length > 0 ? (
          <div className="mt-4 rounded-[3px] border" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
            <div className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: "var(--studio-line)" }}>
              <p className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
                {docs.length} document{docs.length > 1 ? "s" : ""} attached
              </p>
              <button type="button" onClick={() => setDocs([])} className="text-[12px]" style={{ color: "var(--ink-soft)" }}>
                Clear
              </button>
            </div>
            <ul>
              {docs.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center gap-3 border-b px-4 py-2.5 last:border-b-0"
                  style={{ borderColor: "var(--studio-line)" }}
                >
                  <span
                    className="tracked-caps shrink-0 rounded-[2px] px-1.5 py-1 text-[9px]"
                    style={{ background: "color-mix(in srgb, var(--burgundy) 9%, transparent)", color: "var(--burgundy)" }}
                  >
                    {d.kind}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[13px]">{d.name}</span>
                  <span className="metric shrink-0 text-[11.5px]" style={{ color: "var(--ink-faint)" }}>
                    {formatSize(d.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDocs((list) => list.filter((x) => x.id !== d.id))}
                    aria-label={`Remove ${d.name}`}
                    className="-my-2 flex h-11 w-11 shrink-0 items-center justify-center text-[15px] leading-none transition-colors hover:text-[var(--burgundy)]"
                    style={{ color: "var(--ink-faint)" }}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="p-4">
              <a
                href={buildWhatsAppUrl(
                  `Studio EightxFour — project execution\n\nI have ${docs.length} document(s) to price:\n${docs
                    .map((d) => `• ${d.name} (${d.kind})`)
                    .join("\n")}\n\nPlease send me a structured quote for materials, fabrication, installation and logistics.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-[3px] px-4 py-3 text-[14px] font-semibold text-white"
                style={{ background: "var(--burgundy)" }}
              >
                Send these on WhatsApp
              </a>
              <p className="mt-2 text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                This opens WhatsApp with the file names listed — attach the files there. Direct upload lands with the
                account system.
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
          {ACCEPTED.map((a) => (
            <div key={a.label} className="rounded-[3px] border p-3.5" style={{ borderColor: "var(--studio-line)", background: "var(--paper)" }}>
              <p className="text-[13.5px] font-semibold">{a.label}</p>
              <p className="mt-0.5 text-[12px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                {a.detail}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------- what comes back ------ */}
      <div className="self-start rounded-[3px] border" style={{ borderColor: "var(--studio-line-strong)", background: "var(--paper)" }}>
        <div className="border-b p-4" style={{ borderColor: "var(--studio-line)" }}>
          <p className="tracked-caps text-[10px]" style={{ color: "var(--burgundy)" }}>
            Example of what comes back
          </p>
          <h3 className="serif mt-1.5 text-[19px] leading-tight">{SAMPLE_QUOTE.project}</h3>
          <p className="mt-1 text-[12.5px]" style={{ color: "var(--ink-soft)" }}>
            {SAMPLE_QUOTE.scope}
          </p>
        </div>
        <div className="p-4">
          {SAMPLE_QUOTE.groups.map((g) => (
            <div key={g.label} className="mb-4 last:mb-0">
              <div className="flex items-baseline justify-between gap-3">
                <span className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
                  {g.label}
                </span>
                <span className="metric text-[13.5px]">{inr(g.amount)}</span>
              </div>
              <ul className="mt-1.5">
                {g.lines.map((l) => (
                  <li key={l.label} className="flex justify-between gap-3 border-t py-1.5" style={{ borderColor: "var(--studio-line)" }}>
                    <span className="min-w-0">
                      <span className="block text-[12.5px] leading-tight">{l.label}</span>
                      <span className="block text-[11px]" style={{ color: "var(--ink-faint)" }}>
                        {l.detail}
                      </span>
                    </span>
                    <span className="metric shrink-0 text-[12px]" style={{ color: "var(--ink-soft)" }}>
                      {inr(l.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t p-4" style={{ borderColor: "var(--studio-line)", background: "var(--stone)" }}>
          <div className="flex items-baseline justify-between">
            <span className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              Project total
            </span>
            <span className="metric text-[24px]">{inr(total)}</span>
          </div>
          <p className="mt-2 text-[11.5px] leading-snug" style={{ color: "var(--ink-faint)" }}>
            Illustrative figures for a worked example — not a live quotation. Your quote is built against your own BOQ
            with brands, grades and quantities from your schedule.
          </p>
        </div>
      </div>
    </div>
  );
}
