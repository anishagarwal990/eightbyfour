import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getProductsByCategory } from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { FaqSchema } from "@/components/schema/FaqSchema";
import { ServiceSchema } from "@/components/schema/ServiceSchema";
import { Reveal } from "@/components/Reveal";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";

const FAQS = [
  {
    question: "Can you confirm material availability before I finalise a spec?",
    answer: "Yes — share the shade codes, brands or finishes you're considering and we'll confirm current Hyderabad stock before you lock the spec into drawings.",
  },
  {
    question: "Do you work directly with the client's contractor, or with the architect?",
    answer:
      "Either — we're happy to coordinate directly with your client's contractor once the spec is set, or manage the relationship through you. Let us know what works for your project.",
  },
];

const FEATURE_CATEGORIES = [
  { dbCategory: "Veneers", slug: "veneers", name: "Veneers" },
  { dbCategory: "Corian - Acrylic Solid Surface", slug: "corian-acrylic-solid-surface", name: "Acrylic Solid Surface" },
];

export const metadata: Metadata = buildMetadata({
  title: "Architect Material Sourcing in Hyderabad — Real Stock, Not a Catalogue",
  description:
    "Real-time stock visibility for architects and interior designers specifying veneers and acrylic solid surface on Hyderabad projects.",
  path: "/hyderabad/architect-material-sourcing",
});

export default async function ArchitectMaterialSourcingPage() {
  const categoryProducts = await Promise.all(
    FEATURE_CATEGORIES.map(async (c) => ({
      ...c,
      products: (await getProductsByCategory(c.dbCategory)).filter((p) => p.main_img_url).slice(0, 6),
    }))
  );

  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Hyderabad", path: "/hyderabad" },
          { name: "Architect Material Sourcing", path: "/hyderabad/architect-material-sourcing" },
        ]}
      />
      <FaqSchema faqs={FAQS} />
      <ServiceSchema
        name="Architect Material Sourcing in Hyderabad — Real Stock, Not a Catalogue"
        description="Real-time stock visibility for architects and interior designers specifying veneers and acrylic solid surface on Hyderabad projects."
        path="/hyderabad/architect-material-sourcing"
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Hyderabad", href: "/hyderabad" }, { label: "Architect Material Sourcing" }]} />

      <section className="px-7 py-10 text-center">
        <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
          For Architects &amp; Designers · Hyderabad
        </p>
        <h1 className="serif mx-auto mt-2 max-w-2xl" style={{ fontSize: "var(--fs-h1)" }}>
          Real stock, not a catalogue that may or may not be available.
        </h1>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
          The veneer batch, laminate finish or acrylic surface you draw into a set — confirmed against current Hyderabad
          stock before it&apos;s locked into drawings.
        </p>
        <div className="mt-5 flex justify-center">
          <RequestQuoteButton label="Request Samples & Confirm Stock" />
        </div>
      </section>

      {categoryProducts.map((cat) =>
        cat.products.length > 0 ? (
          <Reveal key={cat.slug} as="section" className="py-6">
            <div className="flex items-baseline justify-between px-7">
              <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                {cat.name}
              </h2>
              <Link href={`/products/${cat.slug}`} className="text-sm hover:opacity-70" style={{ color: "var(--accent)" }}>
                View all →
              </Link>
            </div>
            <Reveal stagger className="mt-4 grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-6">
              {cat.products.map((p) => (
                <Link key={p.id} href={`/products/${p.slug}`} className="group relative block aspect-square overflow-hidden">
                  <Image
                    src={p.main_img_url!}
                    alt={`${p.brand} ${p.name}`}
                    fill
                    sizes="(max-width: 640px) 50vw, 16vw"
                    className="object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-110"
                  />
                </Link>
              ))}
            </Reveal>
          </Reveal>
        ) : null
      )}

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
    </main>
  );
}
