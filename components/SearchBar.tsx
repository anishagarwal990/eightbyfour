"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import type { SearchEntry } from "@/lib/search-index";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fuse = useMemo(
    () => (index ? new Fuse(index, { keys: ["title", "subtitle"], threshold: 0.35 }) : null),
    [index]
  );

  async function ensureIndex() {
    if (index) return;
    const res = await fetch("/api/search-index");
    const data: SearchEntry[] = await res.json();
    setIndex(data);
  }

  const results = query.trim() && fuse ? fuse.search(query, { limit: 8 }).map((r) => r.item) : [];

  function goTo(url: string) {
    setOpen(false);
    setQuery("");
    router.push(url);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <input
        type="search"
        placeholder="Search products, brands, guides…"
        value={query}
        onFocus={() => {
          ensureIndex();
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
        }}
        onKeyDown={(e) => {
          if (!results.length) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            goTo(results[activeIndex].url);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-full border px-4 py-1.5 text-sm transition-colors placeholder:text-[rgba(110,31,46,0.55)] focus:outline-none focus:border-[var(--burgundy)]"
        style={{ borderColor: "rgba(110,31,46,0.35)", background: "rgba(110,31,46,0.04)", color: "var(--burgundy)" }}
      />
      {open && query.trim() && results.length > 0 ? (
        <ul
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-sm border shadow-[var(--shadow-lg)]"
          style={{ borderColor: "var(--line)", background: "var(--paper)" }}
        >
          {results.map((r, i) => (
            <li key={`${r.type}-${r.url}`}>
              <button
                type="button"
                onClick={() => goTo(r.url)}
                onMouseEnter={() => setActiveIndex(i)}
                className="flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm"
                style={{ background: i === activeIndex ? "var(--card)" : "transparent" }}
              >
                <span>
                  {r.title}
                  <span className="ml-2 text-xs" style={{ color: "var(--line-strong)" }}>
                    {r.subtitle}
                  </span>
                </span>
                <span className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
                  {r.type}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
