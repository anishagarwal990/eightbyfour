import { SITE_URL } from "@/lib/seo";

// Used on /hyderabad/* pages, which previously all emitted a byte-identical
// HomeAndConstructionBusiness block (via OrganizationSchema in the root
// layout) with nothing distinguishing "BOQ Procurement" from "Plywood
// Supplier" in structured data. This adds one small, page-specific Service
// entity per page instead, linked back to the org via `provider`'s @id
// rather than re-declaring the whole business object.
export function ServiceSchema({ name, description, path }: { name: string; description: string; path: string }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    url: `${SITE_URL}${path}`,
    areaServed: { "@type": "City", name: "Hyderabad" },
    provider: { "@id": `${SITE_URL}/#organization` },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
