import Link from "next/link";
import { effectiveDiscountPct, formatListPrice, formatPrice, type PriceRow } from "@/lib/priceRows";
import { formatDiscountPct } from "@/lib/pricing";

// One row per SKU. Scrolls inside its own container rather than letting a
// six-column table push the page body sideways on a phone, which is where
// most of this traffic lands.
export function PriceTable({ rows, focusThickness }: { rows: PriceRow[]; focusThickness: boolean }) {
  return (
    <div className="mt-5 overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: "1px solid var(--line)" }}>
            <th className="px-3 py-2 text-left font-medium">Brand &amp; product</th>
            <th className="px-3 py-2 text-left font-medium">Grade</th>
            <th className="px-3 py-2 text-left font-medium">{focusThickness ? "Thickness" : "Thickness span"}</th>
            <th className="px-3 py-2 text-left font-medium">Sheet size</th>
            <th className="px-3 py-2 text-left font-medium">Rate</th>
            <th className="px-3 py-2 text-left font-medium">Per sheet</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const price = formatPrice(row);
            const listPrice = formatListPrice(row);
            return (
              <tr key={row.slug} style={{ borderBottom: "1px solid var(--line)" }}>
                <td className="px-3 py-3">
                  <Link href={`/products/${row.slug}`} className="font-medium hover:opacity-70">
                    {row.displayName}
                  </Link>
                  {row.certifications?.length ? (
                    <p className="mt-0.5 text-xs" style={{ color: "var(--line-strong)" }}>
                      {row.certifications.join(" · ")}
                    </p>
                  ) : null}
                  {row.warranty ? (
                    <p className="mt-0.5 text-xs" style={{ color: "var(--line-strong)" }}>
                      {row.warranty}
                    </p>
                  ) : null}
                </td>
                <td className="px-3 py-3">{row.grade ?? "—"}</td>
                <td className="px-3 py-3">{(focusThickness ? row.focusThicknessLabel : row.thicknessSpan) ?? row.thicknessSpan ?? "—"}</td>
                <td className="px-3 py-3">{row.size ?? "—"}</td>
                <td className="px-3 py-3">
                  {price ? (
                    <>
                      {listPrice ? (
                        <span className="mr-1.5 text-xs line-through" style={{ color: "var(--line-strong)" }}>
                          {listPrice}
                        </span>
                      ) : null}
                      <span className="font-medium" style={{ color: "var(--burgundy)" }}>
                        {price}
                      </span>
                      {effectiveDiscountPct(row) ? (
                        <span className="mt-0.5 block text-xs" style={{ color: "var(--line-strong)" }}>
                          {formatDiscountPct(effectiveDiscountPct(row)!)}% discount applied
                        </span>
                      ) : null}
                    </>
                  ) : (
                    // No rate loaded for this product. Say so plainly rather
                    // than showing an estimate or borrowing a sibling's rate.
                    <Link href={`/products/${row.slug}`} className="hover:opacity-70" style={{ color: "var(--line-strong)" }}>
                      Request current price
                    </Link>
                  )}
                </td>
                <td className="px-3 py-3" style={{ color: "var(--line-strong)" }}>
                  {row.perSheet ? (row.perSheet.min === row.perSheet.max ? `₹${row.perSheet.min}` : `₹${row.perSheet.min} – ₹${row.perSheet.max}`) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
