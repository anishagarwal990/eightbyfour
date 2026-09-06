"use client";

import type { KitchenBoq } from "@/lib/studio/kitchen/pricing";

/**
 * The bill of quantities, generated from the configured kitchen.
 *
 * This is the artefact a carpenter or a contractor actually wants: how many
 * sheets, how many hinges, how many running feet. Every row here is counted
 * from the geometry, not estimated from a rate per square foot.
 */
export function BoqView({ boq, wastageNote }: { boq: KitchenBoq; wastageNote: string }) {
  const sections: { title: string; rows: KitchenBoq["cabinets"]; note?: string }[] = [
    { title: "Cabinets", rows: boq.cabinets },
    { title: "Sheet materials", rows: boq.sheets, note: wastageNote },
    { title: "Hardware & accessories", rows: boq.hardware },
    { title: "Surfaces", rows: boq.surfaces },
  ];

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-[720px] space-y-6">
        {sections.map((s) => (
          <section key={s.title}>
            <h3 className="tracked-caps text-[10px]" style={{ color: "var(--ink-faint)" }}>
              {s.title}
            </h3>
            <table className="mt-2 w-full border-collapse">
              <tbody>
                {s.rows.map((r, i) => (
                  <tr key={`${r.label}-${i}`} className="border-t" style={{ borderColor: "var(--studio-line)" }}>
                    <td className="py-2 pr-3">
                      <span className="block text-[13px] font-medium leading-tight">{r.label}</span>
                      {r.detail ? (
                        <span className="mt-0.5 block text-[11px]" style={{ color: "var(--ink-faint)" }}>
                          {r.detail}
                        </span>
                      ) : null}
                    </td>
                    <td className="metric whitespace-nowrap py-2 text-right text-[13px]">
                      {r.qty} <span style={{ color: "var(--ink-faint)" }}>{r.unit}</span>
                    </td>
                  </tr>
                ))}
                {s.rows.length === 0 ? (
                  <tr>
                    <td className="py-2 text-[12px]" style={{ color: "var(--ink-faint)" }}>
                      Nothing in this section yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            {s.note ? (
              <p className="mt-1.5 text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
                {s.note}
              </p>
            ) : null}
          </section>
        ))}
        <p className="text-[11px] leading-snug" style={{ color: "var(--ink-faint)" }}>
          Quantities are derived from the configuration above and are for planning. They are confirmed against a site
          measurement before anything is cut or ordered.
        </p>
      </div>
    </div>
  );
}
