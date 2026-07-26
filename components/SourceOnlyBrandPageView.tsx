import Image from "next/image";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { SourceOnlyQuoteButton } from "@/components/SourceOnlyQuoteButton";

interface SourceOnlyBrand {
  name: string;
  slug: string;
  file: string;
}

export function SourceOnlyBrandPageView({ brand }: { brand: SourceOnlyBrand }) {
  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Brands", path: "/brands" },
          { name: brand.name, path: `/brands/${brand.slug}` },
        ]}
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Brands", href: "/brands" }, { label: brand.name }]} />

      <section className="flex flex-wrap items-center gap-6 px-7 py-8">
        <div className="relative h-16 w-40 shrink-0">
          <Image src={`/brand-logos/${brand.file}`} alt={`${brand.name} logo`} fill className="object-contain object-left" />
        </div>
        <div>
          <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
            {brand.name} · Sourced on Request
          </p>
          <h1 className="serif mt-1" style={{ fontSize: "var(--fs-h1)" }}>
            {brand.name} in Hyderabad
          </h1>
        </div>
      </section>

      <section className="px-7 pb-8">
        <SourceOnlyQuoteButton name={brand.name} />
      </section>
    </main>
  );
}
