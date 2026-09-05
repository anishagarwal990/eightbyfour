import { listItems } from "@/lib/growth/queries";
import { Panel, PanelHeader, EmptyState, StatusPill } from "@/components/admin/growth/ui";
import { QuickAddForm } from "@/components/admin/growth/QuickAddForm";
import { RunAnalysisButton } from "@/components/admin/growth/RunAnalysisButton";
import type { CroIssueData } from "@/lib/growth/types";

export const metadata = { title: "Growth Command Center — Website CRO" };

const TRACKED_PAGES = ["Homepage", "Category pages", "Brand pages", "Product pages", "Quote page", "Studio EightByFour", "Calculators", "BOQ upload", "Services pages"];

export default async function CroPage() {
  const issues = await listItems({ module: "cro", type: "issue" });

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader
          title="Key pages tracked"
          action={
            <RunAnalysisButton
              module="cro"
              type="CRO_AUDIT"
              title="Audit key pages for CRO issues"
              prompt="Review homepage, category, brand, product, quote, Studio, calculator, BOQ-upload and services pages for structural CRO problems visible without analytics (unclear CTA, missing quote path, broken flow)."
              label="Run CRO audit"
            />
          }
        />
        <div className="flex flex-wrap gap-2 p-4">
          {TRACKED_PAGES.map((p) => (
            <span key={p} className="px-2.5 py-1 text-xs" style={{ background: "var(--paper-dim)", borderRadius: "var(--radius-xs)" }}>
              {p}
            </span>
          ))}
        </div>
        <div className="border-t px-4 py-3 text-xs" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
          Per-page traffic, entry rate, scroll depth, CTA clicks and conversion rate need the GA4 Reporting API (see Growth
          Analytics → Integrations — not connected). ViewTracker/trackEvent already fire real events client-side (lib/analytics.ts); this
          module will read them back once that connection exists.
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title={`CRO issues (${issues.length})`}
          action={
            <QuickAddForm
              module="cro"
              type="issue"
              fields={[
                { key: "title", label: "Issue" },
                { key: "affectedPage", label: "Affected page" },
                { key: "evidence", label: "Evidence" },
                { key: "recommendedChange", label: "Recommended change" },
              ]}
              defaultStatus="open"
            />
          }
        />
        {issues.length === 0 ? (
          <EmptyState title="No CRO issues logged" body="Run a CRO audit above, or log an issue you've observed directly." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {issues.map((i) => {
              const d = i.data as Partial<CroIssueData>;
              return (
                <li key={i.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{i.title}</span>
                    <StatusPill status={i.status} />
                  </div>
                  {d.affectedPage ? (
                    <p className="text-xs" style={{ color: "var(--line-strong)" }}>
                      {d.affectedPage}
                    </p>
                  ) : null}
                  {d.recommendedChange ? <p className="text-sm">{d.recommendedChange}</p> : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
