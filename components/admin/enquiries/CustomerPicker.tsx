"use client";

import { useEffect, useId, useState } from "react";
import type { CustomerRow } from "@/lib/supabase/types";

const FIELD = "w-full rounded border px-2 py-1.5 text-sm";
const FIELD_STYLE = { borderColor: "var(--line)", background: "var(--paper)" };

/**
 * Find-or-create customer, in one control.
 *
 * Typing a phone or name searches existing customers (matched on the last 10
 * digits, so +91-prefixed and bare numbers find each other) and offers them
 * before staff can create a duplicate. Picking one locks the fields and
 * submits `customer_id`; leaving it unpicked submits the typed fields and the
 * server action creates the record.
 *
 * Deliberately *offers* rather than enforces: production already has one phone
 * number recorded against two different people, so a hard match would be wrong.
 */
export function CustomerPicker() {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CustomerRow[]>([]);
  const [picked, setPicked] = useState<CustomerRow | null>(null);
  const [pending, setPending] = useState(false);
  const listId = useId();

  // Only the debounced fetch writes results; the "nothing to show" case is
  // derived below rather than set from inside the effect, which would be a
  // synchronous setState in an effect body (cascading render).
  const searchable = !picked && term.trim().length >= 2;
  const visibleResults = searchable ? results : [];

  useEffect(() => {
    if (!searchable) return;
    // AbortController rather than a `stale` flag: it also cancels the request
    // itself when the operator keeps typing, instead of letting a superseded
    // lookup run to completion.
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPending(true);
      try {
        const response = await fetch(`/admin/enquiries/customers?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Customer search failed: ${response.status}`);
        const body = (await response.json()) as { customers: CustomerRow[] };
        setResults(body.customers ?? []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("customer search failed", error);
          setResults([]);
        }
      } finally {
        setPending(false);
      }
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [term, searchable]);

  if (picked) {
    return (
      <div className="rounded-md border p-3" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
        <input type="hidden" name="customer_id" value={picked.id} />
        <input type="hidden" name="customer_name" value={picked.name} />
        <input type="hidden" name="customer_phone" value={picked.phone ?? ""} />
        <input type="hidden" name="customer_email" value={picked.email ?? ""} />
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">{picked.name}</p>
            <p className="text-xs" style={{ color: "var(--line-strong)" }}>
              {[picked.company, picked.phone, picked.email].filter(Boolean).join(" · ") || "No other details on file"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setPicked(null);
              setTerm("");
            }}
            className="shrink-0 text-xs underline-offset-2 hover:underline"
            style={{ color: "var(--line-strong)" }}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search by phone, name or company"
          aria-label="Search existing customers"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={visibleResults.length > 0}
          aria-controls={visibleResults.length > 0 ? listId : undefined}
          className={FIELD}
          style={FIELD_STYLE}
        />
        {visibleResults.length > 0 ? (
          <ul
            id={listId}
            role="listbox"
            aria-label="Matching customers"
            className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-md border shadow-[var(--shadow-md)]"
            style={{ borderColor: "var(--line)", background: "var(--paper)" }}
          >
            {visibleResults.map((customer) => (
              <li key={customer.id} role="option" aria-selected={false}>
                <button
                  type="button"
                  onClick={() => setPicked(customer)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-[var(--card)]"
                >
                  <span className="font-medium">{customer.name}</span>
                  <span className="ml-2 text-xs" style={{ color: "var(--line-strong)" }}>
                    {[customer.company, customer.phone].filter(Boolean).join(" · ")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {pending ? (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px]" style={{ color: "var(--line-strong)" }}>
            …
          </span>
        ) : null}
      </div>

      <p className="text-xs" style={{ color: "var(--line-strong)" }}>
        No match? Fill these in and the customer is created with the enquiry.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label="Name" name="customer_name" required defaultValue={term} />
        <Field label="Phone" name="customer_phone" required />
        <Field label="Company" name="customer_company" />
        <Field label="WhatsApp" name="customer_whatsapp" />
        <Field label="Email" name="customer_email" type="email" />
        <Field label="GSTIN" name="customer_gstin" />
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  required,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  required?: boolean;
  type?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="text-[11px]" style={{ color: "var(--line-strong)" }}>
        {label}
        {required ? " *" : ""}
      </span>
      <input name={name} type={type} required={required} defaultValue={defaultValue} className={FIELD} style={FIELD_STYLE} />
    </label>
  );
}
