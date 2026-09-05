import { listItems } from "@/lib/growth/queries";
import { Panel, PanelHeader, EmptyState, ConfidenceTag, PriorityTag, StatusPill } from "@/components/admin/growth/ui";
import { QuickAddForm } from "@/components/admin/growth/QuickAddForm";
import { RunAnalysisButton } from "@/components/admin/growth/RunAnalysisButton";
import { ScrapeCompetitorButton } from "@/components/admin/growth/ScrapeCompetitorButton";
import type { CompetitorData, OpportunityData } from "@/lib/growth/types";

export const metadata = { title: "Growth Command Center — Market Intelligence" };

export default async function MarketIntelligencePage() {
  const [competitors, opportunities] = await Promise.all([
    listItems({ module: "market_intelligence", type: "competitor" }),
    listItems({ module: "market_intelligence", type: "opportunity" }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <Panel>
        <PanelHeader
          title="Competitor profiles"
          action={
            <QuickAddForm
              module="market_intelligence"
              type="competitor"
              fields={[{ key: "title", label: "Company name" }, { key: "url", label: "URL", placeholder: "https://…" }]}
              defaultStatus="research_pending"
            />
          }
        />
        {competitors.length === 0 ? (
          <EmptyState
            title="No competitor research yet"
            body="Add a competitor, then run an analysis to create the first snapshot. Seeded competitors (Plywala, Materialogue, Kyzo, Aditya Plymart) start as Research pending — nothing is filled in until it's actually been looked at."
          />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {competitors.map((c) => {
              const d = c.data as Partial<CompetitorData>;
              const hasStructuredFields = Boolean(
                d.category || d.targetCustomer || d.positioning || d.pricingApproach || d.cta || d.seoPresence || d.socialPresence || d.advertisingObservations
              );
              return (
                <li key={c.id} className="flex flex-col gap-2 px-4 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="serif" style={{ fontSize: "var(--fs-h3)" }}>
                        {c.title}
                      </span>
                      {d.url ? (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-xs underline" style={{ color: "var(--line-strong)" }}>
                          {d.url.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                          URL not on file
                        </span>
                      )}
                    </div>
                    <StatusPill status={c.status} />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {d.url ? (
                      <ScrapeCompetitorButton itemId={c.id} />
                    ) : (
                      <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                        Add a URL to enable Firecrawl scraping.
                      </span>
                    )}
                    <RunAnalysisButton
                      module="market_intelligence"
                      type="COMPETITOR_ANALYSIS"
                      title={`Analyze ${c.title}`}
                      itemId={c.id}
                      label="Queue deeper analysis"
                      prompt={`Read the Firecrawl scrape already on this competitor's growth_items row (if present) plus its site directly, and fill in: positioning, pricing approach, product categories, CTA, trust signals, content strategy, SEO presence, social presence, advertising observations. Tag each fact observed/inferred/hypothesis with its source.`}
                    />
                  </div>

                  {d.firecrawlScrape ? (
                    <div className="border-l-2 pl-3" style={{ borderColor: "var(--line)" }}>
                      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--burgundy)" }}>
                        OBSERVED — Firecrawl scrape, {new Date(d.firecrawlScrape.scrapedAt).toLocaleString("en-IN")}
                      </p>
                      {d.firecrawlScrape.title ? <p className="mt-1 text-sm font-medium">{d.firecrawlScrape.title.trim()}</p> : null}
                      {d.firecrawlScrape.description ? (
                        <p className="text-sm" style={{ color: "var(--line-strong)" }}>
                          {d.firecrawlScrape.description}
                        </p>
                      ) : null}
                      <details className="mt-1">
                        <summary className="cursor-pointer text-xs underline" style={{ color: "var(--line-strong)" }}>
                          Raw page content ({d.firecrawlScrape.markdownExcerpt.length} chars, truncated)
                        </summary>
                        <pre className="mt-1 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs" style={{ color: "var(--line-strong)" }}>
                          {d.firecrawlScrape.markdownExcerpt}
                        </pre>
                      </details>
                    </div>
                  ) : null}

                  {hasStructuredFields ? (
                    <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      {(
                        [
                          ["Category", d.category],
                          ["Target customer", d.targetCustomer],
                          ["Positioning", d.positioning],
                          ["Pricing approach", d.pricingApproach],
                          ["CTA", d.cta],
                          ["SEO presence", d.seoPresence],
                          ["Social presence", d.socialPresence],
                          ["Advertising", d.advertisingObservations],
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
                      {d.opportunityForEightByFour ? (
                        <div className="sm:col-span-2">
                          <dt className="text-xs" style={{ color: "var(--line-strong)" }}>
                            Opportunity for EightByFour
                          </dt>
                          <dd className="font-medium">{d.opportunityForEightByFour}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--line-strong)" }}>
                      {d.firecrawlScrape
                        ? "Raw content scraped — structured fields (positioning, pricing approach, etc.) not filled in yet."
                        : "Research pending — no fields filled in until a real scrape or analysis has run."}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHeader
          title="Opportunities we can own"
          action={
            <QuickAddForm
              module="market_intelligence"
              type="opportunity"
              fields={[
                { key: "title", label: "Opportunity" },
                { key: "evidence", label: "Evidence" },
                { key: "eightByFourAngle", label: "EightByFour angle" },
                { key: "icp", label: "ICP" },
                { key: "priority", label: "Priority (high/medium/low)" },
              ]}
              defaultStatus="hypothesis"
            />
          }
        />
        {opportunities.length === 0 ? (
          <EmptyState
            title="No opportunities logged yet"
            body="Positioning-gap hypotheses go here — e.g. consolidated BOQ procurement, price transparency, outstation contractor procurement. Label each as hypothesis until validated."
          />
        ) : (
          <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
            {opportunities.map((o) => {
              const d = o.data as Partial<OpportunityData>;
              return (
                <li key={o.id} className="flex flex-col gap-1 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <ConfidenceTag confidence={o.confidence} />
                    <span className="font-medium">{o.title}</span>
                    <PriorityTag priority={o.priority} />
                  </div>
                  {d.eightByFourAngle ? (
                    <p className="text-sm" style={{ color: "var(--line-strong)" }}>
                      {d.eightByFourAngle}
                    </p>
                  ) : null}
                  {o.evidence ? (
                    <p className="text-xs italic" style={{ color: "var(--line-strong)" }}>
                      Evidence: {o.evidence}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}
