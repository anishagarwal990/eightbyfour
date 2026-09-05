import { getMemory, listItems } from "@/lib/growth/queries";
import { Panel, PanelHeader, EmptyState, ConfidenceTag } from "@/components/admin/growth/ui";
import { QuickAddForm } from "@/components/admin/growth/QuickAddForm";

export const metadata = { title: "Growth Command Center — Customer Intelligence" };

interface IcpEntry {
  id: string;
  name: string;
  painPoints: string[];
  buyingTriggers: string[];
  objections: string[];
  priceSensitivity: string;
  bestCta: string;
  recommendedOffer: string;
}

const INSIGHT_SOURCES = ["Customer call", "WhatsApp observation", "Reddit", "Review", "Sales objection", "FAQ"];

export default async function CustomerIntelligencePage() {
  const [icpRow, insights] = await Promise.all([
    getMemory("icp"),
    listItems({ module: "customer_intelligence", type: "insight" }),
  ]);
  const icps = (icpRow?.data as IcpEntry[] | undefined) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader title={`ICP library (${icps.length})`} action={<a href="/admin/growth/business-brain" className="text-xs underline">Edit in Business Brain →</a>} />
        {icps.length === 0 ? (
          <EmptyState title="No ICPs defined" body="Seed Business Brain first: node scripts/seed-growth.mjs." />
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--line)" }}>
            {icps.map((icp) => (
              <details key={icp.id} className="px-4 py-3">
                <summary className="cursor-pointer font-medium">{icp.name}</summary>
                <div className="mt-2 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs" style={{ color: "var(--line-strong)" }}>Pain points</p>
                    <ul className="list-inside list-disc">{icp.painPoints?.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--line-strong)" }}>Buying triggers</p>
                    <ul className="list-inside list-disc">{icp.buyingTriggers?.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--line-strong)" }}>Objections</p>
                    <ul className="list-inside list-disc">{icp.objections?.map((p) => <li key={p}>{p}</li>)}</ul>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--line-strong)" }}>Best CTA</p>
                    <p>{icp.bestCta}</p>
                  </div>
                </div>
              </details>
            ))}
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Customer insights"
          action={
            <QuickAddForm
              module="customer_intelligence"
              type="insight"
              fields={[
                { key: "title", label: "What was observed" },
                { key: "confidence", label: "observed / inferred / hypothesis" },
                { key: "source", label: "Source (e.g. Customer call, WhatsApp)" },
                { key: "evidence", label: "Quote / detail" },
              ]}
            />
          }
        />
        {insights.length === 0 ? (
          <EmptyState
            title="No customer insights logged yet"
            body={`Log real observations as they happen — from ${INSIGHT_SOURCES.join(", ")}. Each one is tagged observed/inferred/hypothesis, never presented as settled fact.`}
          />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {insights.map((i) => (
              <li key={i.id} className="flex flex-col gap-1 px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <ConfidenceTag confidence={i.confidence} />
                  <span className="font-medium">{i.title}</span>
                  {i.source ? (
                    <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                      — {i.source}
                    </span>
                  ) : null}
                </div>
                {i.evidence ? (
                  <p className="text-sm italic" style={{ color: "var(--line-strong)" }}>
                    &ldquo;{i.evidence}&rdquo;
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
