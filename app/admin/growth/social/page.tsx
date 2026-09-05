import { getMemory, listItems } from "@/lib/growth/queries";
import { Panel, PanelHeader, EmptyState, StatusPill } from "@/components/admin/growth/ui";
import { QuickAddForm } from "@/components/admin/growth/QuickAddForm";
import type { SocialPostData } from "@/lib/growth/types";

export const metadata = { title: "Growth Command Center — Social" };

interface ContentPillar {
  id: string;
  name: string;
}

export default async function SocialPage() {
  const [posts, pillarsRow] = await Promise.all([
    listItems({ module: "social", type: "post" }),
    getMemory("content_pillars"),
  ]);
  const contentPillars = (pillarsRow?.data as ContentPillar[] | undefined) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader title="Content pillars" />
        <div className="flex flex-wrap gap-2 p-4">
          {contentPillars.map((p) => (
            <span key={p.id} className="px-2.5 py-1 text-xs" style={{ background: "var(--paper-dim)", borderRadius: "var(--radius-xs)" }}>
              {p.name}
            </span>
          ))}
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title={`Content calendar (${posts.length})`}
          action={
            <QuickAddForm
              module="social"
              type="post"
              fields={[
                { key: "title", label: "Hook / working title" },
                { key: "platform", label: "Platform (LinkedIn/Instagram/X)" },
                { key: "format", label: "Format" },
                { key: "audience", label: "Audience" },
                { key: "cta", label: "CTA" },
              ]}
              defaultStatus="Idea"
            />
          }
        />
        {posts.length === 0 ? (
          <EmptyState title="No posts planned yet" body="Statuses run Idea → Draft → Approved → Scheduled → Published." />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {posts.map((p) => {
              const d = p.data as Partial<SocialPostData>;
              return (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div>
                    <span className="font-medium">{p.title}</span>
                    {d.platform ? (
                      <span className="ml-2 text-xs" style={{ color: "var(--line-strong)" }}>
                        {d.platform}
                      </span>
                    ) : null}
                  </div>
                  <StatusPill status={p.status} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Scheduling integration" />
        <div className="p-4 text-sm" style={{ color: "var(--line-strong)" }}>
          No Typefully (or other scheduler) connection exists. Posts publish manually until an adapter is wired — see Growth Analytics →
          Integrations. Not mandatory: this module is fully usable as a planning calendar without it.
        </div>
      </Panel>
    </div>
  );
}
