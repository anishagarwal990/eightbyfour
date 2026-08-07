import Image from "next/image";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { SourceOnlyQuoteButton } from "@/components/SourceOnlyQuoteButton";
import { getSourceOnlyBrandContent } from "@/lib/source-only-brand-content";
import { PHONE_DISPLAY, PHONE_TEL, EMAIL } from "@/lib/contact";

interface SourceOnlyBrand {
  name: string;
  slug: string;
  file: string;
}

export function SourceOnlyBrandPageView({ brand }: { brand: SourceOnlyBrand }) {
  const content = getSourceOnlyBrandContent(brand.slug);

  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Brands", path: "/brands" },
          { name: brand.name, path: `/brands/${brand.slug}` },
        ]}
      />
      <div className="mx-auto max-w-5xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands", href: "/brands" }, { label: brand.name }]} />

      <section className="flex flex-wrap items-center gap-6 px-7 py-8">
        <div className="relative h-16 w-40 shrink-0">
          <Image src={`/brand-logos/${brand.file}`} alt={`${brand.name} logo`} fill className="object-contain object-left" priority />
        </div>
        <div>
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            {brand.name} · Ask for Availability & Quote
          </p>
          <h1 className="serif mt-1" style={{ fontSize: "var(--fs-h1)" }}>
            {brand.name} in Hyderabad
          </h1>
          {content ? (
            <p className="mt-2 max-w-2xl" style={{ fontSize: "var(--fs-body)", color: "var(--line-strong)" }}>
              {content.tagline}
            </p>
          ) : null}
        </div>
      </section>

      {content ? (
        <>
          <section className="px-7 pb-8">
            <p className="max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
              {content.intro}
            </p>

            <div
              className="mt-6 max-w-3xl rounded-sm border-l-4 px-5 py-4"
              style={{ borderColor: "var(--accent)", background: "var(--paper-dim)" }}
            >
              <p className="font-medium" style={{ fontSize: "var(--fs-body)" }}>
                {content.catalogueNote}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-4">
                <SourceOnlyQuoteButton name={brand.name} label="Click Here for Catalogue" />
                <span style={{ fontSize: "var(--fs-body)" }}>
                  Call{" "}
                  <a href={`tel:${PHONE_TEL}`} className="underline" style={{ color: "var(--accent)" }}>
                    {PHONE_DISPLAY}
                  </a>{" "}
                  or write to{" "}
                  <a href={`mailto:${EMAIL}`} className="underline" style={{ color: "var(--accent)" }}>
                    {EMAIL}
                  </a>
                </span>
              </div>
            </div>
          </section>

          {content.sections.map((section) => (
            <section key={section.heading} className="px-7 pb-8">
              <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                {section.heading}
              </h2>
              <p className="mt-3 max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
                {section.body}
              </p>
            </section>
          ))}

          {content.designFeatures ? (
            <section className="px-7 pb-8">
              <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                Design Without Limits
              </h2>
              <p className="mt-3 max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
                HIMACS is built for architects and designers who want to push past the constraints of traditional materials.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {content.designFeatures.map((feature) => (
                  <div key={feature.title}>
                    <p className="font-medium">{feature.title}</p>
                    <p className="mt-1 text-sm" style={{ color: "var(--line-strong)" }}>
                      {feature.body}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {content.applications ? (
            <section className="px-7 pb-8">
              <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
                Where HIMACS Fits
              </h2>
              <p className="mt-3 max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
                Architects and designers specify HIMACS across a wide range of interior and exterior applications, including:
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {content.applications.map((app) => (
                  <li key={app} className="flex items-start gap-2" style={{ fontSize: "var(--fs-body)" }}>
                    <span aria-hidden style={{ color: "var(--accent)" }}>
                      —
                    </span>
                    {app}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="px-7 py-8" style={{ background: "var(--paper-dim)" }}>
            <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
              {content.ctaHeading}
            </h2>
            <p className="mt-3 max-w-3xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)" }}>
              {content.ctaBody}
            </p>
            <div className="mt-6">
              <SourceOnlyQuoteButton name={brand.name} />
            </div>
          </section>

          <section className="px-7 py-6">
            <p className="text-xs" style={{ color: "var(--line-strong)" }}>
              {content.sourceNote}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
              {content.trademarkNote}
            </p>
          </section>
        </>
      ) : (
        <section className="px-7 pb-8">
          <SourceOnlyQuoteButton name={brand.name} />
        </section>
      )}
      </div>
    </main>
  );
}
