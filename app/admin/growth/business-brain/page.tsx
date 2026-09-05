import { getAllMemory } from "@/lib/growth/queries";
import { Panel, PanelHeader, EmptyState } from "@/components/admin/growth/ui";
import { MemoryEditor } from "@/components/admin/growth/MemoryEditor";
import type { GrowthMemorySection } from "@/lib/growth/types";

export const metadata = { title: "Growth Command Center — Business Brain" };

const SECTION_LABEL: Record<GrowthMemorySection, string> = {
  company: "Company",
  icp: "ICP Library",
  positioning: "Positioning",
  brand_voice: "Brand Voice",
  growth_goals: "Growth Goals",
  content_pillars: "Content Pillars",
};

const SECTION_ORDER: GrowthMemorySection[] = ["company", "icp", "positioning", "brand_voice", "growth_goals", "content_pillars"];

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export default async function BusinessBrainPage() {
  const rows = await getAllMemory();
  const byId = new Map(rows.map((r) => [r.id, r]));

  if (rows.length === 0) {
    return (
      <Panel>
        <EmptyState
          title="Business Brain is empty"
          body='Run "node scripts/seed-growth.mjs" to load the initial context from /growth/*.json into growth_memory.'
        />
      </Panel>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-2xl text-sm" style={{ color: "var(--line-strong)" }}>
        The context every growth workflow reads before generating anything — SEO briefs, outreach, ad angles, CRO copy. Source of truth is
        this table (<code>growth_memory</code>); <code>/growth/*.json</code> in the repo is the version-controlled seed, not synced live.
      </p>
      {SECTION_ORDER.map((id) => {
        const row = byId.get(id);
        return (
          <Panel key={id}>
            <PanelHeader
              title={SECTION_LABEL[id]}
              action={
                <span className="flex items-center gap-2 text-xs" style={{ color: "var(--line-strong)" }}>
                  <span style={{ color: "#2F6B4B" }}>●</span> ACTIVE
                  {row ? <span>· Updated {timeAgo(row.updated_at)}{row.updated_by ? ` by ${row.updated_by}` : ""}</span> : null}
                </span>
              }
            />
            <div className="p-4">
              {row ? (
                <MemoryEditor id={id} initialData={row.data} />
              ) : (
                <EmptyState title="Not seeded" body={`No ${SECTION_LABEL[id]} row yet. Run the seed script.`} />
              )}
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
