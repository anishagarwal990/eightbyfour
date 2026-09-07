import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getContent } from "@/lib/mdx";
import { getProductsByCategory } from "@/lib/data/products";
import { buildMetadata } from "@/lib/seo";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { BreadcrumbSchema } from "@/components/schema/BreadcrumbSchema";
import { ServiceSchema } from "@/components/schema/ServiceSchema";
import { Reveal } from "@/components/Reveal";
import { cardClasses } from "@/components/ui/Card";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";

const ROOMS = [
  { applicationSlug: "modular-kitchen", room: "Kitchen", imageCategory: "Corian - Acrylic Solid Surface" },
  { applicationSlug: "wardrobes", room: "Wardrobe", imageCategory: "Veneers" },
  { applicationSlug: "tv-units", room: "TV Unit", imageCategory: "Veneers" },
];

export const metadata: Metadata = buildMetadata({
  title: "Materials for Your Home in Hyderabad — Kitchen, Wardrobe & More",
  description:
    "Simple, plain-language guidance on choosing materials for your Hyderabad home — by room, not by raw catalogue. Kitchen, wardrobe and TV unit essentials.",
  path: "/hyderabad/homeowner-materials",
});

export default async function HomeownerMaterialsPage() {
  const rooms = await Promise.all(
    ROOMS.map(async (r) => {
      const entry = getContent("applications", r.applicationSlug);
      const products = (await getProductsByCategory(r.imageCategory)).filter((p) => p.main_img_url);
      const image = products[Math.floor(products.length / 3)] || products[0];
      return { ...r, entry, image };
    })
  );

  return (
    <main>
      <BreadcrumbSchema
        items={[
          { name: "Home", path: "/" },
          { name: "Hyderabad", path: "/hyderabad" },
          { name: "Materials for Your Home", path: "/hyderabad/homeowner-materials" },
        ]}
      />
      <ServiceSchema
        name="Materials for Your Home in Hyderabad — Kitchen, Wardrobe & More"
        description="Simple, plain-language guidance on choosing materials for your Hyderabad home — by room, not by raw catalogue. Kitchen, wardrobe and TV unit essentials."
        path="/hyderabad/homeowner-materials"
      />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Hyderabad", href: "/hyderabad" }, { label: "Materials for Your Home" }]} />

      <section className="px-7 py-10 text-center">
        <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
          For Homeowners · Hyderabad
        </p>
        <h1 className="serif mx-auto mt-2 max-w-2xl" style={{ fontSize: "var(--fs-h1)" }}>
          Picture the room. We&apos;ll sort the materials.
        </h1>
        <p className="mx-auto mt-3 max-w-xl" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
          You don&apos;t need to learn plywood grades to get this right. Tell us which room you&apos;re working on and
          we&apos;ll recommend the materials — you focus on how it should look and feel.
        </p>
        <div className="mt-5 flex justify-center">
          <RequestQuoteButton label="Get My Quote" />
        </div>
      </section>

      <Reveal stagger className="grid grid-cols-1 gap-4 px-7 pb-16 sm:grid-cols-3">
        {rooms.map((r) =>
          r.entry ? (
            <Link key={r.applicationSlug} href={`/applications/${r.applicationSlug}`} className={cardClasses("block")} style={{ borderColor: "var(--line)", background: "var(--card)" }}>
              {r.image?.main_img_url ? (
                <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: "var(--paper-dim)" }}>
                  <Image
                    src={r.image.main_img_url}
                    alt={r.room}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.06]"
                  />
                </div>
              ) : null}
              <div className="p-5">
                <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
                  {r.room}
                </p>
                <h2 className="serif mt-1" style={{ fontSize: "var(--fs-h2)" }}>
                  {r.entry.frontmatter.title}
                </h2>
                <p className="mt-2 text-sm" style={{ color: "var(--line-strong)" }}>
                  {r.entry.frontmatter.description}
                </p>
              </div>
            </Link>
          ) : null
        )}
      </Reveal>

      <Reveal as="section" className="px-7 py-14 text-center">
        <h2 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          Not sure where to start?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
          Send us a photo of the space, or just tell us what you&apos;re building — we&apos;ll point you to the right
          materials and a real quote, no jargon required.
        </p>
      </Reveal>
    </main>
  );
}
