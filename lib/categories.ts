export interface CategoryFaq {
  question: string;
  answer: string;
}

export interface CategoryConfig {
  slug: string;
  /** Must match the `category` column in Supabase `products`. */
  dbCategory: string;
  name: string;
  heroTagline: string;
  overview: string;
  buyingGuide: string;
  faqs: CategoryFaq[];
  applicationSlugs: string[];
  relatedCategorySlugs: string[];
}

// Categories with zero live products are allowed here deliberately (see the
// "Coming soon" block below) — their pages are marked noindex in
// app/products/[slug]/page.tsx until real SKUs land, so they don't hurt SEO
// while empty. Once a category's dbCategory has real rows in Supabase, its
// page starts indexing automatically — no code change needed there.
export const CATEGORIES: CategoryConfig[] = [
  {
    slug: "plywood",
    dbCategory: "Plywood",
    name: "Plywood",
    heroTagline: "Commercial and marine-grade plywood from Century, Austin, Green Panel and Wigwam Excel.",
    overview:
      "Plywood is the structural backbone of almost every interior project — cabinetry carcasses, wardrobe shutters, false ceilings, and furniture that needs to hold screws and hardware over decades. EightxFour sources plywood in standard 8×4 ft sheets across MR (moisture-resistant), BWP (boil-proof) and fire-retardant grades from manufacturers already trusted on Hyderabad sites, so you're choosing between real stock, not a catalogue.",
    buyingGuide:
      "Match the grade to the environment: MR grade is fine for dry interior furniture, BWP (boil-water-proof) is worth the premium for kitchens, bathrooms and any site with monsoon exposure risk, and fire-retardant (FR) grade matters for commercial and hospitality fit-outs where it's often a code requirement. Thickness follows the application — 19mm for structural carcasses and shutters, 12mm for backs and shelves, 6mm for drawer bottoms and panel infills.",
    faqs: [
      {
        question: "What's the difference between MR and BWP plywood?",
        answer:
          "MR (moisture-resistant) plywood is bonded with a phenol-formaldehyde adhesive that tolerates occasional dampness but isn't meant for prolonged water contact. BWP (boil-water-proof, sometimes labelled BWR) is tested by boiling the bonded sheet — it holds up in kitchens, bathrooms and any application with sustained moisture exposure.",
      },
      {
        question: "Which plywood thickness should I use for kitchen cabinets?",
        answer:
          "19mm BWP plywood is the standard for cabinet carcasses and shutters in Hyderabad kitchens — it takes hardware (hinges, channels) securely and resists warping. 12mm is common for shelves and cabinet backs where load is lower.",
      },
      {
        question: "Do you supply plywood in sizes other than 8×4 ft?",
        answer:
          "8×4 ft is the standard sheet size we stock across all plywood brands. For non-standard sizes, share your BOQ with us and we'll check availability across our manufacturer network.",
      },
    ],
    applicationSlugs: ["modular-kitchen", "wardrobes", "office-furniture", "commercial-spaces"],
    relatedCategorySlugs: ["birch-plywood", "boil-boards", "laminates"],
  },
  {
    slug: "birch-plywood",
    dbCategory: "Birch Plywood",
    name: "Birch Plywood",
    heroTagline: "Imported Russian Birch Ply in BB/BB grade for furniture with exposed edges.",
    overview:
      "Birch plywood is a multi-ply hardwood panel built from thin birch veneers, prized for its dense, void-free cross-section — the edge itself looks finished, which is why designers reach for it on open shelving, exposed-edge furniture and Scandinavian-style joinery. EightxFour stocks imported Russian Birch Ply in BB/BB grade (both faces clean).",
    buyingGuide:
      "Birch ply is heavier and stiffer than standard commercial plywood, which is what gives it a clean, chip-free edge when cut — factor that into hardware selection and transport. It's priced at a premium over commercial plywood, so it's typically specified where the edge or cross-section will actually be visible, not for hidden carcasses.",
    faqs: [
      {
        question: "Why choose birch plywood over standard commercial plywood?",
        answer:
          "Birch plywood's cross-section has no visible voids, so a cut or routed edge looks intentional and finished without edge banding — useful for open shelving, plywood furniture with visible edges, and exposed-grain design work.",
      },
      {
        question: "What thickness range is available?",
        answer: "We stock birch plywood from 4mm to 18mm in 8×4 ft sheets.",
      },
    ],
    applicationSlugs: ["office-furniture", "retail-stores"],
    relatedCategorySlugs: ["plywood", "veneers"],
  },
  {
    slug: "boil-boards",
    dbCategory: "Boil Boards",
    name: "Boil Boards",
    heroTagline: "Boil-proof BWP boards from Green Panel and Century for high-moisture applications.",
    overview:
      "Boil Boards are the boil-water-proof (BWP) tier of plywood, split out as their own category because they're specified deliberately — kitchens, bathrooms, exterior-facing utility areas and any site brief with a strict moisture clause. Every board here has passed boiling-water bond testing, not just moisture-resistant bonding.",
    buyingGuide:
      "Specify Boil Boards wherever a plywood surface will see sustained water contact or high humidity — under-sink cabinetry, bathroom vanities, and exterior soffits. They cost more than MR-grade plywood; reserve the spend for genuinely wet zones rather than the whole BOQ.",
    faqs: [
      {
        question: "Is BWP the same as waterproof?",
        answer:
          "BWP (boil-water-proof) plywood resists prolonged moisture and won't delaminate under sustained wet conditions, but it isn't a substitute for proper site waterproofing — treat it as moisture-durable structural board, not a waterproofing membrane.",
      },
      {
        question: "Where should I use Boil Boards instead of standard MR plywood?",
        answer:
          "Kitchen base cabinets, bathroom vanities, utility areas, and any exterior-facing or high-humidity application where standard MR plywood risks delamination over time.",
      },
    ],
    applicationSlugs: ["modular-kitchen"],
    relatedCategorySlugs: ["plywood", "mdf-and-hdhmr"],
  },
  {
    slug: "mdf-and-hdhmr",
    dbCategory: "MDF and HDHMR",
    name: "MDF and HDHMR",
    heroTagline: "Interior and exterior-grade MDF plus HDHMR boards from Century and Green Panel.",
    overview:
      "MDF (medium-density fibreboard) and HDHMR (high-density, high-moisture-resistant board) are engineered wood panels made from compressed wood fibres rather than veneers — which gives them a smooth, uniform surface that machines and paints cleanly. HDHMR is the denser, moisture-tolerant version, common for wardrobe shutters and profile-routed doors.",
    buyingGuide:
      "Use interior-grade MDF for dry applications like painted panelling and false ceiling trims. Choose HDHMR wherever the board needs to withstand kitchen or bathroom humidity, or wherever shutters will be profile-routed — HDHMR machines more cleanly than plywood for that detailing.",
    faqs: [
      {
        question: "Is HDHMR better than plywood for wardrobe shutters?",
        answer:
          "HDHMR gives a smoother, more uniform surface for painted or profile-routed shutters than plywood, and resists moisture well. Plywood remains stronger for load-bearing carcasses and screw-holding at the edges — many designers use plywood for the carcass and HDHMR for the shutter face.",
      },
      {
        question: "Can MDF be used in kitchens?",
        answer:
          "Standard interior MDF isn't recommended for direct kitchen moisture exposure — specify HDHMR or a BWP board instead for kitchen applications.",
      },
    ],
    applicationSlugs: ["wardrobes", "modular-kitchen"],
    relatedCategorySlugs: ["plywood", "boil-boards", "laminates"],
  },
  {
    slug: "laminates",
    dbCategory: "Laminates",
    name: "Laminates",
    heroTagline: "Decorative laminate sheets across finishes and thicknesses for cabinetry and wall surfaces.",
    overview:
      "Laminates are the visible finish layer on most modular furniture — bonded onto plywood, MDF or HDHMR to give cabinetry, wardrobes and panelling their final texture and colour. EightxFour's laminate catalogue spans matte, glossy, textured and wood-grain finishes across the thicknesses used in Hyderabad fabrication.",
    buyingGuide:
      "Pick finish for both look and use: high-gloss reads premium but shows fingerprints and scratches more readily, making it a better fit for wardrobe interiors or low-touch surfaces than daily-use kitchen counters. Match laminate thickness to the substrate and edge-banding plan your fabricator is using — thicker laminates (1mm) suit high-wear horizontal surfaces, thinner sheets (0.8mm and below) are standard for vertical shutter faces.",
    faqs: [
      {
        question: "What laminate thickness should I choose for kitchen shutters?",
        answer:
          "0.8mm to 1mm laminate is standard for kitchen shutter faces — thick enough to resist chipping at edges, thin enough to bond cleanly without adding bulk.",
      },
      {
        question: "Matte or glossy laminate — which shows less wear?",
        answer:
          "Matte and textured finishes hide fingerprints, scratches and daily wear far better than high-gloss laminate, which is why gloss is more often used on accent panels than full kitchen runs.",
      },
    ],
    applicationSlugs: ["modular-kitchen", "wardrobes", "tv-units", "retail-stores"],
    relatedCategorySlugs: ["mdf-and-hdhmr", "veneers", "adhesive"],
  },
  {
    slug: "corian-acrylic-solid-surface",
    dbCategory: "Corian - Acrylic Solid Surface",
    // Leads with the generic term (higher search volume, what most buyers
    // type) and keeps Corian for recognition. The `dbCategory` string is
    // unchanged — it is the Supabase value and renaming it would orphan every
    // product row.
    name: "Solid Surface / Corian",
    heroTagline: "Durasein, Tiara and Vivanta acrylic solid surface sheets across a full shade catalogue for countertops and cladding.",
    overview:
      "Acrylic solid surface (the category Corian popularised) is a non-porous, seamlessly jointable sheet material used for kitchen countertops, wash-basin counters, wall cladding and reception desks. EightxFour stocks the Durasein, Tiara and Vivanta shade ranges — solid colours, marble-effect and textured finishes — with real shade codes you can spec against.",
    buyingGuide:
      "Solid surface counters can be thermoformed and joined seam-free, which is the main reason to spec them over stone for curved or long-run counters. For kitchens, pair with a heat-resistant trivet zone near the hob — while durable, solid surface can scorch under direct high heat the way natural stone won't.",
    faqs: [
      {
        question: "Is acrylic solid surface the same as Corian?",
        answer:
          "Corian is one manufacturer's brand within the acrylic solid surface category — like 'Xerox' for photocopiers. Durasein, Tiara and Vivanta, which we stock, are acrylic solid surface sheets in the same material category.",
      },
      {
        question: "Can solid surface countertops be repaired if scratched?",
        answer:
          "Yes — light scratches on acrylic solid surface can typically be sanded out on-site, unlike laminate or stone, because the colour runs through the full thickness of the sheet.",
      },
    ],
    applicationSlugs: ["modular-kitchen", "retail-stores", "hotel-interiors"],
    relatedCategorySlugs: ["laminates"],
  },
  {
    slug: "veneers",
    dbCategory: "Veneers",
    name: "Veneers",
    heroTagline: "Natural, dyed and embossed veneers — EightxFour's largest catalogue by shade and species.",
    overview:
      "Veneer is a thin slice of real wood bonded onto a substrate, used wherever a project calls for genuine wood grain without the cost or movement risk of solid timber — panelling, doors, reception counters and feature walls. This is EightxFour's deepest catalogue: natural species veneers, dyed veneers in editorial colourways, and embossed textures, sourced and quality-checked for Hyderabad fabrication.",
    buyingGuide:
      "Natural veneer grain is unique sheet-to-sheet — for a continuous grain run across a wall or door set, order from the same flitch/batch rather than mixing sheets bought at different times. Dyed and embossed veneers give more colour consistency if a uniform look across a large area matters more than natural grain variation.",
    faqs: [
      {
        question: "What's the difference between natural and dyed veneer?",
        answer:
          "Natural veneer keeps the wood's original colour and grain; dyed veneer is the same real-wood veneer treated with colour, giving designers a wider palette while keeping genuine wood texture.",
      },
      {
        question: "Can veneer be used outdoors?",
        answer:
          "Standard decorative veneer is specified for interior use — outdoor or high-moisture applications need a marine-grade adhesive and sealed finish, which we can advise on per project.",
      },
    ],
    applicationSlugs: ["office-furniture", "hotel-interiors", "retail-stores"],
    relatedCategorySlugs: ["plywood", "laminates"],
  },
  {
    slug: "adhesive",
    dbCategory: "Adhesive",
    name: "Adhesives",
    heroTagline: "Fevicol and wood-bonding adhesives to complete every plywood, laminate and veneer order.",
    overview:
      "Adhesives are the unglamorous product that determines whether every other material on this list actually stays bonded — laminate to board, veneer to substrate, joinery to frame. We stock Fevicol's wood-adhesive range alongside general construction adhesives, so a plywood or laminate order can leave complete rather than needing a second supplier run.",
    buyingGuide:
      "Match adhesive to substrate and moisture exposure — a synthetic resin adhesive rated for interior lamination is not the same product you'd use for exterior or high-moisture bonding. If you're already ordering plywood or laminates from us, add adhesive to the same inquiry so fabrication doesn't stall waiting on a separate order.",
    faqs: [
      {
        question: "Which Fevicol grade should I use for laminate bonding?",
        answer:
          "Synthetic resin adhesives (SR grades) are the standard choice for bonding laminate to plywood or MDF — share your substrate and application with us and we'll confirm the right grade and coverage for your BOQ.",
      },
      {
        question: "Do you sell adhesive in bulk for site use?",
        answer: "Yes — we supply adhesives in trade/bulk quantities alongside your material order, priced on request.",
      },
    ],
    applicationSlugs: ["modular-kitchen", "wardrobes"],
    relatedCategorySlugs: ["laminates", "veneers"],
  },
  {
    slug: "nfc-boards",
    dbCategory: "NFC Boards",
    name: "NFC (Natural Fibre Composite) Boards",
    heroTagline: "RelWOOD natural fibre composite boards — a moisture and termite-proof alternative to plywood and MDF.",
    overview:
      "Natural Fibre Composite (NFC) boards are an engineered wood-alternative made from natural fibre composite rather than timber veneers, giving them strong resistance to moisture, termites and weathering without deforestation. EightxFour stocks RelWOOD, Reliance Industries' NFC board line, across three densities and a full 8×4 ft thickness range for both interior and exterior use.",
    buyingGuide:
      "Pick density by application: lower-density boards (0.65 g/cm³) suit interior panelling and partitions where weight and cost matter, while the denser 1.0 g/cm³ board holds up better for exterior cladding, facades and outdoor furniture exposed to weathering. Because NFC boards are inherently moisture and termite resistant, they're a common substitute for BWP plywood or WPC on exterior-facing work.",
    faqs: [
      {
        question: "How is an NFC board different from plywood or MDF?",
        answer:
          "NFC (natural fibre composite) boards are made from compressed natural fibre composite rather than wood veneers or fibres, giving them built-in moisture, termite and weather resistance without the boiling-water bonding or lamination that plywood and MDF rely on.",
      },
      {
        question: "Can RelWOOD boards be used outdoors?",
        answer:
          "Yes — RelWOOD is designed for outdoor exposure, including cladding, facades, pergolas and gazebos, and is UV-resistant and weatherproof, unlike standard interior-grade plywood or MDF.",
      },
    ],
    applicationSlugs: ["commercial-spaces", "retail-stores", "hotel-interiors"],
    relatedCategorySlugs: ["plywood", "mdf-and-hdhmr", "boil-boards"],
  },

  // ---------- Coming soon: catalogue expansion, no live SKUs yet ----------
  // Pages exist so links/nav can point somewhere real, but each is noindex'd
  // (see generateMetadata in app/products/[slug]/page.tsx) until real
  // products, photos and pricing are added for it.
  {
    slug: "aluminium-sections",
    dbCategory: "Aluminium Sections",
    name: "Aluminium Sections",
    heroTagline: "Aluminium profiles and sections for modular furniture frames and partitions — catalogue coming soon.",
    overview:
      "Aluminium sections are extruded profiles used for door and window frames, modular furniture edging, partition systems and structural framing where a lightweight, corrosion-resistant material is preferred over steel or timber.",
    buyingGuide:
      "We're building out this catalogue with real stock and pricing. Share your section profile and quantity requirement with us in the meantime and we'll check availability across our sourcing network.",
    faqs: [
      {
        question: "Do you currently stock aluminium sections?",
        answer: "This category is being added to our catalogue. Get in touch with your requirement and we'll confirm current availability.",
      },
    ],
    applicationSlugs: ["commercial-spaces"],
    relatedCategorySlugs: [],
  },
  {
    slug: "galvanised-iron-sheets",
    dbCategory: "Galvanised Iron Sheets",
    name: "Galvanised Iron Sheets",
    heroTagline: "Zinc-coated GI sheets for roofing, cladding and structural applications — catalogue coming soon.",
    overview:
      "Galvanised iron (GI) sheets are steel sheets coated with a protective zinc layer, used for roofing, exterior cladding, ducting and structural work where corrosion resistance matters.",
    buyingGuide:
      "We're building out this catalogue with real stock and pricing. Share your gauge, sheet size and quantity requirement with us in the meantime and we'll check availability across our sourcing network.",
    faqs: [
      {
        question: "Do you currently stock GI sheets?",
        answer: "This category is being added to our catalogue. Get in touch with your requirement and we'll confirm current availability.",
      },
    ],
    applicationSlugs: ["commercial-spaces"],
    relatedCategorySlugs: [],
  },
  {
    slug: "steel-pipes",
    dbCategory: "Steel Pipes",
    name: "Steel Pipes",
    heroTagline: "Structural and plumbing-grade steel pipes — catalogue coming soon.",
    overview:
      "Steel pipes are used across structural framing, railings, plumbing and site scaffolding — specified by diameter, wall thickness and grade depending on load and application.",
    buyingGuide:
      "We're building out this catalogue with real stock and pricing. Share your diameter, grade and quantity requirement with us in the meantime and we'll check availability across our sourcing network.",
    faqs: [
      {
        question: "Do you currently stock steel pipes?",
        answer: "This category is being added to our catalogue. Get in touch with your requirement and we'll confirm current availability.",
      },
    ],
    applicationSlugs: ["commercial-spaces"],
    relatedCategorySlugs: [],
  },
  {
    slug: "blockboards",
    dbCategory: "Blockboard",
    name: "Blockboards",
    heroTagline: "Solid-core blockboard for long-span shelving and worktops, in pinewood and hardwood core.",
    overview:
      "Blockboard is a solid-core engineered panel — a core of glued timber strips sandwiched between Gurjan face veneer — prized for holding screws well and resisting sag over long, unsupported spans like shelving and worktops. EightxFour stocks it in two core types: pinewood, which is lighter and easier to work with, and hardwood, which is denser and stronger for the same thickness.",
    buyingGuide:
      "Pick pinewood core for general shelving, wardrobe shutters and worktops where weight and cost matter more than maximum strength. Step up to hardwood core for longer spans or heavier loads where sag resistance and screw-holding strength are the priority. Both are stocked in 16mm, 18mm and 25mm; pinewood also comes in a wider 10×4 ft sheet for larger spans.",
    faqs: [
      {
        question: "What's the difference between pinewood and hardwood blockboard?",
        answer:
          "Both use a solid glued-timber core sandwiched between Gurjan face veneer. Pinewood core is lighter and more affordable; hardwood core is denser and stronger, so it holds screws better and resists sag over longer spans.",
      },
      {
        question: "What thicknesses does blockboard come in?",
        answer: "We stock both pinewood and hardwood blockboard in 16mm, 18mm and 25mm, in 8×4 ft sheets — pinewood is also available in 10×4 ft.",
      },
    ],
    applicationSlugs: ["modular-kitchen", "office-furniture"],
    relatedCategorySlugs: ["plywood", "mdf-and-hdhmr"],
  },
  {
    slug: "cement-boards",
    dbCategory: "Cement Board",
    name: "Cement Boards",
    heroTagline: "Fibre-cement boards for wet-area partitions and exterior cladding — catalogue coming soon.",
    overview:
      "Cement boards are fibre-cement panels used for wet-area partitions, exterior cladding and tile backer applications where moisture resistance and dimensional stability matter more than a fine finish.",
    buyingGuide:
      "We're building out this catalogue with real stock and pricing. Share your thickness and quantity requirement with us in the meantime and we'll check availability across our sourcing network.",
    faqs: [
      {
        question: "Do you currently stock cement board?",
        answer: "This category is being added to our catalogue. Get in touch with your requirement and we'll confirm current availability.",
      },
    ],
    applicationSlugs: ["commercial-spaces"],
    relatedCategorySlugs: ["plywood", "mdf-and-hdhmr"],
  },
  {
    slug: "louvers",
    dbCategory: "Louvers",
    name: "Louvers",
    heroTagline: "Slatted panels for ventilated doors, partitions and facades — catalogue coming soon.",
    overview:
      "Louvers are slatted panels — in wood, veneer or composite — used for ventilated wardrobe doors, room partitions and facade screening where airflow and visual texture matter more than a solid surface.",
    buyingGuide:
      "We're building out this catalogue with real stock and pricing. Share your panel size and material preference with us in the meantime and we'll check availability across our sourcing network.",
    faqs: [
      {
        question: "Do you currently stock louver panels?",
        answer: "This category is being added to our catalogue. Get in touch with your requirement and we'll confirm current availability.",
      },
    ],
    applicationSlugs: ["wardrobes", "commercial-spaces"],
    relatedCategorySlugs: ["veneers", "wall-panels"],
  },
  {
    slug: "wall-panels",
    dbCategory: "Wall Panels",
    name: "Wall Panels",
    heroTagline: "Decorative and acoustic wall panelling for feature walls — catalogue coming soon.",
    overview:
      "Wall panels are prefabricated decorative or acoustic panels — in wood, veneer, fabric-wrapped or fluted finishes — used for feature walls, reception backdrops and acoustic treatment in commercial and residential interiors.",
    buyingGuide:
      "We're building out this catalogue with real stock and pricing. Share your panel style and area requirement with us in the meantime and we'll check availability across our sourcing network.",
    faqs: [
      {
        question: "Do you currently stock wall panels?",
        answer: "This category is being added to our catalogue. Get in touch with your requirement and we'll confirm current availability.",
      },
    ],
    applicationSlugs: ["hotel-interiors", "commercial-spaces", "retail-stores"],
    relatedCategorySlugs: ["veneers", "louvers"],
  },
  {
    slug: "hardware",
    dbCategory: "Hardware",
    name: "Hardware",
    heroTagline: "Hinges, channels, locks and fittings for cabinetry and doors — catalogue coming soon.",
    overview:
      "Hardware covers the fittings that make cabinetry and doors actually function — hinges, drawer channels, tandem boxes, locks, handles and sliding fittings. It's the category that turns a plywood carcass into working furniture.",
    buyingGuide:
      "We're building out this catalogue with real stock and pricing. Share your fitting type and quantity requirement with us in the meantime and we'll check availability across our sourcing network.",
    faqs: [
      {
        question: "Do you currently stock hardware and fittings?",
        answer: "This category is being added to our catalogue. Get in touch with your requirement and we'll confirm current availability.",
      },
    ],
    applicationSlugs: ["modular-kitchen", "wardrobes"],
    relatedCategorySlugs: ["plywood", "laminates"],
  },
  {
    slug: "timber",
    dbCategory: "Timber",
    name: "Timber",
    heroTagline: "Sal, teak and pine solid timber for structural and furniture use — catalogue coming soon.",
    overview:
      "Solid timber — sal, teak and pine among the species most used in Hyderabad interiors and construction — for structural framing, door frames, furniture and applications where solid wood is specified over engineered panels.",
    buyingGuide:
      "We're building out this catalogue with real stock and pricing. Share your species and section-size requirement with us in the meantime and we'll check availability across our sourcing network.",
    faqs: [
      {
        question: "Do you currently stock solid timber?",
        answer: "This category is being added to our catalogue. Get in touch with your requirement and we'll confirm current availability.",
      },
    ],
    applicationSlugs: ["office-furniture"],
    relatedCategorySlugs: ["plywood", "veneers"],
  },
  {
    slug: "nails",
    dbCategory: "Nails",
    name: "Nails",
    heroTagline: "Wire and panel nails for carpentry and site fixing — catalogue coming soon.",
    overview:
      "Nails cover wire nails, panel pins and framing nails used across carpentry, false ceiling work and site fixing — sized by length and gauge depending on the material being joined.",
    buyingGuide:
      "We're building out this catalogue with real stock and pricing. Share your size and quantity requirement with us in the meantime and we'll check availability across our sourcing network.",
    faqs: [
      {
        question: "Do you currently stock nails?",
        answer: "This category is being added to our catalogue. Get in touch with your requirement and we'll confirm current availability.",
      },
    ],
    applicationSlugs: ["modular-kitchen", "wardrobes"],
    relatedCategorySlugs: ["hardware", "plywood"],
  },
  {
    slug: "screws",
    dbCategory: "Screws",
    name: "Screws",
    heroTagline: "Wood, drywall and machine screws for fittings and fixtures — catalogue coming soon.",
    overview:
      "Screws span wood screws, drywall screws and machine screws used for hardware fitting, panel fixing and furniture assembly — specified by length, gauge and head type against the material and load.",
    buyingGuide:
      "We're building out this catalogue with real stock and pricing. Share your size and quantity requirement with us in the meantime and we'll check availability across our sourcing network.",
    faqs: [
      {
        question: "Do you currently stock screws?",
        answer: "This category is being added to our catalogue. Get in touch with your requirement and we'll confirm current availability.",
      },
    ],
    applicationSlugs: ["modular-kitchen", "wardrobes"],
    relatedCategorySlugs: ["hardware", "plywood"],
  },
];

export function getCategoryBySlug(slug: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

// Singular form of a dbCategory value for SEO copy ("Laminates" -> "Laminate")
// — every plural dbCategory on file is a plain "-s" plural, so a trailing-s
// strip covers all of them without a per-category lookup table.
export function categorySingularName(dbCategory: string): string {
  return dbCategory.endsWith("s") ? dbCategory.slice(0, -1) : dbCategory;
}

export function getCategoryByDbCategory(dbCategory: string): CategoryConfig | undefined {
  return CATEGORIES.find((c) => c.dbCategory === dbCategory);
}
