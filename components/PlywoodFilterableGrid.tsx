"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";
import { useSearchParams } from "next/navigation";
import type { ProductRow } from "@/lib/supabase/types";
import { CategoryProductGrid } from "@/components/CategoryProductGrid";
import { certificationCodes, warrantyBucket, warrantyBucketSortKey } from "@/lib/productFilters";
import {
  CertificationIcon,
  CheckIcon,
  EmptyCrateIcon,
  FunnelIcon,
  GradeIcon,
  WarrantyIcon,
  XIcon,
  type IconProps,
} from "@/components/icons/FilterIcons";

type FacetKey = "grade" | "warranty" | "certification";

const FACETS: { key: FacetKey; label: string; icon: (props: IconProps) => ReactElement }[] = [
  { key: "grade", label: "Grade", icon: GradeIcon },
  { key: "warranty", label: "Warranty", icon: WarrantyIcon },
  { key: "certification", label: "Certification", icon: CertificationIcon },
];

function toggle(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function countOptions(values: string[]): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value));
}

const PILL_BASE =
  "inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] cursor-pointer";

function Pill({ label, count, active, onClick }: { label: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={PILL_BASE}
      style={
        active
          ? {
              background: "color-mix(in srgb, var(--burgundy) 14%, var(--paper))",
              color: "var(--burgundy)",
              fontWeight: 600,
            }
          : { background: "var(--paper)", color: "var(--ink)" }
      }
    >
      {active ? <CheckIcon className="shrink-0" style={{ color: "var(--burgundy)" }} /> : null}
      {label}
      <span style={{ color: active ? "color-mix(in srgb, var(--burgundy) 70%, var(--line-strong))" : "var(--line-strong)" }}>
        ({count})
      </span>
    </button>
  );
}

function FacetGroup({
  label,
  Icon,
  options,
  selected,
  onToggle,
}: {
  label: string;
  Icon: (props: IconProps) => ReactElement;
  options: { value: string; count: number }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
}) {
  // A facet with only one possible value can't narrow anything down.
  if (options.length < 2) return null;
  return (
    <div className="border-t py-4 first:border-t-0 first:pt-0" style={{ borderColor: "var(--line)" }}>
      <div className="mb-2.5 flex items-center gap-1.5">
        <Icon className="shrink-0" />
        <span className="tracked-caps text-xs font-medium" style={{ color: "var(--line-strong)" }}>
          {label}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Pill key={o.value} label={o.value} count={o.count} active={selected.has(o.value)} onClick={() => onToggle(o.value)} />
        ))}
      </div>
    </div>
  );
}

const QUERY_KEYS: Record<FacetKey, string> = { grade: "grade", warranty: "warranty", certification: "certification" };

function parseParam(searchParams: URLSearchParams, key: string): Set<string> {
  const raw = searchParams.get(key);
  return raw ? new Set(raw.split(",").filter(Boolean)) : new Set();
}

// Client-side filtering over the already-fetched product list — the plywood
// category always fits on one page (26 products, well under
// CATEGORY_PAGE_SIZE), so there's no server round-trip needed to narrow it
// further by grade/warranty/certification the way brand collection does.
//
// Filter state is still synced to the URL (?grade=...&warranty=...&certification=...)
// for shareable/bookmarkable links, via plain history.replaceState rather than
// next/navigation's router — that avoids triggering a server round-trip (and
// re-running generateMetadata) on every pill click, which would defeat the
// point above. Canonical/metadata deliberately stay pinned to the bare
// /products/plywood URL regardless of filter state: unlike the `collection`
// facet (a handful of real, distinct values worth indexing separately), grade
// × warranty × certification has enough combinations that treating each as
// its own indexable page would risk exactly the doorway-page/thin-content
// problem the SEO audit warned against — so these stay UI-only, not a new
// crawlable surface.
export function PlywoodFilterableGrid({ products }: { products: ProductRow[] }) {
  const searchParams = useSearchParams();
  const [grades, setGrades] = useState<Set<string>>(() => parseParam(searchParams, QUERY_KEYS.grade));
  const [warranties, setWarranties] = useState<Set<string>>(() => parseParam(searchParams, QUERY_KEYS.warranty));
  const [certs, setCerts] = useState<Set<string>>(() => parseParam(searchParams, QUERY_KEYS.certification));

  useEffect(() => {
    // Start from the live URL's params (not a fresh URLSearchParams) so
    // anything this component doesn't own — utm_* campaign params above all —
    // survives the pill clicks intact instead of being silently dropped.
    const params = new URLSearchParams(window.location.search);
    for (const key of Object.values(QUERY_KEYS)) params.delete(key);
    if (grades.size) params.set(QUERY_KEYS.grade, [...grades].join(","));
    if (warranties.size) params.set(QUERY_KEYS.warranty, [...warranties].join(","));
    if (certs.size) params.set(QUERY_KEYS.certification, [...certs].join(","));
    const query = params.toString();
    const url = query ? `${window.location.pathname}?${query}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [grades, warranties, certs]);

  const selectedByFacet: Record<FacetKey, Set<string>> = { grade: grades, warranty: warranties, certification: certs };
  const setters: Record<FacetKey, (next: Set<string>) => void> = {
    grade: setGrades,
    warranty: setWarranties,
    certification: setCerts,
  };

  const enriched = useMemo(
    () =>
      products.map((p) => ({
        product: p,
        grade: p.grade ?? "Unspecified",
        warranty: warrantyBucket(p.warranty),
        certs: certificationCodes(p.certifications),
      })),
    [products]
  );

  const gradeOptions = useMemo(() => countOptions(enriched.map((e) => e.grade)), [enriched]);
  const warrantyOptions = useMemo(
    () =>
      countOptions(enriched.map((e) => e.warranty)).sort(
        (a, b) => warrantyBucketSortKey(b.value) - warrantyBucketSortKey(a.value)
      ),
    [enriched]
  );
  const certOptions = useMemo(() => countOptions(enriched.flatMap((e) => e.certs)), [enriched]);
  const optionsByFacet: Record<FacetKey, { value: string; count: number }[]> = {
    grade: gradeOptions,
    warranty: warrantyOptions,
    certification: certOptions,
  };

  const filtered = enriched
    .filter((e) => grades.size === 0 || grades.has(e.grade))
    .filter((e) => warranties.size === 0 || warranties.has(e.warranty))
    .filter((e) => certs.size === 0 || e.certs.some((c) => certs.has(c)))
    .map((e) => e.product);

  const activeChips = FACETS.flatMap((f) => [...selectedByFacet[f.key]].map((value) => ({ facet: f.key, label: f.label, value })));
  const hasActiveFilters = activeChips.length > 0;

  function clearFacet(facet: FacetKey, value: string) {
    setters[facet](toggle(selectedByFacet[facet], value));
  }

  function clearAll() {
    setGrades(new Set());
    setWarranties(new Set());
    setCerts(new Set());
  }

  return (
    <div>
      <div className="rounded-2xl p-4 sm:p-5" style={{ background: "var(--card)" }}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <FunnelIcon style={{ color: "var(--burgundy)" }} />
            <span className="text-sm font-semibold">Filter Plywood</span>
          </div>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer text-sm underline-offset-2 hover:underline"
              style={{ color: "var(--burgundy)" }}
            >
              Clear all
            </button>
          ) : null}
        </div>

        {FACETS.map((f) => (
          <FacetGroup
            key={f.key}
            label={f.label}
            Icon={f.icon}
            options={optionsByFacet[f.key]}
            selected={selectedByFacet[f.key]}
            onToggle={(v) => setters[f.key](toggle(selectedByFacet[f.key], v))}
          />
        ))}
      </div>

      {hasActiveFilters ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm" style={{ color: "var(--line-strong)" }}>
            {filtered.length} of {products.length} products
          </span>
          {activeChips.map((c) => (
            <button
              key={`${c.facet}-${c.value}`}
              type="button"
              onClick={() => clearFacet(c.facet, c.value)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
              style={{ borderColor: "var(--line)", background: "var(--paper)", color: "var(--ink)" }}
            >
              <span style={{ color: "var(--line-strong)" }}>{c.label}:</span>
              {c.value}
              <XIcon />
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5">
        {filtered.length > 0 ? (
          <CategoryProductGrid products={filtered} />
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border py-14 text-center" style={{ borderColor: "var(--line)" }}>
            <EmptyCrateIcon style={{ color: "var(--line-strong)" }} />
            <p style={{ color: "var(--line-strong)" }}>No plywood matches the selected filters.</p>
            <button
              type="button"
              onClick={clearAll}
              className="cursor-pointer rounded-full border px-4 py-1.5 text-sm font-medium hover:opacity-70"
              style={{ borderColor: "var(--burgundy)", color: "var(--burgundy)" }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
