import Link from "next/link";

export interface ProofStat {
  value: string;
  label: string;
  href?: string;
}

/**
 * Facts, not adjectives. Every number here is computed from the same grouped
 * category-count RPC the mega-menu reads, so the site can't state two totals
 * for the same thing on one screen — which is exactly what the old hard-coded
 * "750+ SKUs" did next to the menu's own computed 3,184.
 */
export function ProofBand({ stats, note }: { stats: ProofStat[]; note?: string }) {
  return (
    <section
      className="border-y"
      style={{ borderColor: "var(--border-subtle)", background: "var(--surface-primary)" }}
      aria-label="Catalogue depth"
    >
      <div className="mx-auto max-w-6xl px-7">
        <dl className="grid grid-cols-2 md:grid-cols-4">
          {stats.map((s, i) => {
            const body = (
              <>
                <dd className="metric order-1 m-0" style={{ fontSize: "var(--fs-metric)", lineHeight: 1 }}>
                  {s.value}
                </dd>
                <dt className="order-2 mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  {s.label}
                </dt>
              </>
            );
            return (
              <div
                key={s.label}
                // Hairline separators between cells only — a full box around
                // each one would turn a proof strip into four more cards.
                className={[
                  "flex flex-col py-7 md:py-10",
                  i % 2 === 1 ? "border-l pl-6" : "pr-6",
                  i >= 2 ? "border-t md:border-t-0" : "",
                  "md:border-l md:pl-6",
                  i === 0 ? "md:border-l-0 md:pl-0" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                style={{ borderColor: "var(--border-subtle)" }}
              >
                {s.href ? (
                  <Link href={s.href} className="flex flex-col transition-colors hover:text-[var(--brand-primary)]">
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </div>
            );
          })}
        </dl>
        {note ? (
          <p className="border-t py-4 text-[13px]" style={{ borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
            {note}
          </p>
        ) : null}
      </div>
    </section>
  );
}
