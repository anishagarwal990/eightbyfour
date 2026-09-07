"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { ENQUIRY_SOURCES, ENQUIRY_STATUSES, sourceLabel, statusLabel } from "@/lib/enquiry";

const CONTROL_CLASS = "rounded-md border px-2.5 py-1.5 text-sm";
const CONTROL_STYLE = { borderColor: "var(--line)", background: "var(--card)" };

export function EnquiryFilters({
  current,
}: {
  current: { q?: string; status?: string; source?: string; followup?: string };
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
    // Any filter change invalidates the offset — page 4 of a narrower result
    // set is an empty screen.
    next.delete("page");
    const query = next.toString();
    router.push(query ? `/admin/enquiries?${query}` : "/admin/enquiries");
  }

  const hasFilters = Boolean(current.q || current.status || current.source || current.followup);

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
        placeholder="Ref, customer, phone, email, project, brand"
        aria-label="Search enquiries"
        className={`${CONTROL_CLASS} min-w-[240px] flex-1`}
        style={CONTROL_STYLE}
      />
      <select
        className={CONTROL_CLASS}
        style={CONTROL_STYLE}
        value={current.status ?? ""}
        aria-label="Filter by status"
        onChange={(e) => navigate({ status: e.target.value })}
      >
        <option value="">All statuses</option>
        {ENQUIRY_STATUSES.map((status) => (
          <option key={status} value={status}>
            {statusLabel(status)}
          </option>
        ))}
      </select>
      <select
        className={CONTROL_CLASS}
        style={CONTROL_STYLE}
        value={current.source ?? ""}
        aria-label="Filter by source"
        onChange={(e) => navigate({ source: e.target.value })}
      >
        <option value="">All sources</option>
        {ENQUIRY_SOURCES.map((source) => (
          <option key={source} value={source}>
            {sourceLabel(source)}
          </option>
        ))}
      </select>
      <select
        className={CONTROL_CLASS}
        style={CONTROL_STYLE}
        value={current.followup ?? ""}
        aria-label="Filter by follow-up"
        onChange={(e) => navigate({ followup: e.target.value })}
      >
        <option value="">Any follow-up</option>
        <option value="overdue">Overdue</option>
        <option value="today">Due today</option>
        <option value="week">Due this week</option>
      </select>
      {hasFilters ? (
        <button
          type="button"
          onClick={() => {
            setSearch("");
            router.push("/admin/enquiries");
          }}
          className="text-sm underline-offset-2 hover:underline"
          style={{ color: "var(--line-strong)" }}
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}
