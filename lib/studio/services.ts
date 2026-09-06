import type { StudioService } from "./types";

/**
 * The service registry. Order here is the order everywhere — nav, homepage
 * cards, footer. Services without a configurator still get a real page; they
 * lead with upload or scope rather than pretending to price.
 */
export const STUDIO_SERVICES: StudioService[] = [
  {
    slug: "custom-furniture",
    index: "01",
    name: "Custom Furniture",
    navLabel: "Custom Furniture",
    tagline: "Wardrobes, kitchens and storage — built by carpenter or by factory, priced either way.",
    description:
      "Pick what you're building, give it dimensions, then choose the carcass board, the shutter board, the finish and the hardware. The estimate moves with every decision, and the material lines stay named — you can see the plywood brand, the laminate grade and the hinge count that produced the number.",
    scope: [
      "Wardrobes",
      "Modular kitchens",
      "TV units",
      "Vanity units",
      "Crockery units",
      "Study & storage units",
      "Office cabinetry",
      "Retail fixtures",
    ],
    feedsFrom: ["Plywood", "MDF & HDHMR", "Laminates", "Veneers", "Hardware", "Adhesives"],
    hasConfigurator: true,
    fromRate: { amount: 1150, unit: "per sq ft" },
    entries: [
      {
        mode: "configure",
        label: "Configure furniture",
        detail: "Dimensions, boards, finish, hardware — live estimate.",
        href: "/studio/custom-furniture",
      },
      {
        mode: "upload",
        label: "Upload drawing",
        detail: "Send elevations or a BOQ, get it priced back.",
        href: "/studio/project-execution",
      },
      {
        mode: "assist",
        label: "Talk it through",
        detail: "For when the brief isn't settled yet.",
        href: "/contact",
      },
    ],
  },
  {
    slug: "solid-surface",
    index: "02",
    name: "Acrylic Solid Surface Fabrication",
    navLabel: "Solid Surface",
    tagline: "Seamless counters, vanities and reception desks, fabricated and installed.",
    description:
      "Acrylic solid surface is bought by the sheet and sold by the joint — what you pay for is thermoforming, seaming and the cut-outs. Choose the sheet from the catalogue, give it a run length, add the sink and hob cut-outs and the edge profile, and the fabrication cost separates from the material cost.",
    scope: [
      "Kitchen countertops",
      "Vanity counters",
      "Reception & commercial desks",
      "Wall cladding",
      "Healthcare counters",
      "Retail displays",
      "Custom thermoformed shapes",
    ],
    feedsFrom: ["Solid Surface / Corian", "Adhesives"],
    hasConfigurator: true,
    fromRate: { amount: 1450, unit: "per running ft" },
    entries: [
      {
        mode: "configure",
        label: "Configure surface",
        detail: "Sheet, run length, cut-outs, edge profile.",
        href: "/studio/solid-surface",
      },
      {
        mode: "upload",
        label: "Upload counter drawing",
        detail: "Plan or template with dimensions marked.",
        href: "/studio/project-execution",
      },
      { mode: "assist", label: "Ask about a shape", detail: "Curves, waterfalls, integrated basins.", href: "/contact" },
    ],
  },
  {
    slug: "laminate-pressing",
    index: "03",
    name: "Laminate Pressing",
    navLabel: "Laminate Pressing",
    tagline: "Buy the board. Choose the laminate. It arrives already pressed.",
    description:
      "The most direct link between the catalogue and the workshop. Select a board and a laminate you're already buying from EightByFour, pick single or double side, and the sheets are pressed and edge-trimmed before they reach your site — no site pressing, no adhesive on the floor, no waiting for the panel to cure.",
    scope: ["Single side pressing", "Double side pressing", "Balancing laminate", "Edge trimming", "Panel cutting to size"],
    feedsFrom: ["Plywood", "MDF & HDHMR", "Laminates", "Adhesives"],
    hasConfigurator: true,
    fromRate: { amount: 340, unit: "per sheet, per side" },
    entries: [
      {
        mode: "configure",
        label: "Build a pressed panel",
        detail: "Board + laminate + pressing = a finished-panel price.",
        href: "/studio/laminate-pressing",
      },
      {
        mode: "upload",
        label: "Send a panel list",
        detail: "Bulk pressing across multiple boards.",
        href: "/studio/project-execution",
      },
      { mode: "assist", label: "Check compatibility", detail: "Board, laminate and adhesive pairing.", href: "/contact" },
    ],
  },
  {
    slug: "panel-processing",
    index: "04",
    name: "Panel Processing",
    navLabel: "Panel Processing",
    tagline: "Cutting, edge banding, CNC and machining — from your cutting list.",
    description:
      "Built for carpenters, contractors and modular units who already know their panel sizes. Send a cutting list and get panels sized, edge-banded, grooved and drilled to a 32 mm system before delivery. Factory edge banding on all four sides is the single biggest visible difference between site-made and factory-made furniture.",
    scope: [
      "Panel sizing & cutting",
      "CNC cutting",
      "Edge banding (0.8 / 1 / 2 mm)",
      "Grooving",
      "Line drilling (32 mm system)",
      "Hinge boring",
      "Routing & profiling",
    ],
    feedsFrom: ["Plywood", "MDF & HDHMR", "Edge Banding"],
    hasConfigurator: false,
    fromRate: { amount: 42, unit: "per running ft, edge banded" },
    entries: [
      {
        mode: "upload",
        label: "Upload cutting list",
        detail: "CSV, Excel or a photographed list — panel sizes and quantities.",
        href: "/studio/panel-processing",
      },
      {
        mode: "configure",
        label: "Enter panels manually",
        detail: "For a short list you'd rather type than upload.",
        href: "/studio/panel-processing",
      },
      { mode: "assist", label: "Trade rates", detail: "Running rates for regular volume.", href: "/contact" },
    ],
  },
  {
    slug: "installation",
    index: "05",
    name: "Installation",
    navLabel: "Installation",
    tagline: "You already have the material. This is the crew that fits it.",
    description:
      "Installation-only scope for material bought here or elsewhere — laminate and veneer application, wall panel and louver fixing, solid surface installation, hardware fitting and furniture assembly. Priced by area or by unit, with the scope written down before anyone arrives on site.",
    scope: [
      "Laminate installation",
      "Veneer installation",
      "Wall panel installation",
      "Louver installation",
      "Solid surface installation",
      "Hardware fitting",
      "Furniture installation",
      "Door installation",
    ],
    feedsFrom: ["Laminates", "Veneers", "Louvers", "Hardware", "Doors"],
    hasConfigurator: false,
    fromRate: { amount: 65, unit: "per sq ft" },
    entries: [
      {
        mode: "configure",
        label: "Pick a scope",
        detail: "Choose the surface and the area — get an installation rate.",
        href: "/studio/installation",
      },
      { mode: "upload", label: "Send site photos", detail: "Faster than describing the condition.", href: "/studio/project-execution" },
      { mode: "assist", label: "Site visit", detail: "Where measurement has to happen first.", href: "/contact" },
    ],
  },
  {
    slug: "project-execution",
    index: "06",
    name: "Project Execution",
    navLabel: "Project Execution",
    tagline: "Send the drawing. Get the materials and the execution priced together.",
    description:
      "For architects, designers, contractors and rollout teams. Upload a BOQ, a material schedule, a drawing set or a cutting list and get back a structured quote that separates materials, fabrication, installation and logistics — line by line, with brands named, so it can be checked against your own estimate rather than accepted on trust.",
    scope: [
      "Residential projects",
      "Corporate interiors",
      "Retail rollouts",
      "Hospitality fit-outs",
      "Builder & developer supply",
      "Multi-site logistics",
    ],
    feedsFrom: ["Full catalogue", "Fabrication", "Installation", "Logistics"],
    hasConfigurator: false,
    entries: [
      {
        mode: "upload",
        label: "Upload BOQ",
        detail: "BOQ, drawings, material schedule or cutting list.",
        href: "/studio/project-execution",
      },
      {
        mode: "configure",
        label: "Configure a sample scope",
        detail: "Price one wardrobe to sanity-check the rates first.",
        href: "/studio/custom-furniture",
      },
      { mode: "assist", label: "Speak to the studio", detail: "Multi-site or phased programmes.", href: "/contact" },
    ],
  },
];

export function getService(slug: string): StudioService | undefined {
  return STUDIO_SERVICES.find((s) => s.slug === slug);
}

/** Trust signals. Deliberately claims only what the platform actually does. */
export const STUDIO_ASSURANCES = [
  {
    title: "Named materials",
    body: "Every quote names the board, the laminate and the hardware — brand, grade and thickness. Nothing is described only as “premium”.",
  },
  {
    title: "Separated pricing",
    body: "Material, fabrication, installation and delivery are priced apart, so you can see what you're paying for labour versus what you're paying for sheets.",
  },
  {
    title: "Catalogue-sourced",
    body: "Materials come through the same EightByFour supply the shop runs on, from manufacturers already stocked for Hyderabad sites.",
  },
  {
    title: "Written scope",
    body: "What is included, what is excluded and what is provisional is stated on the quote before work starts.",
  },
  {
    title: "Milestone records",
    body: "Key stages — material despatch, fabrication, installation — are recorded against the job rather than left to memory.",
  },
  {
    title: "One trail",
    body: "Materials and services sit on the same order, so there is a single record for the sheets and the labour that used them.",
  },
] as const;
