import { listItems } from "@/lib/growth/queries";
import { computeCategoryPageGaps } from "@/lib/growth/seoGaps";
import { Panel, PanelHeader, EmptyState, StatusPill } from "@/components/admin/growth/ui";
import { QuickAddForm } from "@/components/admin/growth/QuickAddForm";
import { RunAnalysisButton } from "@/components/admin/growth/RunAnalysisButton";
import type { ContentQueueData } from "@/lib/growth/types";

export const metadata = { title: "Growth Command Center — SEO / GEO" };

export default async function SeoPage() {
  const [content, pageGaps] = await Promise.all([
    listItems({ module: "seo", type: "content" }),
    computeCategoryPageGaps(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader
          title="Keyword opportunities"
          action={
            <RunAnalysisButton
              module="seo"
              type="SEO_RESEARCH"
              title="Pull keyword opportunities from Search Console"
              prompt="Once Google Search Console is connected, pull top queries by impressions/position and cross-reference against lib/pricePages.ts + lib/categories.ts for pages that don't exist yet."
              label="Run keyword research"
            />
          }
        />
        <EmptyState
          title="No keyword data connected"
          body="Volume, difficulty and current rank need Google Search Console (see Integrations — currently not connected). Queuing keyword research here creates a task record; it does not fabricate a volume number."
        />
      </Panel>

      <Panel>
        <PanelHeader title={`Page opportunities — real, from lib/categories.ts × lib/pricePages.ts (${pageGaps.length} categories)`} />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Price pages</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--line)" }}>
              {pageGaps.map((g) => (
                <tr key={g.categorySlug}>
                  <td className="px-4 py-2">{g.categoryName}</td>
                  <td className="px-4 py-2 tabular-nums">{g.pricePageCount}</td>
                  <td className="px-4 py-2">
                    {g.hasPricePage ? (
                      <span style={{ color: "#2F6B4B" }}>Covered</span>
                    ) : (
                      <span style={{ color: "#B4652F" }}>No dedicated page</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Content queue"
          action={
            <QuickAddForm
              module="seo"
              type="content"
              fields={[
                { key: "title", label: "Working title" },
                { key: "seoKeyword", label: "Target keyword" },
                { key: "targetUrl", label: "Target URL" },
                { key: "funnelStage", label: "Funnel stage" },
              ]}
              defaultStatus="Idea"
            />
          }
        />
        {content.length === 0 ? (
          <EmptyState title="Nothing in the content queue" body="Statuses run Idea → Brief → Draft → Review → Published → Needs Update." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {content.map((c) => {
              const d = c.data as Partial<ContentQueueData>;
              return (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <span className="font-medium">{c.title}</span>
                    {d.targetUrl ? (
                      <span className="ml-2 text-xs" style={{ color: "var(--line-strong)" }}>
                        → {d.targetUrl}
                      </span>
                    ) : null}
                  </div>
                  <StatusPill status={c.status} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
