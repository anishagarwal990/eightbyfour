import { SITE_URL } from "@/lib/seo";

export function OrganizationSchema() {
  const json = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "EightByFour",
    url: SITE_URL,
    image: `${SITE_URL}/og-image.jpg`,
    description:
      "EightByFour is a procurement platform for interior and construction materials operating in Hyderabad — sourcing plywood, laminates, veneers, hardware and more directly from trusted manufacturers.",
    areaServed: { "@type": "City", name: "Hyderabad" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
