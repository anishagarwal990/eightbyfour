import { listItems } from "@/lib/growth/queries";
import { Panel, PanelHeader, EmptyState, StatusPill } from "@/components/admin/growth/ui";
import { QuickAddForm } from "@/components/admin/growth/QuickAddForm";
import type { CreativeBriefData } from "@/lib/growth/types";

export const metadata = { title: "Growth Command Center — Creative Studio" };

export default async function CreativePage() {
  const briefs = await listItems({ module: "creative", type: "brief" });

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader
          title={`Creative briefs (${briefs.length})`}
          action={
            <QuickAddForm
              module="creative"
              type="brief"
              fields={[
                { key: "title", label: "Campaign" },
                { key: "audience", label: "Audience" },
                { key: "hook", label: "Hook" },
                { key: "cta", label: "CTA" },
                { key: "format", label: "Format" },
              ]}
              defaultStatus="Idea"
            />
          }
        />
        {briefs.length === 0 ? (
          <EmptyState
            title="No creative briefs yet"
            body="Covers Meta static ads, video ads, reels, product videos, carousels, price creatives, comparison graphics, Studio demos, website creatives. Add a brief to start."
          />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {briefs.map((b) => {
              const d = b.data as Partial<CreativeBriefData>;
              return (
                <li key={b.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{b.title}</span>
                    <StatusPill status={b.status} />
                  </div>
                  {d.hook ? (
                    <p className="text-sm" style={{ color: "var(--line-strong)" }}>
                      &ldquo;{d.hook}&rdquo;
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Production tools" />
        <div className="p-4 text-sm" style={{ color: "var(--line-strong)" }}>
          No Higgsfield, Remotion, Canva or image-generation integration is wired. Briefs are produced and tracked here regardless — the
          production tool is a separate, swappable step, not a dependency of this module.
        </div>
      </Panel>
    </div>
  );
}
