import { listItems } from "@/lib/growth/queries";
import { Panel, PanelHeader, EmptyState, StatusPill } from "@/components/admin/growth/ui";
import { QuickAddForm } from "@/components/admin/growth/QuickAddForm";

export const metadata = { title: "Growth Command Center — Meta Ads" };

const METRIC_COLUMNS = ["Spend", "Impressions", "CTR", "CPC", "Leads", "CPL", "Quote Requests", "Orders", "CAC", "Revenue", "ROAS"];

export default async function AdsPage() {
  const [campaigns, ideas] = await Promise.all([
    listItems({ module: "ads", type: "campaign" }),
    listItems({ module: "ads", type: "campaign_idea" }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader title="Campaigns" />
        {campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns running"
            body="No Meta Marketing API connection exists — see Growth Analytics → Integrations. Campaigns created here track intent and results once ads exist; metrics stay blank rather than fabricated."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase tracking-wide" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
                  <th className="px-4 py-2">Campaign</th>
                  {METRIC_COLUMNS.map((m) => (
                    <th key={m} className="px-3 py-2 text-right">
                      {m}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
                {campaigns.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">{c.title}</td>
                    {METRIC_COLUMNS.map((m) => (
                      <td key={m} className="px-3 py-2 text-right" style={{ color: "var(--line-strong)" }}>
                        —
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Campaign idea library"
          action={
            <QuickAddForm module="ads" type="campaign_idea" fields={[{ key: "title", label: "Campaign family" }, { key: "hook", label: "Hook", topLevel: false }]} defaultStatus="hypothesis" />
          }
        />
        {ideas.length === 0 ? (
          <EmptyState title="No campaign ideas yet" body='Run "node scripts/seed-growth.mjs" to load the 5 starting hypotheses (Price Transparency, BOQ, Contractor Procurement, Cold Press, Studio).' />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {ideas.map((i) => {
              const hook = (i.data as { hook?: string }).hook;
              return (
                <li key={i.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--burgundy)" }}>
                      {i.title}
                    </span>
                    <StatusPill status={i.status} />
                  </div>
                  {hook ? <p className="text-sm">&ldquo;{hook}&rdquo;</p> : null}
                </li>
              );
            })}
          </ul>
        )}
        <p className="border-t px-4 py-2 text-xs" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
          Starting hypotheses, not validated winners — test before scaling any of these.
        </p>
      </Panel>
    </div>
  );
}
