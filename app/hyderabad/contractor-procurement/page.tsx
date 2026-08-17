import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts } from "@/lib/data/products";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { Reveal } from "@/components/Reveal";
import { cardClasses, CARD_BASE_STYLE } from "@/components/ui/Card";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";
import { CategoryIcon } from "@/components/icons/CategoryIcon";

const FAQS = [
  {
    question: "Do you offer trade pricing for contractors managing multiple sites?",
    answer: "Yes — trade and bulk pricing is available on request, and we can coordinate deliveries across multiple active sites.",
  },
  {
    question: "Can you hold stock against a project timeline that isn't finalised yet?",
    answer:
      "Share your expected timeline and we'll flag what's realistic to hold versus what needs to be confirmed closer to the date — this varies by item and current stock levels.",
  },
];

export const metadata: Metadata = buildMetadata({
  title: "Contractor Procurement in Hyderabad — Every Category, One Supplier",
  description:
    "Trade pricing and consolidated material sourcing for contractors managing multiple Hyderabad sites — plywood, laminates, MDF, veneers, hardware and adhesives, all stocked categories in one view.",
  path: "/hyderabad/contractor-procurement",
});

export default async function ContractorProcurementPage() {
  const counts = await getCategoryCounts();
  const brands = await getAllBrandsWithCounts();

  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Hyderabad", path: "/hyderabad" },
          { name: "Contractor Procurement", path: "/hyderabad/contractor-procurement" },
        ]}
      />
      <FaqSchema faqs={FAQS} />
      <div className="mx-auto max-w-6xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Hyderabad", href: "/hyderabad" }, { label: "Contractor Procurement" }]} />

      <section className="px-7 py-10">
        <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
          For Contractors · Hyderabad
        </p>
        <h1 className="serif mt-2 max-w-2xl" style={{ fontSize: "var(--fs-h1)" }}>
          You don&apos;t need ten suppliers for one site.
        </h1>
        <p className="mt-3 max-w-2xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
          Every category your project needs — plywood, laminates, MDF, veneers, hardware, adhesives — stocked and
          quotable through one relationship. Trade pricing on request, delivery scheduled around your site sequence.
        </p>
        <div className="mt-5">
          <RequestQuoteButton label="Get Trade Pricing" />
        </div>
      </section>

      <Reveal as="section" className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Every Category, One View
        </h2>
        <Reveal stagger className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products/${cat.slug}`}
              className={cardClasses("flex flex-col gap-3 p-5")}
              style={CARD_BASE_STYLE}
            >
              <CategoryIcon slug={cat.slug} className="text-[var(--burgundy)]" />
              <div>
                <p className="serif" style={{ fontSize: "16px" }}>
                  {cat.name}
                </p>
                <p className="mt-0.5 text-xs tracked-caps" style={{ color: "var(--accent)" }}>
                  {counts[cat.dbCategory] || 0} products
                </p>
              </div>
            </Link>
          ))}
        </Reveal>
      </Reveal>

      <Reveal as="section" className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Brands Available
        </h2>
        <p className="mt-3 max-w-3xl text-sm" style={{ color: "var(--line-strong)" }}>
          Full access to our manufacturer catalogue at trade pricing —{" "}
          {brands.map((b) => b.name).join(", ")}.
        </p>
      </Reveal>

      <Reveal as="section" className="px-7 py-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Frequently Asked Questions
        </h2>
        <div className="mt-3 flex flex-col gap-4">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <p className="font-medium">{faq.question}</p>
              <p className="mt-1 text-sm" style={{ color: "var(--line-strong)" }}>
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </Reveal>
      </div>
    </main>
  );
}
