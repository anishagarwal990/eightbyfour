"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export interface ShadeFinishOption {
  code: string;
  finish: string;
  slug: string;
}

export interface ShadeEntry {
  code: string;
  name: string;
  finishes: ShadeFinishOption[];
}

// Client-side shade/code + finish selector for catalogues (like Virgo) where
// finish is a core, per-SKU differentiator rather than a minor filter — each
// Code+Finish combination is its own product page, so this picker exists to
// get a customer who already knows (or is browsing for) a shade code to the
// right page in two steps, the way they'd flip to an index page in a printed
// catalogue rather than scroll a product grid.
export function ShadeFinishPicker({ brandName, shades }: { brandName: string; shades: ShadeEntry[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [selectedFinish, setSelectedFinish] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedShade = useMemo(() => shades.find((s) => s.code === selectedCode) ?? null, [shades, selectedCode]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return shades
      .filter((s) => s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.finishes.some((f) => f.finish.toLowerCase().includes(q)))
      .slice(0, 30);
  }, [shades, query]);

  function pickShade(shade: ShadeEntry) {
    setSelectedCode(shade.code);
    setQuery(`${shade.code} — ${shade.name}`);
    setOpen(false);
    setSelectedFinish(shade.finishes.length === 1 ? shade.finishes[0].finish : "");
  }

  function goToProduct() {
    if (!selectedShade || !selectedFinish) return;
    const option = selectedShade.finishes.find((f) => f.finish === selectedFinish);
    if (option) router.push(`/products/${option.slug}`);
  }

  return (
    <div className="rounded-2xl p-5 sm:p-6" style={{ background: "var(--card)" }}>
      <p className="tracked-caps text-xs font-medium" style={{ color: "var(--burgundy)" }}>
        Find a Shade
      </p>
      <p className="mt-1 text-sm" style={{ color: "var(--line-strong)" }}>
        Know the code? Search it below — or browse the full {brandName} catalogue further down the page.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr_auto] sm:items-end">
        <div ref={containerRef} className="relative">
          <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--line-strong)" }}>
            Select Shade
          </label>
          <input
            type="text"
            value={query}
            placeholder="Search by code or name — e.g. 6510 or Canadian Walnut"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              if (selectedCode) {
                setSelectedCode(null);
                setSelectedFinish("");
              }
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--burgundy)]"
            style={{ borderColor: "var(--line)", background: "var(--paper)" }}
          />
          {open && results.length > 0 ? (
            <ul
              className="absolute left-0 right-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-lg border shadow-[var(--shadow-lg)]"
              style={{ borderColor: "var(--line)", background: "var(--paper)" }}
            >
              {results.map((s) => (
                <li key={s.code}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => pickShade(s)}
                    className="flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left text-sm hover:bg-[var(--card)]"
                  >
                    <span>
                      {s.code} — {s.name}
                    </span>
                    <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                      {s.finishes.length} finish{s.finishes.length === 1 ? "" : "es"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium" style={{ color: "var(--line-strong)" }}>
            Select Finish
          </label>
          <select
            value={selectedFinish}
            disabled={!selectedShade}
            onChange={(e) => setSelectedFinish(e.target.value)}
            className="w-full rounded-lg border px-3.5 py-2.5 text-sm focus:outline-none focus:border-[var(--burgundy)] disabled:opacity-50"
            style={{ borderColor: "var(--line)", background: "var(--paper)" }}
          >
            <option value="">{selectedShade ? "Choose finish" : "Select a shade first"}</option>
            {selectedShade?.finishes.map((f) => (
              <option key={f.finish} value={f.finish}>
                {f.finish}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={goToProduct}
          disabled={!selectedShade || !selectedFinish}
          className="rounded-full px-5 py-2.5 text-sm font-medium text-white transition-[transform,box-shadow] duration-150 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "var(--burgundy)" }}
        >
          View Shade
        </button>
      </div>
    </div>
  );
}
