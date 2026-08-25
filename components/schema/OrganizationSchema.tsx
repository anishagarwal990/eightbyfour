import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { EMAIL, PHONE_TEL } from "@/lib/contact";

export function OrganizationSchema() {
  const json = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    // Stable @id so page-specific Service blocks (see ServiceSchema.tsx, used
    // on /hyderabad/* pages) can reference this org via `provider` instead of
    // re-declaring the full HomeAndConstructionBusiness object each time.
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: "EightxFour",
    url: SITE_URL,
    image: `${SITE_URL}/og-image.jpg`,
    logo: `${SITE_URL}/eightbyfour-logo.png`,
    description:
      "EightxFour is a material procurement partner for interior and construction projects in Hyderabad — sourcing plywood, laminates, veneers, boards, hardware and more directly from manufacturers, and quoting a whole requirement as one list.",
    areaServed: { "@type": "City", name: "Hyderabad" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "7-1-21/B 106 Sita Sarovar, Begumpet",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      postalCode: "500016",
      addressCountry: "IN",
    },
    // Locality-level precision (Begumpet), not exact-building geocoding —
    // free geocoders can't resolve this specific building number. Refine to
    // rooftop-accurate coordinates once/if a Google Business Profile is
    // verified for this address, which can geocode it precisely.
    geo: { "@type": "GeoCoordinates", latitude: 17.446195, longitude: 78.463016 },
    telephone: PHONE_TEL,
    email: EMAIL,
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "20:30",
    },
    parentOrganization: {
      "@type": "Organization",
      name: "DRG Group",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
