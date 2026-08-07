// Optional rich content for individual SOURCE_ONLY_BRANDS pages. Most source-only
// brands render with just the generic logo + CTA layout in SourceOnlyBrandPageView;
// brands with a keyed entry here get the fuller marketing sections instead.
export interface SourceOnlyBrandSection {
  heading: string;
  body: string;
}

export interface SourceOnlyBrandFeature {
  title: string;
  body: string;
}

export interface SourceOnlyBrandContent {
  tagline: string;
  intro: string;
  catalogueNote: string;
  sections: SourceOnlyBrandSection[];
  designFeatures?: SourceOnlyBrandFeature[];
  applications?: string[];
  ctaHeading: string;
  ctaBody: string;
  sourceNote: string;
  trademarkNote: string;
}

export const SOURCE_ONLY_BRAND_CONTENT: Record<string, SourceOnlyBrandContent> = {
  "lx-hausys": {
    tagline: "The Solid Surface That Turns Bold Design Ideas Into Reality",
    intro:
      "HIMACS by LX Hausys is a premium solid surface material engineered for architects, designers, and homeowners who refuse to compromise between form and function. Seamless, hygienic, and endlessly customizable, it's redefining what countertops, walls, and interiors can look like — and eightbyfour brings it to Hyderabad.",
    catalogueNote: "Want the full HIMACS catalogue, live color and pattern samples, or pricing? Reach out below and we'll get back to you fast.",
    sections: [
      {
        heading: "About LX Hausys",
        body: "LX Hausys is Korea's largest building and decorative materials company, part of the LX Group. Its products — spanning solid surfaces, flooring, and architectural films — are specified in residential, commercial, hospitality, and healthcare projects around the world. HIMACS is LX Hausys' flagship solid surface line, trusted by architects for over three decades for its consistency, performance, and design freedom.",
      },
      {
        heading: "What Is HIMACS Solid Surface?",
        body: "HIMACS is a non-porous surface material made primarily from natural mineral aluminum hydroxide (ATH), acrylic resin, and natural pigments. Unlike natural stone, it has no visible seams, no sealants to maintain, and no pores for bacteria, moisture, or stains to take hold. The result is a surface that looks as good in year fifteen as it did on day one — and can be shaped into forms that stone simply can't achieve.",
      },
      {
        heading: "Built for Health, Hygiene, and Everyday Performance",
        body: "HIMACS is certified GREENGUARD Gold for low chemical emissions and approved to NSF standards for direct food contact — making it a preferred choice for kitchens, hospital counters, and food-service environments where hygiene is non-negotiable. Its non-porous surface resists bacteria growth and is easy to clean with no sealants required. Every installation is backed by a 15-year limited warranty.",
      },
      {
        heading: "A Material Designed for a Greener Future",
        body: "Sustainability is built into HIMACS at every stage. Pre-consumer waste from manufacturing is recycled back into new HIMACS sheets, and select colors contain up to 16% recycled material, independently certified by Scientific Certification Systems (SCS). Off-cuts from installation can be repurposed into smaller projects rather than discarded, and the material's durability means fewer replacements over a building's lifetime — a genuinely lower-impact choice for high-aesthetic projects.",
      },
      {
        heading: "A Colour and Pattern Library Built to Match Any Vision",
        body: "HIMACS is available in over 130 colors and patterns — from clean solids to Calacatta-inspired marbles to the newly launched Terrazzo collection, which won the Red Dot Design Award 2026. Whether the brief calls for a quiet neutral palette or a statement stone-look surface, there's a HIMACS finish to match.",
      },
    ],
    designFeatures: [
      {
        title: "Three-dimensional forming",
        body: "With simple thermoforming, HIMACS can be shaped into curves, waves, and sculptural forms that are difficult or impossible to achieve with natural stone.",
      },
      {
        title: "Seamless bonding",
        body: "Sheets are joined invisibly, creating continuous, uninterrupted surfaces across countertops, walls, and custom installations — no visible joints, no grout lines.",
      },
      {
        title: "Translucency",
        body: "Select colors allow light to pass through the surface, opening up backlit and layered lighting designs that stone and laminate can't replicate.",
      },
      {
        title: "Repairable, not replaceable",
        body: "Scratches and minor damage can be sanded and resurfaced on site by a professional, extending the life of the installation.",
      },
    ],
    applications: [
      "Kitchen countertops and islands",
      "Bathroom vanities and shower surrounds",
      "Reception desks and hospitality counters",
      "Healthcare surfaces and nurse stations",
      "Curved interior walls, cladding, and ventilated facades",
    ],
    ctaHeading: "Bring HIMACS Into Your Next Project",
    ctaBody:
      "eightbyfour is Hyderabad's trusted source for LX Hausys HIMACS solid surface — from first sample to final installation. Reach out to us for the full HIMACS catalogue, live color and pattern samples, and pricing for your project.",
    sourceNote: "Source: lxhausys.com (Global & US HIMACS product pages, product finder, sustainability page)",
    trademarkNote:
      '"LX Hausys," "HIMACS," and all related brand names, taglines, logos, and trademarks are the property of their respective owners. eightbyfour is an independent dealer and claims no ownership or rights over these marks.',
  },
};

export function getSourceOnlyBrandContent(slug: string): SourceOnlyBrandContent | null {
  return SOURCE_ONLY_BRAND_CONTENT[slug] || null;
}
