import Link from "next/link";
import { unitLabel } from "@/lib/pricing";
import type { PriceRangeGroup } from "@/lib/priceRows";

// One row per brand + collection, for catalogues where a single rate covers
// hundreds of shades (laminates). Shows how many shades sit behind each rate
// and links into the real filtered category page rather than inventing a URL.
export function PriceRangeTable({ groups }: { groups: PriceRangeGroup[] }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--line)" }}>
            <th className="px-3 py-2 text-left font-medium">Brand &amp; range</th>
            <th className="px-3 py-2 text-left font-medium">Shades</th>
            <th className="px-3 py-2 text-left font-medium">Thickness</th>
            <th className="px-3 py-2 text-left font-medium">Sheet size</th>
            <th className="px-3 py-2 text-left font-medium">Rate</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <tr key={`${group.brand}-${group.collection ?? "other"}`} style={{ borderBottom: "1px solid var(--line)" }}>
              <td className="px-3 py-3">
                <Link href={group.href} className="font-medium hover:opacity-70">
                  {group.brand}
                  {group.collection ? ` — ${group.collection}` : ""}
                </Link>
                {group.samples.length ? (
                  <p className="mt-0.5 text-xs" style={{ color: "var(--line-strong)" }}>
                    e.g. {group.samples.slice(0, 3).map((s) => (s.code ? `${s.name} (${s.code})` : s.name)).join(", ")}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-3">{group.count}</td>
              <td className="px-3 py-3">{group.thicknesses.join(", ") || "—"}</td>
              <td className="px-3 py-3">{group.sizes.join(", ") || "—"}</td>
              <td className="px-3 py-3">
                {group.price ? (
                  <>
                    <span className="font-medium" style={{ color: "var(--burgundy)" }}>
                      {group.price.kind === "range"
                        ? `₹${group.price.min} – ₹${group.price.max}/${unitLabel(group.price.unit)}`
                        : `₹${group.price.amount}/${unitLabel(group.price.unit)}`}
                    </span>
                    {group.mixedRates ? (
                      <span className="mt-0.5 block text-xs" style={{ color: "var(--line-strong)" }}>
                        Rate loaded for part of this range
                      </span>
                    ) : null}
                  </>
                ) : (
                  <Link href={group.href} className="hover:opacity-70" style={{ color: "var(--line-strong)" }}>
                    Request current price
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
