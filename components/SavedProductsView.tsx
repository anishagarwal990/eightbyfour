"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { clearRequirement, removeFromRequirement, setRequirementQty, useRequirement } from "@/lib/requirement";
import { isRepresentativeImage } from "@/lib/categoryArt";
import { useQuoteModal } from "@/context/QuoteModalContext";
import { productDisplayName } from "@/lib/productDisplay";
import { Button, buttonClasses } from "@/components/ui/Button";
import type { ProductRow } from "@/lib/supabase/types";

/**
 * The Requirement — what used to be a dead-end "saved products" grid. Every
 * line carries a quantity, and the whole list can be sent as one enquiry,
 * which is the entire point: browsing and requesting stop being separate
 * experiences here.
 */
// Hydration flag with no effect and no cascading render: the server snapshot
// is false, the client snapshot is true, so the first client render already
// knows localStorage has been read.
const noopSubscribe = () => () => {};
const getTrue = () => true;
const getFalse = () => false;

export function SavedProductsView() {
  const { openModalWithItems } = useQuoteModal();
  const lines = useRequirement();
  const [products, setProducts] = useState<Record<number, ProductRow>>({});
  // The store is empty during SSR and on the first client render, so "empty"
  // and "not read yet" are indistinguishable until after hydration. This flag
  // keeps the empty state from flashing before localStorage has been read.
  const hydrated = useSyncExternalStore(noopSubscribe, getTrue, getFalse);

  // Fetch only ids we haven't already resolved — quantity edits re-render the
  // list constantly and must not re-hit Supabase.
  useEffect(() => {
    const missing = lines.map((l) => l.productId).filter((id) => !products[id]);
    if (missing.length === 0) return;
    createBrowserSupabaseClient()
      .from("products")
      .select("*")
      .in("id", missing)
      .then(({ data }) => {
        if (!data) return;
        setProducts((prev) => ({ ...prev, ...Object.fromEntries(data.map((p) => [p.id, p])) }));
      });
  }, [lines, products]);

  function sendRequirement() {
    if (lines.length === 0) return;
    const items = lines.map((l) => {
      const p = products[l.productId];
      const label = p
        ? `${productDisplayName(p)}${p.sd_code ? ` (${p.sd_code})` : ""} — ${p.brand}`
        : `Product #${l.productId}`;
      return { desc: label, qty: String(l.qty) };
    });
    openModalWithItems(items, "Send your requirement");
  }

  const isEmpty = lines.length === 0;

  return (
    <main>
      <div className="mx-auto max-w-5xl px-7 py-12">
        <header className="border-b pb-6" style={{ borderColor: "var(--border-subtle)" }}>
          <h1 style={{ fontSize: "var(--fs-h1)", lineHeight: "var(--lh-snug)" }}>Your requirement</h1>
          <p className="mt-2 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
            Everything you&rsquo;ve added while browsing, with quantities. Send it as one requirement and we&rsquo;ll
            price the whole list together — you don&rsquo;t need to enquire product by product.
          </p>
        </header>

        {!hydrated ? (
          <p className="py-10" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        ) : isEmpty ? (
          <div className="py-14">
            <p style={{ fontSize: "var(--fs-body-lg)" }}>Nothing added yet.</p>
            <p className="mt-2 max-w-md" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
              Browse the catalogue and use <strong>Add to requirement</strong> on anything you need. Or skip browsing
              entirely and send us a BOQ.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className={buttonClasses("primary")}>
                Browse materials
              </Link>
              <button type="button" onClick={() => openModalWithItems([], "Send your requirement")} className={buttonClasses("secondary")}>
                Send a requirement instead
              </button>
            </div>
          </div>
        ) : (
          <>
            <ul className="mt-2 flex flex-col">
              {lines.map((line) => {
                const p = products[line.productId];
                return (
                  <li
                    key={line.productId}
                    className="flex items-center gap-4 border-b py-4"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    <span
                      className="relative block h-16 w-16 shrink-0 overflow-hidden"
                      style={{ background: "var(--surface-secondary)", borderRadius: "var(--radius-xs)" }}
                    >
                      {p?.main_img_url ? (
                        // Products with no photograph fall back to a brand logo
                        // file; contained with padding it reads as a brand
                        // placeholder rather than a cropped advertisement.
                        <Image
                          src={p.main_img_url}
                          alt=""
                          fill
                          sizes="64px"
                          className={isRepresentativeImage(p.main_img_url) ? "object-cover" : "object-contain p-1.5"}
                        />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      {p ? (
                        <Link href={`/products/${p.slug}`} className="block truncate font-display text-[15px] font-medium hover:text-[var(--brand-primary)]">
                          {productDisplayName(p)}
                        </Link>
                      ) : (
                        <span className="block h-4 w-40" style={{ background: "var(--surface-secondary)" }} />
                      )}
                      {p ? (
                        <span className="mt-0.5 block truncate" style={{ fontSize: "var(--fs-body-sm)", color: "var(--text-secondary)" }}>
                          {[p.brand, p.sd_code, p.category].filter(Boolean).join(" · ")}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex shrink-0 items-center" style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xs)" }}>
                      <button
                        type="button"
                        onClick={() => setRequirementQty(line.productId, line.qty - 1)}
                        aria-label="Decrease quantity"
                        className="h-9 w-9 text-lg leading-none"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        −
                      </button>
                      <input
                        value={line.qty}
                        onChange={(e) => setRequirementQty(line.productId, Number(e.target.value.replace(/\D/g, "")) || 1)}
                        aria-label="Quantity"
                        inputMode="numeric"
                        className="metric w-10 bg-transparent text-center text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setRequirementQty(line.productId, line.qty + 1)}
                        aria-label="Increase quantity"
                        className="h-9 w-9 text-lg leading-none"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        +
                      </button>
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFromRequirement(line.productId)}
                      aria-label="Remove from requirement"
                      className="shrink-0 text-xl leading-none"
                      style={{ color: "var(--text-muted)" }}
                    >
                      ×
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button type="button" variant="primary" onClick={sendRequirement}>
                Send this requirement →
              </Button>
              <Link href="/products" className={buttonClasses("secondary")}>
                Keep browsing
              </Link>
              <button
                type="button"
                onClick={clearRequirement}
                className="ml-auto text-sm underline"
                style={{ color: "var(--text-muted)" }}
              >
                Clear all
              </button>
            </div>
            <p className="mt-4 max-w-xl" style={{ fontSize: "var(--fs-body-sm)", lineHeight: "var(--lh-normal)", color: "var(--text-secondary)" }}>
              You can add a BOQ, drawings or extra lines we don&rsquo;t stock on the next step. A person reads every
              requirement — first reply in under 15 minutes during business hours.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
