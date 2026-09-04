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
      "EightxFour is a procurement platform for interior and construction materials operating in Hyderabad — sourcing plywood, laminates, veneers, hardware and more directly from trusted manufacturers.",
    areaServed: { "@type": "City", name: "Hyderabad" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "7-1-21/B 106 Sita Sarovar, Begumpet",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      postalCode: "500016",
      addressCountry: "IN",
    },
    // Rooftop-accurate — matched against the "Sita Sarovar Apartments"
    // building on Google Maps by street number (7-1-21) and PIN (500016),
    // both exact. Was a locality-level Begumpet estimate before a Google
    // Business Profile existed to geocode the exact building; add `sameAs`
    // with the GBP listing URL once it's verified, for the entity link.
    geo: { "@type": "GeoCoordinates", latitude: 17.4376923, longitude: 78.4560503 },
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
