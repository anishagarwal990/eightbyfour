import Link from "next/link";
import { getOverviewCounts, getInquiryStats, listIntegrations, listTasks } from "@/lib/growth/queries";
import { computeCategoryPageGaps } from "@/lib/growth/seoGaps";
import { Panel, PanelHeader, StatBlock, NotConnected, DataSourceCard, EmptyState, StatusPill } from "@/components/admin/growth/ui";

export const metadata = { title: "Growth Command Center — Overview" };

export default async function GrowthOverviewPage() {
  const [counts, inquiries, integrations, tasks, pageGaps] = await Promise.all([
    getOverviewCounts(),
    getInquiryStats(28),
    listIntegrations(),
    listTasks(8),
    computeCategoryPageGaps(),
  ]);

  const uncoveredCategories = pageGaps.filter((g) => !g.hasPricePage);

  return (
    <div className="flex flex-col gap-6">
      {/* Growth pulse — real numbers only. Traffic/quote-conversion/revenue
          stay "Not connected" because no GA4 reporting API, no order table
          and no revenue field exist in this codebase today (see
          growth_integrations for why, module by module). */}
      <Panel>
        <PanelHeader title="Growth pulse" />
        <div className="grid grid-cols-2 divide-y sm:grid-cols-4 sm:divide-y-0" style={{ borderColor: "var(--line)" }}>
          <StatBlock label="Inquiries (28d)" value={String(inquiries.recent)} sub={`${inquiries.total} all-time — real, from public.inquiries`} />
          <StatBlock label="Competitors tracked" value={String(counts.competitorsTracked)} sub={`${counts.competitorsPending} pending research`} />
          <StatBlock label="Open opportunities" value={String(counts.openOpportunities)} />
          <StatBlock label="Prospects to contact" value={String(counts.prospectsToContact)} />
        </div>
        <div className="grid grid-cols-2 divide-y border-t sm:grid-cols-4 sm:divide-y-0" style={{ borderColor: "var(--line)" }}>
          <NotConnected label="Website traffic" />
          <NotConnected label="Organic clicks" />
          <NotConnected label="WhatsApp leads" />
          <NotConnected label="Revenue" />
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel>
            <PanelHeader title="This week" />
            <div className="grid grid-cols-2 gap-px sm:grid-cols-3" style={{ background: "var(--line)" }}>
              {[
                { label: "Competitors to review", value: counts.competitorsPending, href: "/admin/growth/market-intelligence" },
                { label: "Content in queue", value: counts.contentInQueue, href: "/admin/growth/seo" },
                { label: "Leads to contact", value: counts.prospectsToContact, href: "/admin/growth/leads" },
                { label: "CRO issues open", value: counts.croIssuesOpen, href: "/admin/growth/cro" },
                { label: "Tasks queued", value: counts.tasksQueued, href: "/admin/growth/analytics" },
                { label: "Tasks needing review", value: counts.tasksNeedingReview, href: "/admin/growth/analytics" },
              ].map((c) => (
                <Link key={c.label} href={c.href} className="flex flex-col gap-1 p-4 hover:bg-[var(--paper-dim)]" style={{ background: "var(--paper)" }}>
                  <span className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                    {c.value}
                  </span>
                  <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                    {c.label}
                  </span>
                </Link>
              ))}
            </div>
          </Panel>

          <div className="mt-6">
            <Panel>
              <PanelHeader title="Opportunity feed — real, computed from the site's own config" />
              {uncoveredCategories.length === 0 ? (
                <EmptyState title="Every category has a price page" body="No structural page gap detected against the current catalogue." />
              ) : (
                <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                  {uncoveredCategories.map((g) => (
                    <li key={g.categorySlug} className="flex items-start gap-3 px-4 py-3">
                      <span
                        className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                        style={{ color: "#B4652F" }}
                      >
                        MEDIUM
                      </span>
                      <div>
                        <p className="text-sm">
                          <strong>{g.categoryName}</strong> has no dedicated Hyderabad price page yet.
                        </p>
                        <p className="text-xs" style={{ color: "var(--line-strong)" }}>
                          OBSERVED — computed from lib/categories.ts vs lib/pricePages.ts on {new Date().toLocaleDateString("en-IN")}. This
                          category has {g.pricePageCount} dedicated price page{g.pricePageCount === 1 ? "" : "s"}.
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="border-t px-4 py-3 text-xs" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
                Keyword-volume-backed opportunities (the kind with a &ldquo;high commercial intent, no page&rdquo; verdict) need Search
                Console or a
                keyword-data connection — see Integrations below. This feed only shows what can be verified from the repo today.
              </div>
            </Panel>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <Panel>
            <PanelHeader title="Integrations" action={<Link href="/admin/growth/analytics" className="text-xs underline">Manage →</Link>} />
            <div>
              {integrations.map((i) => (
                <DataSourceCard key={i.id} label={i.label} status={i.status} notes={i.notes} />
              ))}
            </div>
          </Panel>

          <Panel>
            <PanelHeader title="Recent tasks" />
            {tasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                body="Tasks are created from a module's Run Analysis / Generate action, or from the command palette (⌘K)."
              />
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-2 px-4 py-2.5 text-sm">
                    <span className="truncate">{t.title}</span>
                    <StatusPill status={t.status} />
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
