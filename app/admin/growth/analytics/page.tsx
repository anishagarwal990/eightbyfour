import { getInquiryChannelBreakdown, getInquiryStats, listIntegrations, listTasks } from "@/lib/growth/queries";
import { Panel, PanelHeader, EmptyState, StatBlock, NotConnected, DataSourceCard, StatusPill } from "@/components/admin/growth/ui";

export const metadata = { title: "Growth Command Center — Growth Analytics" };

const FUNNEL = ["Visitors", "Product / Service Exploration", "Quote Intent", "Quote Request", "Qualified Lead", "Quote Sent", "Order", "Repeat Customer"];

export default async function AnalyticsPage() {
  const [stats, channels, integrations, tasks] = await Promise.all([
    getInquiryStats(90),
    getInquiryChannelBreakdown(90),
    listIntegrations(),
    listTasks(100),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader title="Acquisition funnel" />
        <div className="flex flex-wrap items-center gap-2 p-4 text-sm">
          {FUNNEL.map((stage, i) => (
            <span key={stage} className="flex items-center gap-2">
              <span
                className="px-2.5 py-1"
                style={{
                  background: stage === "Quote Request" ? "var(--burgundy)" : "var(--paper-dim)",
                  color: stage === "Quote Request" ? "#fff" : "var(--ink)",
                  borderRadius: "var(--radius-xs)",
                }}
              >
                {stage}
                {stage === "Quote Request" ? ` (${stats.total})` : ""}
              </span>
              {i < FUNNEL.length - 1 ? <span style={{ color: "var(--line-strong)" }}>→</span> : null}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-2 divide-y border-t sm:grid-cols-4 sm:divide-y-0" style={{ borderColor: "var(--line)" }}>
          <StatBlock label="Quote requests (90d)" value={String(stats.total)} sub="Real — public.inquiries" />
          <NotConnected label="Visitors" />
          <NotConnected label="Qualified lead rate" />
          <NotConnected label="Orders / revenue" />
        </div>
        <p className="border-t px-4 py-2 text-xs" style={{ borderColor: "var(--line)", color: "var(--line-strong)" }}>
          Only &ldquo;Quote Request&rdquo; is measured today (the <code>inquiries</code> table). Everything upstream needs GA4 Reporting;
          everything downstream needs an orders/CRM table that doesn&apos;t exist in this codebase yet.
        </p>
      </Panel>

      <Panel>
        <PanelHeader title={`Channel breakdown — real, from inquiries.utm_source (last 90 days)`} />
        {channels.length === 0 ? (
          <EmptyState title="No inquiries in the last 90 days" body="This table populates from the site's quote-request form the moment one comes in." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {channels.map((c) => (
              <li key={c.channel} className="flex items-center justify-between px-4 py-2 text-sm">
                <span>{c.channel}</span>
                <span className="tabular-nums font-medium">{c.count}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Integrations" />
        <div>
          {integrations.map((i) => (
            <DataSourceCard key={i.id} label={i.label} status={i.status} notes={i.notes} />
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={`All tasks (${tasks.length})`} />
        {tasks.length === 0 ? (
          <EmptyState title="No tasks yet" body="Created from a module's Run Analysis / Generate button, or the command palette." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {tasks.map((t) => (
              <li key={t.id} className="flex flex-col gap-0.5 px-4 py-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span>{t.title}</span>
                  <StatusPill status={t.status} />
                </div>
                <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                  {t.type} · {t.module} · {new Date(t.created_at).toLocaleString("en-IN")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
