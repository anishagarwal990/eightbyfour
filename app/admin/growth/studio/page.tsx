import { listItems } from "@/lib/growth/queries";
import { Panel, PanelHeader, EmptyState, StatusPill } from "@/components/admin/growth/ui";
import { QuickAddForm } from "@/components/admin/growth/QuickAddForm";
import type { StudioServiceData } from "@/lib/growth/types";

export const metadata = { title: "Growth Command Center — Studio EightByFour" };

export default async function StudioPage() {
  const [services, opportunities] = await Promise.all([
    listItems({ module: "studio", type: "service" }),
    listItems({ module: "studio", type: "opportunity" }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader title={`Services (${services.length})`} />
        {services.length === 0 ? (
          <EmptyState title="No Studio services tracked" body='Run "node scripts/seed-growth.mjs" to load the 7 named services.' />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
                  <th className="px-4 py-2">Service</th>
                  <th className="px-3 py-2">Landing page</th>
                  <th className="px-3 py-2 text-right">Traffic</th>
                  <th className="px-3 py-2 text-right">Leads</th>
                  <th className="px-3 py-2 text-right">Estimator starts</th>
                  <th className="px-3 py-2 text-right">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                {services.map((s) => {
                  const d = s.data as Partial<StudioServiceData>;
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-2">{s.title}</td>
                      <td className="px-3 py-2" style={{ color: "var(--line-strong)" }}>
                        {d.landingPage ?? "Not live yet"}
                      </td>
                      <td className="px-3 py-2 text-right" style={{ color: "var(--line-strong)" }}>
                        —
                      </td>
                      <td className="px-3 py-2 text-right" style={{ color: "var(--line-strong)" }}>
                        —
                      </td>
                      <td className="px-3 py-2 text-right" style={{ color: "var(--line-strong)" }}>
                        —
                      </td>
                      <td className="px-3 py-2 text-right" style={{ color: "var(--line-strong)" }}>
                        —
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t px-4 py-3 text-xs" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
          Traffic/leads/estimator/conversion columns need GA4 Reporting + the actual estimator/service pages to exist and be instrumented —
          neither is live in this codebase yet. Dashes shown honestly rather than a fabricated number.
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title={`Content / marketing opportunities (${opportunities.length})`}
          action={
            <QuickAddForm module="studio" type="opportunity" fields={[{ key: "title", label: "Idea" }]} defaultStatus="idea" />
          }
        />
        {opportunities.length === 0 ? (
          <EmptyState title="No Studio content ideas yet" body="Wardrobe/kitchen cost calculators, carpenter-vs-modular comparison, plywood/shutter/laminate/accessories selectors — seed script loads 7 starting ideas." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {opportunities.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                <span>{o.title}</span>
                <StatusPill status={o.status} />
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
