export function OfferBox({ cashbackPct }: { cashbackPct: number }) {
  return (
    <div
      className="mb-3 flex items-center justify-between gap-3 rounded-sm border border-dashed px-4 py-2.5"
      style={{ borderColor: "var(--accent)", background: "color-mix(in srgb, var(--accent) 8%, transparent)" }}
    >
      <p className="text-sm font-semibold" style={{ color: "var(--accent)" }}>
        Instant Cashback up to {cashbackPct}%
      </p>
      <p className="text-[11px]" style={{ color: "var(--line-strong)" }}>
        T&amp;C apply
      </p>
    </div>
  );
}
