import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { CollectionPageSchema } from "@/components/schema/CollectionPageSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { PriceTable } from "@/components/PriceTable";
import { PriceRangeTable } from "@/components/PriceRangeTable";
import { BoqCtaBlock } from "@/components/BoqCtaBlock";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";
import { WhatsAppTrackedLink } from "@/components/WhatsAppTrackedLink";
import { ViewTracker } from "@/components/ViewTracker";
import { Reveal } from "@/components/Reveal";
import { buttonClasses } from "@/components/ui/Button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { unitLabel } from "@/lib/pricing";
import { formatPrice, priceSpan, resolvePicks, type PriceRangeGroup, type PriceRow } from "@/lib/priceRows";
import type { PricePageConfig } from "@/lib/pricePages";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
      {children}
    </h2>
  );
}

export function PricePageView({
  config,
  rows,
  groups,
}: {
  config: PricePageConfig;
  rows: PriceRow[];
  groups: PriceRangeGroup[];
}) {
  const picks = resolvePicks(config.picks, rows);
  const pricedCount = rows.filter((r) => r.price !== null).length;
  // A headline range is only honest when every figure behind it belongs to
  // the thickness in the H1. Most products carry one rate band spanning
  // 4–25mm, so on a thickness page the aggregate low would be a 4mm price
  // presented as an 18mm one — suppress it and let the table speak instead.
  const exactAtFocus =
    config.focusThicknessMm === undefined || rows.every((r) => r.price === null || r.focusThicknessPrice !== null);
  const span = exactAtFocus ? priceSpan(rows) : null;
  const brandCount = new Set(rows.map((r) => r.brand)).size;
  const whatsappMessage = `Hi, I'm looking at "${config.h1}" on eightbyfour.com — here's my requirement:`;

  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Hyderabad", path: "/hyderabad" },
          { name: config.h1, path: `/hyderabad/${config.slug}` },
        ]}
      />
      <FaqSchema faqs={config.faqs} />
      {/* ItemList of exactly what the table above renders — the grouped ranges
          on a "ranges" page, the individual SKUs on a "table" one, so the
          structured data can't describe entries a reader cannot see. Name and
          URL only: no Product/Offer markup, because the prices here are spans
          across a thickness range that an Offer's single price field would
          misrepresent. */}
      <CollectionPageSchema
        name={config.h1}
        path={`/hyderabad/${config.slug}`}
        totalItems={config.layout === "ranges" ? groups.length : rows.length}
        items={
          config.layout === "ranges"
            ? groups.slice(0, 50).map((g) => ({ name: g.collection ? `${g.brand} — ${g.collection}` : g.brand, url: g.href }))
            : rows.slice(0, 50).map((r) => ({ name: r.displayName, url: `/products/${r.slug}` }))
        }
        pageOffset={0}
      />
      <ViewTracker
        event="price_page_view"
        params={{ price_page: config.slug, products: rows.length, priced_products: pricedCount }}
        dedupeKey={config.slug}
      />

      <div className="mx-auto max-w-6xl">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Hyderabad", href: "/hyderabad" },
            { label: config.h1 },
          ]}
        />

        <section className="px-7 py-8">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            {config.eyebrow}
          </p>
          <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
            {config.h1}
          </h1>
          {span ? (
            <p className="mt-3 text-base">
              <span className="font-medium" style={{ color: "var(--burgundy)" }}>
                {span.min === span.max ? `₹${span.min}` : `₹${span.min} – ₹${span.max}`}/{unitLabel(span.unit)}
              </span>{" "}
              <span style={{ color: "var(--line-strong)" }}>
                across {pricedCount} priced {pricedCount === 1 ? "product" : "products"}
                {brandCount > 1 ? ` from ${brandCount} brands` : ""}, excluding GST.
              </span>
            </p>
          ) : pricedCount > 0 ? (
            <p className="mt-3 text-base" style={{ color: "var(--line-strong)" }}>
              {pricedCount} priced {pricedCount === 1 ? "product" : "products"}
              {brandCount > 1 ? ` from ${brandCount} brands` : ""} stocked at this thickness. Rates below are quoted per
              product and exclude GST.
            </p>
          ) : null}
          {/* CTAs sit above the fold deliberately — most of this traffic is
              mobile and arrives with a list already in hand. */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <RequestQuoteButton label="Get a Quote" />
            <WhatsAppTrackedLink
              href={buildWhatsAppUrl(whatsappMessage)}
              source={`price_page_hero:${config.slug}`}
              className={buttonClasses("secondary")}
            >
              WhatsApp Your List
            </WhatsAppTrackedLink>
          </div>
        </section>

        <section className="max-w-3xl px-7 pb-2">
          {config.intro.map((paragraph, i) => (
            <p key={i} className="mt-3 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
              {paragraph}
            </p>
          ))}
        </section>

        <Reveal as="section" className="px-7 py-8">
          <SectionHeading>{config.layout === "ranges" ? "Ranges and current rates" : "Current products and rates"}</SectionHeading>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: "var(--line-strong)" }}>
              Nothing in the live catalogue matches this specification right now. Send the requirement and we will source it.
            </p>
          ) : config.layout === "ranges" ? (
            <PriceRangeTable groups={groups} />
          ) : (
            <PriceTable rows={rows} focusThickness={config.focusThicknessMm !== undefined} />
          )}
          {config.tableNote ? (
            <p className="mt-3 max-w-3xl text-xs" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
              {config.tableNote}
            </p>
          ) : null}
        </Reveal>

        {picks.length > 0 ? (
          <Reveal as="section" className="px-7 py-8">
            <SectionHeading>What to buy</SectionHeading>
            <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--line-strong)" }}>
              Each pick below is resolved from the table above, not chosen by hand — so it always matches what is actually
              in stock and priced today.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {picks.map((pick) => (
                <Link
                  key={pick.label}
                  href={`/products/${pick.row.slug}`}
                  className="block rounded-md p-4 transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-md)]"
                  style={{ background: "var(--card)" }}
                >
                  <p className="tracked-caps text-[10px]" style={{ color: "var(--accent)" }}>
                    {pick.label}
                  </p>
                  <p className="serif mt-1 text-base">{pick.row.displayName}</p>
                  <p className="mt-1 text-sm font-medium" style={{ color: "var(--burgundy)" }}>
                    {formatPrice(pick.row)}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
                    {[pick.row.grade, pick.row.certifications?.[0], pick.row.warranty].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-2 text-xs" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                    {pick.note}
                  </p>
                </Link>
              ))}
            </div>
          </Reveal>
        ) : null}

        {config.comparison ? (
          <Reveal as="section" className="px-7 py-8">
            <SectionHeading>{config.comparison.heading}</SectionHeading>
            {config.comparison.intro ? (
              <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                {config.comparison.intro}
              </p>
            ) : null}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    {config.comparison.columns.map((column) => (
                      <th key={column} className="px-3 py-2 text-left font-medium">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {config.comparison.rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                      {row.map((cell, j) => (
                        <td key={j} className="px-3 py-3" style={j === 0 ? { fontWeight: 500 } : { color: "var(--line-strong)" }}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {config.comparison.footnote ? (
              <p className="mt-3 max-w-3xl text-xs" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                {config.comparison.footnote}
              </p>
            ) : null}
          </Reveal>
        ) : null}

        {config.applications?.length ? (
          <Reveal as="section" className="px-7 py-8">
            <SectionHeading>Where each option belongs</SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {config.applications.map((application) => (
                <div key={application.heading}>
                  <p className="font-medium">{application.heading}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                    {application.body}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        ) : null}

        <BoqCtaBlock whatsappMessage={whatsappMessage} source={`price_page_boq:${config.slug}`} />

        {config.crossSell.length > 0 ? (
          <Reveal as="section" className="px-7 py-8">
            <SectionHeading>Quote these in the same order</SectionHeading>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {config.crossSell.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-md p-4 hover:opacity-80" style={{ background: "var(--card)" }}>
                  <p className="serif text-base">{item.label}</p>
                  <p className="mt-1 text-xs" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                    {item.note}
                  </p>
                </Link>
              ))}
            </div>
          </Reveal>
        ) : null}

        {config.faqs.length > 0 ? (
          <Reveal as="section" className="px-7 py-8">
            <SectionHeading>Frequently asked questions</SectionHeading>
            <div className="mt-3 flex flex-col gap-4">
              {config.faqs.map((faq) => (
                <div key={faq.question}>
                  <p className="font-medium">{faq.question}</p>
                  <p className="mt-1 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        ) : null}

        <Reveal as="section" className="px-7 pb-14 pt-4">
          <SectionHeading>Related</SectionHeading>
          <div className="mt-3 flex flex-wrap gap-2">
            {config.related.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-3 py-1 text-sm hover:opacity-70"
                style={{ background: "var(--paper-dim)" }}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </main>
  );
}
