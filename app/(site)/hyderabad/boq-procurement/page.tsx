import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { ServiceSchema } from "@/components/schema/ServiceSchema";
import { Reveal } from "@/components/Reveal";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";
import { WhatsAppTrackedLink } from "@/components/WhatsAppTrackedLink";
import { buttonClasses } from "@/components/ui/Button";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts } from "@/lib/data/products";
import { getSampleBoqLines } from "@/lib/data/sampleBoq";

const TITLE = "BOQ Procurement in Hyderabad";
const WHATSAPP_MESSAGE =
  "Hi, I'd like to send a BOQ for a Hyderabad project. I'll share the list/file here.";

export const metadata: Metadata = buildMetadata({
  title: TITLE,
  description:
    "Send your interior material BOQ in any format — Excel, PDF, drawings or a photo of a handwritten list — and get one itemised quotation covering plywood, laminates, boards, adhesive and hardware for Hyderabad delivery.",
  path: "/hyderabad/boq-procurement",
});

const STEPS = [
  { n: "01", title: "Send the list", detail: "Excel, PDF, architect's drawings, a WhatsApp message, or a photo of a handwritten sheet. No template to fill in." },
  { n: "02", title: "We identify each line", detail: "Every item is matched to a real product — brand, grade, thickness, sheet size — including the lines written as shorthand." },
  { n: "03", title: "Alternatives where they help", detail: "Where a line is overspecified, discontinued or slow to source, you get the equivalent alongside it rather than instead of it." },
  { n: "04", title: "One consolidated quotation", detail: "Priced line by line against your original numbering, across every category — not a reformatted summary you have to cross-check." },
  { n: "05", title: "You confirm what you want", detail: "Part of the BOQ is fine. Confirmed lines go to order; the rest stays quoted." },
  { n: "06", title: "Hyderabad delivery", detail: "Consolidated into as few deliveries as the site schedule allows, scheduled against your timeline." },
];

const AUDIENCES = [
  { title: "Interior contractors", detail: "Multiple sites, overlapping BOQs, one supplier relationship instead of eight." },
  { title: "Architects and designers", detail: "Specification-led lists where the substitution question matters more than the rate." },
  { title: "Carpenters and fabricators", detail: "Sheet counts by grade and thickness, quoted at volume." },
  { title: "Modular furniture factories", detail: "Repeat material lists with consistent shade and grade continuity across batches." },
  { title: "Homeowners", detail: "A single flat's material list, priced honestly rather than bundled into a turnkey number." },
  { title: "Outstation contractors", detail: "Executing a Hyderabad project from another state, with no local vendor network to lean on." },
];

const WHY = [
  { title: "One contact across every category", detail: "Plywood, laminate, boards, veneer, adhesive and hardware from one conversation." },
  { title: "Comparable options, not just a rate", detail: "Where two products can do the job, both appear with their grade and certification." },
  { title: "Transparent itemisation", detail: "Every line priced separately, so you can cut, swap or defer any of them." },
  { title: "Built for Hyderabad", detail: "One city, one delivery network — not a national catalogue with a Hyderabad checkbox." },
];

const FAQS = [
  { question: "What format should I send my BOQ in?", answer: "Whatever it already exists in — an Excel sheet, a PDF from your architect, a Word document, a photo of a handwritten list, or a WhatsApp message. There is no template to fill in first." },
  { question: "Can I upload an Excel file or a PDF?", answer: "Yes. The quote form accepts Excel, CSV, PDF, Word documents and images up to 20MB. If the file is larger, send it over WhatsApp instead." },
  { question: "Can I send photos or screenshots of a list?", answer: "Yes. Photos of a handwritten list and screenshots of a spreadsheet both work — we read them line by line the same way." },
  { question: "Can you suggest equivalent products?", answer: "Yes, and we flag them rather than substituting silently. Where a specified line is overspecified for its application, discontinued, or slow to source, the equivalent appears alongside the original with its own grade and certification so the choice stays yours." },
  { question: "Can you quote multiple brands for the same line?", answer: "Yes. Where several brands make a comparable product, the quotation can carry more than one option per line so you can see the cost of the specification decision." },
  { question: "Do you deliver across Hyderabad?", answer: "Yes, across the city and the surrounding metro area. Share the site location with the BOQ and delivery timing is confirmed with the quotation." },
  { question: "Can GST invoices be provided?", answer: "Yes. Quoted rates are exclusive of GST and a GST invoice is issued against the order." },
  { question: "Can I order only part of the BOQ?", answer: "Yes. The quotation is itemised precisely so you can confirm some lines and leave the rest — a common pattern where a project's finishes are decided later than its substrate." },
];

export default async function BoqProcurementPage() {
  const [counts, sampleLines] = await Promise.all([getCategoryCounts(), getSampleBoqLines()]);
  const stockedCategories = CATEGORIES.filter((c) => (counts[c.dbCategory] ?? 0) > 0);

  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Hyderabad", path: "/hyderabad" },
          { name: TITLE, path: "/hyderabad/boq-procurement" },
        ]}
      />
      <FaqSchema faqs={FAQS} />
      <ServiceSchema
        name={TITLE}
        description="Consolidated interior-material procurement against a client's own bill of quantities, quoted line by line and delivered across Hyderabad."
        path="/hyderabad/boq-procurement"
      />

      <div className="mx-auto max-w-6xl">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Hyderabad", href: "/hyderabad" }, { label: TITLE }]} />

        <section className="px-7 py-8">
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            BOQ procurement · Hyderabad
          </p>
          <h1 className="serif mt-2" style={{ fontSize: "var(--fs-h1)" }}>
            Your interior material list. One quote.
          </h1>
          <p className="mt-4 max-w-2xl text-base" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
            Send the plywood, laminates, boards, veneer, adhesive and hardware your project needs — as one list, in
            whatever form it already exists. It comes back as a single itemised quotation, priced line by line against
            your own numbering, for delivery across Hyderabad.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <RequestQuoteButton label="Upload Your BOQ" />
            <WhatsAppTrackedLink href={buildWhatsAppUrl(WHATSAPP_MESSAGE)} source="boq_hero" className={buttonClasses("secondary")}>
              WhatsApp Your Requirement
            </WhatsAppTrackedLink>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--line-strong)" }}>
            Excel · PDF · Word · CSV · photos and screenshots, up to 20MB.
          </p>
        </section>

        <Reveal as="section" className="px-7 py-10">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            How it works
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n}>
                <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
                  {step.n}
                </p>
                <p className="serif mt-1 text-base">{step.title}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                  {step.detail}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="px-7 py-10">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            What a BOQ can include
          </h2>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
            Every category below is live in the catalogue, with the SKU count read from stock. Categories outside this
            list are sourced on request — put them on the BOQ anyway.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {stockedCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/products/${category.slug}`}
                className="rounded-full px-4 py-1.5 text-sm hover:opacity-70"
                style={{ background: "var(--paper-dim)" }}
              >
                {category.name}{" "}
                <span style={{ color: "var(--line-strong)" }}>{counts[category.dbCategory]}</span>
              </Link>
            ))}
          </div>
        </Reveal>

        {sampleLines.length > 0 ? (
          <Reveal as="section" className="px-7 py-10">
            <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
              What a consolidated quotation looks like
            </h2>
            <p className="mt-2 max-w-3xl text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
              Below is the shape of the document you get back, built from a typical 3BHK material list. The products and
              the rates are real and read live from this catalogue; the quantities are illustrative. Your own quotation
              is priced against your own quantities and confirmed stock — this is the structure, not a price offer.
            </p>
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--line)" }}>
                    <th className="px-3 py-2 text-left font-medium">Line</th>
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-left font-medium">Illustrative qty</th>
                    <th className="px-3 py-2 text-left font-medium">Rate (excl. GST)</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleLines.map((line, i) => (
                    <tr key={line.slug} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td className="px-3 py-3" style={{ color: "var(--line-strong)" }}>
                        {String(i + 1).padStart(2, "0")}
                      </td>
                      <td className="px-3 py-3">
                        <Link href={`/products/${line.slug}`} className="font-medium hover:opacity-70">
                          {line.displayName}
                        </Link>
                        <p className="mt-0.5 text-xs" style={{ color: "var(--line-strong)" }}>
                          {line.note}
                        </p>
                      </td>
                      <td className="px-3 py-3" style={{ color: "var(--line-strong)" }}>
                        {line.quantity}
                      </td>
                      <td className="px-3 py-3" style={{ color: "var(--burgundy)" }}>
                        {line.rate ?? "Quoted on request"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 max-w-3xl text-xs" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
              Seven categories, one document, one delivery schedule. Sourced separately, the same list is seven vendor
              conversations and seven sets of terms to reconcile.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <RequestQuoteButton label="Upload Your BOQ" />
              <WhatsAppTrackedLink href={buildWhatsAppUrl(WHATSAPP_MESSAGE)} source="boq_sample" className={buttonClasses("secondary")}>
                WhatsApp Your Requirement
              </WhatsAppTrackedLink>
            </div>
          </Reveal>
        ) : null}

        <Reveal as="section" className="px-7 py-10">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Who this is for
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {AUDIENCES.map((audience) => (
              <div key={audience.title}>
                <p className="font-medium">{audience.title}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                  {audience.detail}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="px-7 py-10" style={{ background: "var(--paper-dim)" }}>
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Why EightByFour
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {WHY.map((item) => (
              <div key={item.title}>
                <p className="font-medium">{item.title}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                  {item.detail}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="px-7 py-10">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Frequently asked questions
          </h2>
          <div className="mt-3 flex flex-col gap-4">
            {FAQS.map((faq) => (
              <div key={faq.question}>
                <p className="font-medium">{faq.question}</p>
                <p className="mt-1 text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="section" className="px-7 pb-14">
          <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
            Before you send the list
          </h2>
          <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
            If specifications are still open, these price guides will tell you what each decision costs before it goes on
            the BOQ.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              { label: "Plywood price in Hyderabad", href: "/hyderabad/plywood-price" },
              { label: "18mm plywood price", href: "/hyderabad/18mm-plywood-price" },
              { label: "Laminate price in Hyderabad", href: "/hyderabad/laminate-price" },
              { label: "HDHMR board price", href: "/hyderabad/hdhmr-board-price" },
              { label: "MDF board price", href: "/hyderabad/mdf-board-price" },
              { label: "How to prepare a BOQ", href: "/guides/boq-preparation-guide" },
              { label: "Estimating plywood and laminate quantities", href: "/guides/estimating-plywood-laminate-quantities" },
              { label: "Interior material supplier in Hyderabad", href: "/hyderabad/interior-material-supplier" },
            ].map((link) => (
              <Link key={link.href} href={link.href} className="rounded-full px-3 py-1 text-sm hover:opacity-70" style={{ background: "var(--paper-dim)" }}>
                {link.label}
              </Link>
            ))}
          </div>
        </Reveal>
      </div>
    </main>
  );
}
