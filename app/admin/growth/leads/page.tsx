import { listItems } from "@/lib/growth/queries";
import { Panel, PanelHeader, EmptyState, StatusPill } from "@/components/admin/growth/ui";
import { QuickAddForm } from "@/components/admin/growth/QuickAddForm";
import { OutreachGenerator } from "@/components/admin/growth/OutreachGenerator";
import type { ProspectData } from "@/lib/growth/types";
import { PROSPECT_STAGES } from "@/lib/growth/types";

export const metadata = { title: "Growth Command Center — Lead Generation" };

export default async function LeadsPage() {
  const prospects = await listItems({ module: "leads", type: "prospect" });

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <div className="border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
          <p className="text-sm">
            Priority ICP: companies executing interior projects <strong>outside their home market</strong> that may need a reliable local
            procurement partner — turnkey interior contractors, design-build firms, retail rollout firms, hospitality fit-out companies,
            project management firms, premium interior firms, architects with execution responsibility. The pitch is{" "}
            <strong>&ldquo;EightByFour can act as the local material procurement desk for your project&rdquo;</strong> — not &ldquo;we sell
            plywood.&rdquo;
          </p>
        </div>
        <PanelHeader
          title={`Prospects (${prospects.length})`}
          action={
            <QuickAddForm
              module="leads"
              type="prospect"
              fields={[
                { key: "title", label: "Company" },
                { key: "website", label: "Website" },
                { key: "city", label: "City" },
                { key: "companyType", label: "Company type" },
                { key: "reasonForFit", label: "Reason for fit" },
                { key: "contactPerson", label: "Contact person" },
              ]}
              defaultStatus="New"
            />
          }
        />
        {prospects.length === 0 ? (
          <EmptyState
            title="No prospects yet"
            body={`Stages run ${PROSPECT_STAGES.join(" → ")}. Add a lead to start — priority ICP is above.`}
          />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {prospects.map((p) => {
              const d = p.data as Partial<ProspectData>;
              return (
                <li key={p.id} className="flex flex-col gap-2 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="serif" style={{ fontSize: "var(--fs-h3)" }}>
                        {p.title}
                      </span>
                      {d.website ? (
                        <span className="ml-2 text-xs" style={{ color: "var(--line-strong)" }}>
                          {d.website}
                        </span>
                      ) : null}
                    </div>
                    <StatusPill status={p.status} />
                  </div>
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                    {(
                      [
                        ["City", d.city],
                        ["Company type", d.companyType],
                        ["Contact", d.contactPerson],
                        ["Likely need", d.likelyNeed],
                      ] as const
                    )
                      .filter(([, v]) => v)
                      .map(([label, value]) => (
                        <div key={label}>
                          <dt className="text-xs" style={{ color: "var(--line-strong)" }}>
                            {label}
                          </dt>
                          <dd>{value}</dd>
                        </div>
                      ))}
                  </dl>
                  {d.reasonForFit ? (
                    <p className="text-sm font-medium" style={{ color: "var(--burgundy)" }}>
                      {d.reasonForFit}
                    </p>
                  ) : null}
                  <OutreachGenerator company={p.title} data={d} />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
