import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { EMAIL, PHONE_TEL } from "@/lib/contact";

export function OrganizationSchema() {
  const json = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: SITE_NAME,
    alternateName: "EightByFour",
    url: SITE_URL,
    image: `${SITE_URL}/og-image.jpg`,
    logo: `${SITE_URL}/eightbyfour-logo.png`,
    description:
      "EightByFour is a procurement platform for interior and construction materials operating in Hyderabad — sourcing plywood, laminates, veneers, hardware and more directly from trusted manufacturers.",
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
    parentOrganization: {
      "@type": "Organization",
      name: "DRG Group",
    },
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
