"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

const CONTROL_CLASS = "rounded-md border px-3 py-1.5 text-sm";
const CONTROL_STYLE = { borderColor: "var(--line)", background: "var(--card)" };

const FILTERS = [
  { value: "all", label: "All" },
  { value: "unpriced", label: "No price" },
  { value: "no-rates", label: "No per-thickness rates" },
  { value: "no-description", label: "No description" },
];

export function AdminFilters({
  categories,
  brands,
  current,
}: {
  categories: string[];
  brands: string[];
  current: { q?: string; category?: string; brand?: string; filter: string };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(current.q ?? "");

  function navigate(updates: Record<string, string>) {
    const next = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    // Any filter change invalidates the current offset — staying on page 7 of
    // a narrower result set lands on an empty screen.
    next.delete("page");
    router.push(`/admin?${next.toString()}`);
  }

  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        navigate({ q: search.trim() });
      }}
    >
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Name, brand, collection, shade code, slug"
        className={`${CONTROL_CLASS} min-w-[260px] flex-1`}
        style={CONTROL_STYLE}
      />
      <select className={CONTROL_CLASS} style={CONTROL_STYLE} value={current.category ?? ""} onChange={(e) => navigate({ category: e.target.value })}>
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
      <select className={CONTROL_CLASS} style={CONTROL_STYLE} value={current.brand ?? ""} onChange={(e) => navigate({ brand: e.target.value })}>
        <option value="">All brands</option>
        {brands.map((brand) => (
          <option key={brand} value={brand}>
            {brand}
          </option>
        ))}
      </select>
      <select className={CONTROL_CLASS} style={CONTROL_STYLE} value={current.filter} onChange={(e) => navigate({ filter: e.target.value === "all" ? "" : e.target.value })}>
        {FILTERS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm">
        Search
      </Button>
    </form>
  );
}
