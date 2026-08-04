import { SITE_URL } from "@/lib/seo";
import { EMAIL, PHONE_TEL } from "@/lib/contact";

export function OrganizationSchema() {
  const json = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    name: "EightByFour",
    url: SITE_URL,
    image: `${SITE_URL}/og-image.jpg`,
    logo: `${SITE_URL}/eightbyfour-logo.png`,
    description:
      "EightByFour is a procurement platform for interior and construction materials operating in Hyderabad — sourcing plywood, laminates, veneers, hardware and more directly from trusted manufacturers.",
    areaServed: { "@type": "City", name: "Hyderabad" },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    telephone: PHONE_TEL,
    email: EMAIL,
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />;
}
