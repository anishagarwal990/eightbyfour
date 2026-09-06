"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import type { SearchEntry } from "@/lib/search-index";

export function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  // True once the visitor has moved the highlight with the arrow keys. Enter
  // then selects that option; without it Enter still goes to the full results
  // page (the long-standing behaviour — a bare Enter should show everything
  // that matched, not jump to one fuzzy guess).
  const [keyboardActive, setKeyboardActive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const optionId = (i: number) => `${listboxId}-option-${i}`;

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

  const results = query.trim() && fuse ? fuse.search(query, { limit: 50 }).map((r) => r.item) : [];
  const listboxOpen = open && query.trim().length > 0 && results.length > 0;

  function goTo(url: string) {
    setOpen(false);
    setQuery("");
    setKeyboardActive(false);
    router.push(url);
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <input
        type="search"
        role="combobox"
        aria-label="Search products, brands, guides"
        aria-autocomplete="list"
        aria-expanded={listboxOpen}
        aria-controls={listboxOpen ? listboxId : undefined}
        aria-activedescendant={listboxOpen && keyboardActive ? optionId(activeIndex) : undefined}
        placeholder="Search products, brands, guides…"
        value={query}
        onFocus={() => {
          ensureIndex();
          setOpen(true);
        }}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setKeyboardActive(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && results.length) {
            e.preventDefault();
            setOpen(true);
            setKeyboardActive(true);
            setActiveIndex((i) => Math.min(i + 1, results.length - 1));
          } else if (e.key === "ArrowUp" && results.length) {
            e.preventDefault();
            setKeyboardActive(true);
            setActiveIndex((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter") {
            e.preventDefault();
            if (listboxOpen && keyboardActive && results[activeIndex]) {
              // A specific suggestion was arrowed to — go straight there.
              goTo(results[activeIndex].url);
            } else if (query.trim()) {
              // Otherwise the full results page, as before.
              goTo(`/search?q=${encodeURIComponent(query.trim())}`);
            }
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="w-full rounded-full border px-4 py-1.5 text-sm transition-colors placeholder:text-[rgba(110,31,46,0.55)] focus-visible:border-[var(--burgundy)]"
        style={{ borderColor: "rgba(110,31,46,0.35)", background: "rgba(110,31,46,0.04)", color: "var(--burgundy)" }}
      />
      {listboxOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Search suggestions"
          className="absolute left-0 right-0 top-full z-30 mt-1 max-h-96 overflow-y-auto rounded-sm border shadow-[var(--shadow-lg)]"
          style={{ borderColor: "var(--line)", background: "var(--paper)" }}
        >
          {results.map((r, i) => (
            <li
              key={`${r.type}-${r.url}`}
              id={optionId(i)}
              role="option"
              aria-selected={i === activeIndex}
            >
              <button
                type="button"
                tabIndex={-1}
                onClick={() => goTo(r.url)}
                onMouseEnter={() => {
                  setActiveIndex(i);
                  setKeyboardActive(false);
                }}
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
