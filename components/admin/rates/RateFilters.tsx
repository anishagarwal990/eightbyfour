"use client";

import { useRouter } from "next/navigation";
import { PRICING_BASES, PRICING_BASIS_LABELS } from "@/lib/rate-book";
import type { RateFacets } from "@/lib/data/rates";

const FIELD = "rounded border px-2 py-1 text-xs";
const FS = { borderColor: "var(--line)", background: "var(--paper)" } as const;

type Current = { q?: string; category?: string; brand?: string; thickness?: string; basis?: string; state?: string };

export function RateFilters({ facets, current }: { facets: RateFacets; current: Current }) {
  const router = useRouter();

  function apply(patch: Partial<Current>) {
    const next = new URLSearchParams();
    const merged = { ...current, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    const qs = next.toString();
    router.push(qs ? `/admin/rates?${qs}` : "/admin/rates");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        defaultValue={current.q ?? ""}
        onKeyDown={(e) => {
          if (e.key === "Enter") apply({ q: (e.target as HTMLInputElement).value || undefined });
        }}
        placeholder="Search brand, product, thickness…"
        className={FIELD}
        style={{ ...FS, minWidth: 220 }}
      />
      <Select value={current.category} onChange={(v) => apply({ category: v })} placeholder="All categories" options={facets.categories} />
      <Select value={current.brand} onChange={(v) => apply({ brand: v })} placeholder="All brands" options={facets.brands} />
      <Select value={current.thickness} onChange={(v) => apply({ thickness: v })} placeholder="All thickness" options={facets.thicknesses} />
      <Select
        value={current.basis}
        onChange={(v) => apply({ basis: v })}
        placeholder="All bases"
        options={PRICING_BASES.map((b) => b)}
        labels={PRICING_BASIS_LABELS}
      />
      <Select value={current.state} onChange={(v) => apply({ state: v })} placeholder="Active + retired" options={["active", "inactive"]} labels={{ active: "Active only", inactive: "Retired only" }} />
      {Object.values(current).some(Boolean) ? (
        <button onClick={() => apply({ q: undefined, category: undefined, brand: undefined, thickness: undefined, basis: undefined, state: undefined })} className="text-xs underline-offset-2 hover:underline" style={{ color: "var(--line-strong)" }}>
          Clear
        </button>
      ) : null}
    </div>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  options,
  labels,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  placeholder: string;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} className={FIELD} style={FS}>
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{labels?.[o] ?? o}</option>
      ))}
    </select>
  );
}
