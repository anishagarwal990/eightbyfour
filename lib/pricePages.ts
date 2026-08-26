// Hyderabad price pages — the commercial-intent layer between a category
// listing ("what plywood do you stock?") and a product page ("what is this
// exact SKU?"). They answer the question people actually type: what does
// this material cost in this city, right now, across the brands available.
//
// These are configuration, not content files, because every number on them
// is read live from the `products` table at render time. The prose here is
// the part that can't be derived — the framing, the trade context, the
// comparison tables and the FAQ. Nothing in this file states a price.

export interface PriceSelector {
  /** Must match the `category` column in Supabase `products`. */
  dbCategories: string[];
  brands?: string[];
  collections?: string[];
  grades?: string[];
  slugs?: string[];
  excludeSlugs?: string[];
  /** Case-insensitive regex tested against "brand name collection". */
  namePattern?: string;
  /** Case-insensitive regex tested against each entry of `certifications`. */
  certificationPattern?: string;
  thicknessMm?: number;
  /**
   * Millimetres of slack around `thicknessMm`. Nominal and actual board
   * thicknesses diverge in this trade — the sheet Hyderabad carpenters buy
   * and search for as "18mm plywood" is stocked by every plywood brand here
   * as 19mm — so an exact match would empty the page of the very product
   * the searcher meant. See lib/thickness.ts.
   */
  thicknessTolerance?: number;
}

/**
 * How a "best X" pick is chosen. Always resolved against the live rows, so a
 * recommendation can never contradict the price table directly above it —
 * and never survives the product leaving the catalogue.
 */
export type PickCriterion =
  | { kind: "cheapest" }
  | { kind: "dearest" }
  | { kind: "cheapestWithGrade"; grades: string[] }
  | { kind: "cheapestWithCertification"; pattern: string }
  | { kind: "product"; slug: string };

export interface PickSpec {
  label: string;
  criterion: PickCriterion;
  /** Why this slot matters on site — the specs themselves are rendered from the row. */
  note: string;
}

export interface ComparisonBlock {
  heading: string;
  intro?: string;
  columns: string[];
  rows: string[][];
  footnote?: string;
}

export interface PricePageConfig {
  slug: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  /** Two or three paragraphs. Trade context only — no keyword padding. */
  intro: string[];
  selector: PriceSelector;
  /**
   * "table" renders one row per SKU — right for boards, where the catalogue
   * is a few dozen products with distinct specs. "ranges" groups by brand
   * and collection — right for laminates, where a single rate covers
   * hundreds of shades and a 700-row table would be worse than useless.
   */
  layout: "table" | "ranges";
  focusThicknessMm?: number;
  /**
   * Brand pages this price page should surface on. Kept explicit rather than
   * derived from `selector.brands`, because the brand names in the catalogue
   * ("Century Laminates", "Sky Decor") and the brand-page slugs are not the
   * same strings.
   */
  brandSlugs?: string[];
  /** Rendered under the table. Use it to state what the quoted span covers. */
  tableNote?: string;
  picks?: PickSpec[];
  comparison?: ComparisonBlock;
  applications?: { heading: string; body: string }[];
  crossSell: { label: string; href: string; note: string }[];
  related: { label: string; href: string }[];
  faqs: { question: string; answer: string }[];
}

// Shared trade context reused across the plywood cluster. Not a template for
// prose — just the two facts every plywood page has to restate because the
// price table is meaningless without them.
const PLYWOOD_GST_NOTE =
  "Rates above are per sq.ft, exclusive of GST, and are the band each product is quoted across — they are not mapped to a specific thickness, so the low end is not necessarily the thinnest sheet. Ask for a confirmed rate against the thickness and sheet count you need.";

const GRADE_COMPARISON: ComparisonBlock = {
  heading: "MR vs BWR vs BWP vs FR",
  intro:
    "Grade is the single biggest driver of plywood price, and it is set by the adhesive and the boil test the sheet passes — not by the brand's marketing name for the range.",
  columns: ["Grade", "IS standard", "Water behaviour", "Where it belongs", "Relative cost"],
  rows: [
    ["MR", "IS 303", "Resists humidity and splashes; fails under sustained soaking", "Wardrobes, bedroom units, TV units, dry-area storage", "Lowest"],
    ["BWR", "IS 303", "Longer boil resistance than MR; still an interior-grade bond", "Kitchen carcasses away from the sink, utility cupboards", "Low-mid"],
    ["BWP / 710", "IS 710", "Passes the 72-hour boiling water test", "Kitchen base units, bathroom vanities, balcony and utility joinery", "Mid-high"],
    ["FR", "IS 5509", "Fire-retardant treatment; water behaviour depends on the base grade", "Offices, hotels, retail and any fit-out with a code requirement", "High"],
    ["STR", "IS 10701", "Structural bond, graded for load rather than water", "Loft platforms, seating bases, heavy shelving spans", "High"],
  ],
  footnote:
    "Grade names printed on a sheet's edge are not proof of grade. Ask for the IS marking and the manufacturer's test certificate — every product listed above carries its certification in the table.",
};

const PLYWOOD_CROSS_SELL = [
  { label: "Laminates", href: "/products/laminates", note: "Surface finish for every shutter and exposed panel in the same order." },
  { label: "Adhesive", href: "/products/adhesive", note: "Fevicol SH, Marine and Hiper in pack sizes matched to sheet count." },
  { label: "Veneers", href: "/products/veneers", note: "Natural and engineered veneer where the grain has to be real." },
  { label: "MDF and HDHMR", href: "/products/mdf-and-hdhmr", note: "Flatter substrate for shutters and routed fronts than plywood gives." },
];

const PLYWOOD_PRICE: PricePageConfig = {
  slug: "plywood-price",
  h1: "Plywood Price in Hyderabad",
  metaTitle: "Plywood Price in Hyderabad",
  metaDescription:
    "Current plywood rates in Hyderabad across MR, BWR, BWP and fire-retardant grades from Century, Austin, Green Panel and Wigwam Excel. Compare per sq.ft and per sheet, then quote your whole list.",
  eyebrow: "Hyderabad price guide",
  intro: [
    "Plywood in Hyderabad is quoted per square foot excluding GST, and the number moves on three things: grade, thickness and core. Across the catalogue below the spread runs from the low thirties to well past ₹150/sq.ft, so a single plywood rate quoted over the phone means very little until all three are fixed.",
    "The table below is the live catalogue — every plywood brand and grade EightByFour sources, with the rate span each product is stocked at and the certification it carries. Where a manufacturer's rates are not loaded yet the row says so; nothing here is an estimate.",
    "Per-sheet figures are the per-sq.ft rate multiplied by the sheet's own area — a standard 8×4 ft board is 32 sq.ft. They are there to sanity-check a quote you have been given elsewhere. The number that goes on your order is confirmed against current stock.",
  ],
  selector: { dbCategories: ["Plywood", "Birch Plywood"] },
  layout: "table",
  tableNote: PLYWOOD_GST_NOTE,
  picks: [
    { label: "Lowest rate in the catalogue", criterion: { kind: "cheapest" }, note: "Where a dry-area carcass or a concealed back panel does not justify a premium bond." },
    { label: "Cheapest IS 710 boil-proof option", criterion: { kind: "cheapestWithCertification", pattern: "710" }, note: "The entry point for kitchen base units and bathroom vanities, where the 72-hour boil test is the whole point." },
    { label: "Cheapest fire-retardant option", criterion: { kind: "cheapestWithGrade", grades: ["FR"] }, note: "Offices, hotels and retail fit-outs where IS 5509 is a code requirement rather than a preference." },
    { label: "Cheapest structural-grade option", criterion: { kind: "cheapestWithGrade", grades: ["STR"] }, note: "Loft platforms, seating bases and shelving that spans more than about 900mm without support." },
    { label: "Premium end of the range", criterion: { kind: "dearest" }, note: "Specification-led work where the cross-section, edge quality or a named certification is written into the drawing." },
  ],
  comparison: GRADE_COMPARISON,
  applications: [
    { heading: "Modular kitchen", body: "Base units and anything under the counter should be IS 710 BWP at 19mm for carcasses and shutters. Wall units away from the sink can drop to BWR. Drawer bottoms take 6mm." },
    { heading: "Wardrobes", body: "MR grade at 19mm for the carcass is the Hyderabad standard and is what most contractors quote. Shutters follow the finish — 19mm if laminated both sides, 12mm for internal partitions and shelves under 750mm." },
    { heading: "Office and commercial fit-out", body: "Fire-retardant grade is usually mandatory rather than optional. Check the tender's IS 5509 clause before pricing; the FR premium over BWP is smaller than the cost of re-doing a rejected fit-out." },
    { heading: "Bathroom vanity and utility", body: "BWP only, and worth paying for the longer-warranty options. This is the one application where the difference between BWR and genuine IS 710 shows up within two monsoons." },
  ],
  crossSell: PLYWOOD_CROSS_SELL,
  related: [
    { label: "18mm plywood price", href: "/hyderabad/18mm-plywood-price" },
    { label: "12mm plywood price", href: "/hyderabad/12mm-plywood-price" },
    { label: "6mm plywood price", href: "/hyderabad/6mm-plywood-price" },
    { label: "MR plywood price", href: "/hyderabad/mr-plywood-price" },
    { label: "BWP plywood price", href: "/hyderabad/bwp-plywood-price" },
    { label: "Marine plywood price", href: "/hyderabad/marine-plywood-price" },
    { label: "Century plywood price", href: "/hyderabad/century-plywood-price" },
    { label: "Greenply plywood price", href: "/hyderabad/greenply-plywood-price" },
    { label: "Plywood supplier in Hyderabad", href: "/hyderabad/plywood-supplier" },
    { label: "Plywood grades explained", href: "/guides/plywood-grades-explained" },
    { label: "Best plywood for kitchen", href: "/guides/best-plywood-for-kitchen" },
    { label: "BOQ procurement", href: "/hyderabad/boq-procurement" },
  ],
  faqs: [
    {
      question: "What is the current plywood rate in Hyderabad?",
      answer:
        "It depends on grade and thickness rather than on a single market rate. The table on this page shows the live span for each product we source — read the rate together with the grade column and the thickness span it covers, and request a confirmed rate for the specific thickness you need.",
    },
    {
      question: "Are these plywood prices inclusive of GST?",
      answer:
        "No. Every rate shown is exclusive of GST, which is how plywood is quoted in the trade. GST is added on the final quotation along with delivery.",
    },
    {
      question: "How do I convert a per sq.ft rate into a sheet price?",
      answer:
        "Multiply by the sheet area. A standard 8×4 ft sheet is 32 sq.ft, so ₹60/sq.ft works out to ₹1,920 a sheet before GST. The per-sheet column on this page does that arithmetic for you using each product's own stocked sheet size.",
    },
    {
      question: "Do contractors get a different plywood rate?",
      answer:
        "Trade and volume pricing is quoted against the actual list rather than published as a second rate card. Send the sheet count by grade and thickness and the quotation comes back priced for that volume.",
    },
    {
      question: "Can I order plywood, laminate and adhesive together?",
      answer:
        "Yes — that is the reason this catalogue spans categories. Send the full material list and it comes back as one itemised quotation with a single delivery schedule instead of four separate vendor conversations.",
    },
  ],
};

function thicknessPage(opts: {
  slug: string;
  mm: number;
  tolerance: number;
  h1: string;
  metaDescription: string;
  intro: string[];
  tableNote: string;
  applications: { heading: string; body: string }[];
  faqs: { question: string; answer: string }[];
  related: { label: string; href: string }[];
}): PricePageConfig {
  return {
    slug: opts.slug,
    h1: opts.h1,
    metaTitle: opts.h1,
    metaDescription: opts.metaDescription,
    eyebrow: "Hyderabad price guide",
    intro: opts.intro,
    selector: { dbCategories: ["Plywood", "Birch Plywood"], thicknessMm: opts.mm, thicknessTolerance: opts.tolerance },
    layout: "table",
    focusThicknessMm: opts.mm,
    tableNote: opts.tableNote,
    picks: [
      { label: "Lowest-priced sheet at this thickness", criterion: { kind: "cheapest" }, note: "Cheapest product in the catalogue stocked at this thickness. The rate shown is its own span — ask for the confirmed rate at this thickness." },
      { label: "Cheapest IS 710 boil-proof option", criterion: { kind: "cheapestWithCertification", pattern: "710" }, note: "Entry point for wet-area work — kitchen base units, vanities, utility joinery." },
      { label: "Premium end of the range", criterion: { kind: "dearest" }, note: "Longest warranties and the tightest edge quality." },
    ],
    comparison: GRADE_COMPARISON,
    applications: opts.applications,
    crossSell: PLYWOOD_CROSS_SELL,
    related: opts.related,
    faqs: opts.faqs,
  };
}

const THICKNESS_RELATED = [
  { label: "Plywood price in Hyderabad", href: "/hyderabad/plywood-price" },
  { label: "18mm plywood price", href: "/hyderabad/18mm-plywood-price" },
  { label: "12mm plywood price", href: "/hyderabad/12mm-plywood-price" },
  { label: "6mm plywood price", href: "/hyderabad/6mm-plywood-price" },
  { label: "MR plywood price", href: "/hyderabad/mr-plywood-price" },
  { label: "BWP plywood price", href: "/hyderabad/bwp-plywood-price" },
  { label: "Plywood supplier in Hyderabad", href: "/hyderabad/plywood-supplier" },
  { label: "Estimating plywood and laminate quantities", href: "/guides/estimating-plywood-laminate-quantities" },
  { label: "BOQ procurement", href: "/hyderabad/boq-procurement" },
];

const EIGHTEEN_MM = thicknessPage({
  slug: "18mm-plywood-price",
  mm: 18,
  tolerance: 1,
  h1: "18mm Plywood Price in Hyderabad",
  metaDescription:
    "18mm plywood rates in Hyderabad across MR, BWR, BWP and FR grades. See which brands stock 18mm and which sell it as 19mm nominal, compare per sheet, and quote your full requirement.",
  intro: [
    "18mm is the working thickness for almost every carcass and shutter on a Hyderabad site — kitchen base units, wardrobe bodies, office storage. It is also the thickness where the grade decision costs the most money, because you are buying it by the dozen.",
    "One thing worth knowing before you compare quotes: most plywood brands sell this sheet as 19mm nominal, not 18mm. The board a carpenter calls 18mm and the board a manufacturer lists as 19mm are the same product on most price lists, which is why both appear in the table below. Where a brand genuinely stocks a distinct 18mm sheet, its own label is shown in the thickness column.",
    "Rates are per sq.ft excluding GST. Because most products are stocked as a single price band across their whole thickness range, the span shown covers thin and thick sheets alike — request a confirmed 18mm rate for the sheet count you actually need.",
  ],
  tableNote:
    "The thickness column shows each product's own stocked label at or nearest 18mm — 19mm on most brands' lists, 18mm where the brand stocks it as such. Rate spans cover the product's full thickness range unless an exact per-thickness rate is loaded.",
  applications: [
    { heading: "Kitchen carcass", body: "18/19mm BWP is the default for base units. The carcass carries the counter load and the hinge screws, and it is the part that meets water first." },
    { heading: "Wardrobe body and shutters", body: "18/19mm MR is standard where the wardrobe sits against a dry internal wall. Shutters at this thickness stay flat under laminate on both faces." },
    { heading: "Office storage and reception", body: "Fire-retardant grade at this thickness, where the fit-out tender specifies IS 5509." },
    { heading: "Loft and heavy shelving", body: "Structural grade rather than BWP once a shelf spans past about 900mm unsupported, or once it carries stored weight." },
  ],
  faqs: [
    {
      question: "Is 18mm plywood the same as 19mm?",
      answer:
        "On most Indian manufacturers' price lists, yes — the sheet sold as 19mm nominal is what the trade orders as 18mm. Actual calibrated thickness varies by brand and by whether the sheet is calibrated at all, so if a fabricator's hardware depends on an exact thickness, ask for the calibrated figure before ordering.",
    },
    {
      question: "How many 18mm sheets do I need for a wardrobe?",
      answer:
        "A standard 7ft × 6ft two-door wardrobe with internal shelving typically works out at 6–8 sheets of 18mm plus 2–3 sheets of 12mm and a 6mm back. Share the elevation or the measurements and we will size the list against the actual design.",
    },
    {
      question: "What does 18mm plywood cost per sheet in Hyderabad?",
      answer:
        "Multiply the per sq.ft rate in the table by 32 for a standard 8×4 ft sheet. The per-sheet column already does that; treat it as a check figure rather than a quotation, since confirmed pricing depends on current stock and order volume.",
    },
    {
      question: "Should I use 18mm MR or 18mm BWP for a kitchen?",
      answer:
        "BWP for anything below the counter and anywhere near the sink or the dishwasher. MR is acceptable for tall units and wall cabinets on a dry wall, and the saving is real, but it is a false economy under a hob or a sink.",
    },
  ],
  related: THICKNESS_RELATED,
});

const TWELVE_MM = thicknessPage({
  slug: "12mm-plywood-price",
  mm: 12,
  tolerance: 0,
  h1: "12mm Plywood Price in Hyderabad",
  metaDescription:
    "12mm plywood rates in Hyderabad by brand and grade — MR, BWR, BWP and FR. Compare per sq.ft and per sheet for shelves, partitions and cabinet backs, then quote the whole list.",
  intro: [
    "12mm is the shelving and partition thickness — the sheet that fills out a wardrobe interior, backs a cabinet run and carries loads that never reach structural territory. On a full flat it usually outnumbers every other thickness on the BOQ except 18mm.",
    "Every plywood brand in this catalogue stocks 12mm as a distinct sheet, so the table below is an exact-thickness list rather than a nearest match. Rates are per sq.ft excluding GST.",
    "Most products carry one rate band across their whole thickness range, so the span shown includes both thinner and thicker sheets. Ask for a confirmed 12mm rate against your sheet count.",
  ],
  tableNote: PLYWOOD_GST_NOTE,
  applications: [
    { heading: "Wardrobe shelving", body: "12mm handles a 600mm shelf span comfortably under folded clothing. Past 900mm it will bow — move to 18mm or add a mid support." },
    { heading: "Cabinet backs and partitions", body: "12mm is the common back-panel thickness where the cabinet is free-standing or the back is visible; 6mm is the cheaper choice where it is fixed against a wall." },
    { heading: "Bathroom vanity shelving", body: "BWP grade only. A 12mm MR shelf inside a vanity is the single most common warranty complaint on Hyderabad bathroom joinery." },
    { heading: "False ceiling and boxing", body: "12mm where the ceiling carries a light fitting or a curtain track; thinner sheets flex around the fixing point." },
  ],
  faqs: [
    {
      question: "What is the price of 12mm plywood in Hyderabad?",
      answer:
        "The table on this page lists every 12mm sheet we source with its live rate span, grade and certification. Rates are per sq.ft excluding GST; multiply by 32 for a standard 8×4 ft sheet.",
    },
    {
      question: "Can I use 12mm plywood for a wardrobe shutter?",
      answer:
        "Only for narrow shutters under about 400mm wide, and only laminated on both faces. Anything wider warps — 18mm is the correct shutter thickness.",
    },
    {
      question: "How much weight will a 12mm plywood shelf hold?",
      answer:
        "On a 600mm span with support at both ends, 12mm BWP handles ordinary storage loads without visible deflection. Load-bearing shelving, book storage or anything spanning further should move up to 18mm or structural grade.",
    },
  ],
  related: THICKNESS_RELATED,
});

const SIX_MM = thicknessPage({
  slug: "6mm-plywood-price",
  mm: 6,
  tolerance: 0,
  h1: "6mm Plywood Price in Hyderabad",
  metaDescription:
    "6mm plywood rates in Hyderabad by brand and grade. Compare per sq.ft and per sheet pricing for drawer bottoms, cabinet backs and panel infills, and quote your full material list.",
  intro: [
    "6mm is the back-panel and drawer-bottom sheet. Nobody plans a project around it, but on a full flat it runs to dozens of sheets, and using an MR sheet where a BWP one belonged is a cheap mistake that surfaces under a kitchen sink two years later.",
    "Every plywood brand here stocks 6mm, so the table is an exact-thickness list. Rates are per sq.ft excluding GST.",
    "Most products are quoted as one band rather than thickness by thickness, so the span shown is the product's overall band and not a 6mm figure. Ask for a confirmed 6mm rate against your sheet count.",
  ],
  tableNote: PLYWOOD_GST_NOTE,
  applications: [
    { heading: "Drawer bottoms", body: "6mm grooved into the drawer box is standard. Use BWP in kitchen and bathroom drawers regardless of what the carcass is." },
    { heading: "Cabinet backs", body: "6mm pinned to the back of a wall-fixed carcass. Move to 12mm where the cabinet is free-standing or the back takes a fixing." },
    { heading: "Panel infills and shutter inserts", body: "6mm behind a fluted or louvered face, and for infill panels inside a framed shutter." },
    { heading: "False ceiling and curved work", body: "6mm bends around a former for curved fascias and bulkheads where thicker sheets crack." },
  ],
  faqs: [
    {
      question: "What does 6mm plywood cost in Hyderabad?",
      answer:
        "Rates for every 6mm sheet we source are in the table above, per sq.ft excluding GST. A standard 8×4 ft sheet is 32 sq.ft, so multiply the rate by 32 for a per-sheet check figure.",
    },
    {
      question: "Is 6mm plywood strong enough for a cabinet back?",
      answer:
        "Yes, where the cabinet is fixed to a wall and the back is not carrying load. Free-standing units and anything where the back takes a screw fixing should use 12mm.",
    },
    {
      question: "Should drawer bottoms be MR or BWP?",
      answer:
        "BWP in kitchens, bathrooms and utility areas. The drawer bottom is often the first surface a leak reaches, and the sheet cost difference across a whole kitchen is small.",
    },
  ],
  related: THICKNESS_RELATED,
});

const MR_PLYWOOD: PricePageConfig = {
  slug: "mr-plywood-price",
  h1: "MR Plywood Price in Hyderabad",
  metaTitle: "MR Plywood Price in Hyderabad",
  metaDescription:
    "MR grade (IS 303) plywood rates in Hyderabad from Century, Green Panel, Mikasa, Wigwam Excel and EightByFour. Compare per sq.ft and per sheet, and see where MR is the wrong choice.",
  eyebrow: "Hyderabad price guide",
  intro: [
    "MR stands for moisture resistant, and the name oversells it. An IS 303 MR sheet handles humidity and the occasional splash; it is not built for standing water, and it will delaminate under a leaking sink trap given enough time.",
    "That said, MR is the correct grade for most of a flat. Wardrobes, bedroom storage, TV units and any joinery on a dry internal wall have no business carrying a BWP premium. The table below lists every MR sheet in the catalogue with its live rate and certification.",
    "Rates are per sq.ft excluding GST and are the band each product is quoted across, not a rate for one thickness.",
  ],
  selector: { dbCategories: ["Plywood"], grades: ["MR"] },
  layout: "table",
  tableNote: PLYWOOD_GST_NOTE,
  picks: [
    { label: "Lowest MR rate", criterion: { kind: "cheapest" }, note: "For concealed carcasses and back panels in dry areas." },
    { label: "Premium MR option", criterion: { kind: "dearest" }, note: "Where the sheet is calibrated and the edge quality matters for machine-cut joinery." },
  ],
  comparison: GRADE_COMPARISON,
  applications: [
    { heading: "Wardrobes", body: "The main use. MR at 18/19mm for the carcass and shutters, 12mm for internal shelving." },
    { heading: "TV units and bedroom storage", body: "MR throughout, unless the unit backs onto an external wall that takes monsoon driving rain." },
    { heading: "Where not to use MR", body: "Kitchen base units, bathroom vanities, utility and balcony joinery, and anything below counter level near a water point. Use IS 710 BWP instead." },
  ],
  crossSell: PLYWOOD_CROSS_SELL,
  related: [
    { label: "BWP plywood price", href: "/hyderabad/bwp-plywood-price" },
    { label: "Marine plywood price", href: "/hyderabad/marine-plywood-price" },
    { label: "Plywood price in Hyderabad", href: "/hyderabad/plywood-price" },
    { label: "18mm plywood price", href: "/hyderabad/18mm-plywood-price" },
    { label: "Plywood grades explained", href: "/guides/plywood-grades-explained" },
    { label: "Best plywood for kitchen", href: "/guides/best-plywood-for-kitchen" },
    { label: "Plywood supplier in Hyderabad", href: "/hyderabad/plywood-supplier" },
  ],
  faqs: [
    {
      question: "What is MR grade plywood?",
      answer:
        "MR is the moisture-resistant grade defined by IS 303. The veneers are bonded with a urea-formaldehyde adhesive that tolerates humidity and short-term damp but is not tested for boiling water, unlike IS 710 BWP.",
    },
    {
      question: "Is MR plywood waterproof?",
      answer:
        "No. It resists humidity, not immersion. For any surface that can meet standing water — kitchen base units, bathroom vanities, utility areas — IS 710 BWP is the correct grade.",
    },
    {
      question: "What is the price difference between MR and BWP plywood?",
      answer:
        "Compare the ranges on this page against the BWP price page. The gap is real but narrower than most site quotes suggest, and it applies only to the sheets that actually need the boil-proof bond.",
    },
    {
      question: "Is MR plywood suitable for a wardrobe in Hyderabad?",
      answer:
        "Yes, for a wardrobe on a dry internal wall — that is the standard specification across the city. Where the wardrobe backs onto an external or bathroom-adjacent wall, use BWP for the back panel at least.",
    },
  ],
};

const BWP_PLYWOOD: PricePageConfig = {
  slug: "bwp-plywood-price",
  h1: "BWP Plywood Price in Hyderabad",
  metaTitle: "BWP Plywood Price in Hyderabad",
  metaDescription:
    "BWP and BWR grade plywood rates in Hyderabad — Century, Austin, Green Panel and Wigwam Excel, with IS 710 certification shown per product. Compare per sq.ft and per sheet.",
  eyebrow: "Hyderabad price guide",
  intro: [
    "BWP means boiling water proof, and unlike MR the name is earned: an IS 710 sheet is tested by boiling the bonded panel for 72 hours. That test, and the phenolic adhesive behind it, is what you are paying the premium for.",
    "BWR is the grade between the two — longer boil resistance than MR, still an IS 303 interior bond. Several ranges sold as 710 in the market are certified BWR rather than BWP, so the certification column below matters more than the product name.",
    "Rates are per sq.ft excluding GST and are the band each product is quoted across, not a rate for one thickness.",
  ],
  selector: { dbCategories: ["Plywood", "Boil Boards"], grades: ["BWP", "BWR"] },
  layout: "table",
  tableNote:
    "Read the certification column, not the range name. IS 710 is the boil-proof standard; IS 303 (BWR) is a different, lower test. Rates are per sq.ft excluding GST and are the band each board is quoted across.",
  picks: [
    { label: "Lowest BWP rate", criterion: { kind: "cheapest" }, note: "Entry point for kitchen carcasses where the budget is fixed." },
    { label: "Cheapest genuine IS 710 sheet", criterion: { kind: "cheapestWithCertification", pattern: "710" }, note: "Certified to the boil test rather than to the interior-grade IS 303 standard." },
    { label: "Premium BWP option", criterion: { kind: "dearest" }, note: "Longest warranty cover, for work being handed over under a contract." },
  ],
  comparison: GRADE_COMPARISON,
  applications: [
    { heading: "Kitchen base units", body: "The core use. BWP carcass, BWP shutters, BWP drawer bottoms — everything below counter level." },
    { heading: "Bathroom vanities", body: "BWP throughout, including the back panel. This is where MR fails first and most visibly." },
    { heading: "Utility and balcony joinery", body: "BWP for washing-machine surrounds, utility storage and anything on a covered balcony." },
    { heading: "Where BWP is overspecified", body: "Wardrobe interiors, TV units and bedroom storage on dry internal walls. MR grade there frees budget for the wet areas." },
  ],
  crossSell: PLYWOOD_CROSS_SELL,
  related: [
    { label: "MR plywood price", href: "/hyderabad/mr-plywood-price" },
    { label: "Marine plywood price", href: "/hyderabad/marine-plywood-price" },
    { label: "Plywood price in Hyderabad", href: "/hyderabad/plywood-price" },
    { label: "18mm plywood price", href: "/hyderabad/18mm-plywood-price" },
    { label: "Century plywood price", href: "/hyderabad/century-plywood-price" },
    { label: "Plywood grades explained", href: "/guides/plywood-grades-explained" },
    { label: "HDHMR for bathroom and kitchen", href: "/guides/hdhmr-for-bathroom-kitchen" },
  ],
  faqs: [
    {
      question: "What is BWP plywood?",
      answer:
        "BWP is boiling-water-proof plywood, certified under IS 710. The panel is bonded with a phenol-formaldehyde resin and tested by boiling for 72 hours, which is why it holds up in kitchens, bathrooms and monsoon-exposed joinery.",
    },
    {
      question: "What is the difference between BWR and BWP plywood?",
      answer:
        "BWR is a boiling-water-resistant grade under IS 303 — better than MR, but a different and lower test than IS 710. BWP is the boil-proof grade. Several ranges marketed as 710 carry BWR certification, so check the IS number on the product rather than the range name.",
    },
    {
      question: "Is BWP the same as marine plywood?",
      answer:
        "Not exactly. Marine plywood under IS 710 or BS 1088 is a stricter specification covering veneer quality and permissible defects as well as the bond. All marine ply is boil-proof; not all BWP is marine grade.",
    },
    {
      question: "What does BWP plywood cost per sheet in Hyderabad?",
      answer:
        "Multiply the per sq.ft rate in the table by 32 for a standard 8×4 ft sheet — the per-sheet column does that arithmetic. Confirmed pricing depends on current stock and order volume.",
    },
  ],
};

const MARINE_PLYWOOD: PricePageConfig = {
  slug: "marine-plywood-price",
  h1: "Marine Plywood Price in Hyderabad",
  metaTitle: "Marine Plywood Price in Hyderabad",
  metaDescription:
    "Marine grade plywood rates in Hyderabad — IS 710 and BS 1088 certified sheets from Austin, Century and Green Panel. See certification per product and compare per sq.ft and per sheet.",
  eyebrow: "Hyderabad price guide",
  intro: [
    "Marine plywood is the top of the boil-proof range: an IS 710 or BS 1088 panel where the veneer quality and permissible defects are specified as tightly as the adhesive. In a Hyderabad flat it earns its price in exactly three places — under the sink, in the bathroom vanity, and on anything that sees weather.",
    "The table below lists only sheets carrying a marine or IS 710 certification in our catalogue, with the standard each one is certified against shown per product. BS 1088 is the stricter of the two.",
    "Rates are per sq.ft excluding GST and are the band each product is quoted across, not a rate for one thickness.",
  ],
  selector: { dbCategories: ["Plywood", "Boil Boards"], certificationPattern: "marine|710|1088" },
  layout: "table",
  tableNote:
    "Certification is shown per product — IS 710 is the Indian boil-proof marine standard, BS 1088 the stricter British specification. Rates are per sq.ft excluding GST and are the band each board is quoted across.",
  picks: [
    { label: "Lowest marine-grade rate", criterion: { kind: "cheapest" }, note: "Entry point where the specification calls for IS 710 and the budget is fixed." },
    { label: "BS 1088 certified option", criterion: { kind: "cheapestWithCertification", pattern: "1088" }, note: "The stricter British marine specification, for boat work and genuinely weather-exposed joinery." },
    { label: "Premium marine option", criterion: { kind: "dearest" }, note: "Longest warranty cover in the marine range." },
  ],
  comparison: GRADE_COMPARISON,
  applications: [
    { heading: "Kitchen sink base", body: "The one cabinet in a flat that is worth marine grade on its own. Carcass, base and back panel." },
    { heading: "Bathroom vanity", body: "Full marine specification including drawer boxes. Everything else in the bathroom is replaceable; the vanity is not." },
    { heading: "Balcony and terrace joinery", body: "Covered balconies in Hyderabad still take monsoon driving rain. Marine grade or nothing." },
    { heading: "Where marine is overspecified", body: "Wardrobes, TV units, office storage and dry-area shelving. Use MR or standard BWP and put the saving into the wet areas." },
  ],
  crossSell: PLYWOOD_CROSS_SELL,
  related: [
    { label: "BWP plywood price", href: "/hyderabad/bwp-plywood-price" },
    { label: "MR plywood price", href: "/hyderabad/mr-plywood-price" },
    { label: "Plywood price in Hyderabad", href: "/hyderabad/plywood-price" },
    { label: "Best plywood for kitchen", href: "/guides/best-plywood-for-kitchen" },
    { label: "Plywood grades explained", href: "/guides/plywood-grades-explained" },
    { label: "Plywood supplier in Hyderabad", href: "/hyderabad/plywood-supplier" },
  ],
  faqs: [
    {
      question: "What is marine plywood?",
      answer:
        "Marine plywood is a boil-proof panel certified under IS 710 or BS 1088, where the specification covers veneer quality, core gaps and permissible defects in addition to the phenolic bond. It is the grade specified for sustained water exposure.",
    },
    {
      question: "Is marine plywood worth the extra cost in a kitchen?",
      answer:
        "For the sink base and the bathroom vanity, yes. For the rest of a kitchen, standard IS 710 BWP does the same job. Spending the marine premium across an entire flat is the most common overspecification we see on Hyderabad BOQs.",
    },
    {
      question: "How can I check a sheet is genuinely marine grade?",
      answer:
        "Ask for the IS 710 or BS 1088 marking and the manufacturer's test certificate for the batch. The certification column in the table above shows what each product in our catalogue is certified against.",
    },
  ],
};

// --- Brand plywood pages ----------------------------------------------------

const CENTURY_PLYWOOD: PricePageConfig = {
  slug: "century-plywood-price",
  brandSlugs: ["century"],
  h1: "Century Plywood Price in Hyderabad",
  metaTitle: "Century Plywood Price in Hyderabad",
  metaDescription:
    "Century plywood rates in Hyderabad — Sainik MR, Sainik 710, Club Prime, Bond Shield and Architect Ply, with grade, IS certification and warranty per product. Compare and request a quote.",
  eyebrow: "Hyderabad price guide",
  intro: [
    "Century's plywood range splits cleanly by grade rather than by badge: Sainik MR at the entry point, Sainik 710 as the BWR step up, Club Prime for genuine IS 710 boil-proof work, and Bond Shield and Architect Ply for fire-retardant fit-outs. Every one of them is a different price band, which is why a single Century rate quoted on the phone is meaningless.",
    "The table below carries the live rate span, IS certification and warranty for each range EightByFour sources. One point worth reading closely: Sainik 710 is certified IS 303 BWR, not IS 710 — the range name and the standard are not the same thing.",
    "Rates are per sq.ft excluding GST and are the band each range is quoted across, covering stocked thicknesses from 4mm to 25mm.",
  ],
  selector: { dbCategories: ["Plywood", "Boil Boards"], brands: ["Century"] },
  layout: "table",
  tableNote: PLYWOOD_GST_NOTE,
  picks: [
    { label: "Entry point", criterion: { kind: "cheapest" }, note: "Wardrobes, bedroom storage and dry-area joinery where the boil-proof bond is not doing any work." },
    { label: "Cheapest IS 710 in the range", criterion: { kind: "cheapestWithCertification", pattern: "710" }, note: "Kitchen base units and bathroom vanities — the genuine boil test rather than the interior-grade one." },
    { label: "Fire-retardant option", criterion: { kind: "cheapestWithGrade", grades: ["FR"] }, note: "Offices, hotels and retail where the tender specifies IS 5509." },
    { label: "Top of the range", criterion: { kind: "dearest" }, note: "Specification-led work with the longest warranty cover Century offers." },
  ],
  comparison: {
    heading: "Which Century range for which job",
    intro: "Century's range names do not map onto IS grades in the order most people assume. Read the certification column, not the name.",
    columns: ["Range", "Certified as", "Warranty", "Where it belongs"],
    rows: [
      ["Sainik MR", "IS 303 (MR)", "5 years", "Wardrobes, bedroom units, dry-area storage"],
      ["Sainik 710", "IS 303 (BWR)", "10 years", "Kitchen wall units, utility cupboards — despite the 710 in the name, this is the BWR grade"],
      ["Club Prime", "IS 710 (BWP marine)", "30 years", "Kitchen base units, bathroom vanities, balcony joinery"],
      ["Bond Shield", "IS 5509 (fire retardant)", "21 years", "Commercial fit-outs with a fire clause"],
      ["Architect Ply", "IS 5509 (fire retardant)", "Lifetime", "Specification-led hospitality and office work"],
    ],
    footnote: "Certifications and warranty terms above are read live from each product record and change when the manufacturer changes them.",
  },
  applications: [
    { heading: "Modular kitchen", body: "Club Prime below the counter, Sainik 710 for wall units away from the sink." },
    { heading: "Wardrobes", body: "Sainik MR for the carcass and shutters on a dry internal wall — the standard Hyderabad specification." },
    { heading: "Office fit-out", body: "Bond Shield or Architect Ply where the tender carries an IS 5509 clause." },
    { heading: "Bathroom vanity", body: "Club Prime only. This is the one place where Sainik 710's BWR bond is not enough." },
  ],
  crossSell: PLYWOOD_CROSS_SELL,
  related: [
    { label: "Century brand page", href: "/brands/century" },
    { label: "Greenply plywood price", href: "/hyderabad/greenply-plywood-price" },
    { label: "Plywood price in Hyderabad", href: "/hyderabad/plywood-price" },
    { label: "BWP plywood price", href: "/hyderabad/bwp-plywood-price" },
    { label: "MR plywood price", href: "/hyderabad/mr-plywood-price" },
    { label: "Plywood grades explained", href: "/guides/plywood-grades-explained" },
    { label: "Plywood supplier in Hyderabad", href: "/hyderabad/plywood-supplier" },
  ],
  faqs: [
    {
      question: "What is the price of Century plywood in Hyderabad?",
      answer:
        "It varies by range and thickness — the table on this page shows the live span for each Century range we source, per sq.ft excluding GST. Request a confirmed rate for the specific range, thickness and sheet count you need.",
    },
    {
      question: "Is Century Sainik 710 a BWP grade plywood?",
      answer:
        "Our product record certifies Sainik 710 as IS 303 BWR, not IS 710 BWP. It is a step above MR in boil resistance but it is not the boil-proof grade. For kitchen base units and bathroom vanities, Club Prime carries the IS 710 certification.",
    },
    {
      question: "Is EightByFour an authorised Century dealer?",
      answer:
        "We are a supplier, not an authorised dealer or distributor. Century products are sourced through our supply network and quoted with the manufacturer's own certification and warranty.",
    },
    {
      question: "Can I mix Century and other brands in one order?",
      answer:
        "Yes. A single quotation can span Century plywood, another brand's laminate and a third manufacturer's hardware — that is the point of sending the whole list rather than one item.",
    },
  ],
};

const GREENPLY_PLYWOOD: PricePageConfig = {
  slug: "greenply-plywood-price",
  brandSlugs: ["greenply"],
  h1: "Greenply Plywood Price in Hyderabad",
  metaTitle: "Greenply Plywood Price in Hyderabad",
  metaDescription:
    "Greenply plywood in Hyderabad — Green Gold, Green Club, Green Platinum, Optima G 710 and Green BWP 710, with IS 710 certification and thickness range per product. Request current rates.",
  eyebrow: "Hyderabad price guide",
  intro: [
    "Greenply's Hyderabad range sits almost entirely in IS 710 territory — Green Gold, Green Club, Green Platinum, Optima G 710 and Green BWP 710 are all certified boil-proof, and the difference between them is veneer quality, core composition and warranty rather than grade.",
    "Greenply rates are quoted on request rather than published here. Every other specification — certification, thickness range, sheet size — is live in the table below, and a confirmed rate comes back the same day against your sheet count.",
    "If you are comparing Greenply against a brand whose rates are published, the plywood price page lists every priced sheet in the catalogue side by side.",
  ],
  selector: { dbCategories: ["Plywood"], brands: ["Greenply"] },
  layout: "table",
  tableNote:
    "Greenply rates are not published on this page — they are quoted against the specific range, thickness and volume. Everything else shown is read live from the product record.",
  comparison: GRADE_COMPARISON,
  applications: [
    { heading: "Modular kitchen", body: "Any of the IS 710 ranges works below the counter; the choice comes down to warranty and budget rather than grade." },
    { heading: "Wardrobes", body: "A 710 sheet is overspecified for a dry-wall wardrobe. Compare against MR-grade options before committing the budget." },
    { heading: "Bathroom vanity", body: "IS 710 throughout, including the back panel and drawer boxes." },
    { heading: "Comparing brands", body: "Put a Greenply range next to a priced IS 710 sheet from another brand on the plywood price page before deciding." },
  ],
  crossSell: PLYWOOD_CROSS_SELL,
  related: [
    { label: "Greenply brand page", href: "/brands/greenply" },
    { label: "Century plywood price", href: "/hyderabad/century-plywood-price" },
    { label: "Plywood price in Hyderabad", href: "/hyderabad/plywood-price" },
    { label: "BWP plywood price", href: "/hyderabad/bwp-plywood-price" },
    { label: "Marine plywood price", href: "/hyderabad/marine-plywood-price" },
    { label: "Plywood supplier in Hyderabad", href: "/hyderabad/plywood-supplier" },
    { label: "Plywood grades explained", href: "/guides/plywood-grades-explained" },
  ],
  faqs: [
    {
      question: "What is the price of Greenply plywood in Hyderabad?",
      answer:
        "Greenply rates are quoted per requirement rather than published on this page. Send the range, thickness and sheet count and a confirmed rate comes back the same day.",
    },
    {
      question: "What is the difference between Green Gold and Green Club?",
      answer:
        "Both are certified IS 710 boil-proof. The difference is in veneer quality, core composition and warranty cover rather than in grade — which is why the certification column alone will not separate them.",
    },
    {
      question: "Is EightByFour an authorised Greenply dealer?",
      answer:
        "We are a supplier, not an authorised dealer or distributor. Greenply products are sourced through our supply network and quoted with the manufacturer's own certification.",
    },
  ],
};

// --- Board pages ------------------------------------------------------------

const BOARD_CROSS_SELL = [
  { label: "Laminates", href: "/products/laminates", note: "The surface layer these boards are almost always specified with." },
  { label: "Plywood", href: "/products/plywood", note: "Where the carcass needs to hold a screw rather than sit flat." },
  { label: "Adhesive", href: "/products/adhesive", note: "Fevicol pack sizes matched to board area." },
  { label: "Veneers", href: "/products/veneers", note: "Natural and engineered veneer where a printed grain will not do." },
];

const HDHMR_BOARD: PricePageConfig = {
  slug: "hdhmr-board-price",
  h1: "HDHMR Board Price in Hyderabad",
  metaTitle: "HDHMR Board Price in Hyderabad",
  metaDescription:
    "HDHMR and high-density board rates in Hyderabad from Century and Green Panel, with density grade, IS certification and thickness range per product. Compare per sq.ft and quote your list.",
  eyebrow: "Hyderabad price guide",
  intro: [
    "HDHMR is the board contractors reach for when a flat, machinable surface matters more than screw-holding — shutters, louvered fronts, CNC-routed panels, wardrobe faces that must not telegraph a core joint. It is denser than MDF and treated for moisture, which is where the price sits relative to both MDF and plywood.",
    "The table below covers every high-density board in the catalogue with its grade, certification and thickness range. Note that these boards run to far more thicknesses than plywood does — 3mm through 30mm — which is why the rate span is wide.",
    "Rates are per sq.ft excluding GST and are the band each board is quoted across.",
  ],
  selector: { dbCategories: ["MDF and HDHMR", "Boil Boards"], namePattern: "hdhmr|hdf|hdwr|high density|premium plus|boilblack" },
  layout: "table",
  tableNote:
    "Rates above are per sq.ft excluding GST and are the band each board is quoted across, not a rate for any one thickness. These boards run from 3mm to 30mm, which is why the bands are wide — ask for a confirmed rate at the thickness you need.",
  picks: [
    { label: "Lowest HDHMR rate", criterion: { kind: "cheapest" }, note: "Where the board is being laminated on both faces and the substrate is never seen." },
    { label: "Water-resistant grade", criterion: { kind: "cheapestWithCertification", pattern: "HMR|BWP|water" }, note: "Kitchen shutters and vanity fronts, where the board sees splash rather than standing water." },
    { label: "Top of the range", criterion: { kind: "dearest" }, note: "Routed and profiled work where the machined edge is part of the finish." },
  ],
  comparison: {
    heading: "HDHMR vs MDF vs plywood",
    intro: "These three get quoted against each other constantly, and they are good at different things. Density is not the same as strength.",
    columns: ["Board", "Screw holding", "Moisture behaviour", "Machining and edge", "Typical use"],
    rows: [
      ["Plywood", "Best — cross-laminated veneers grip a screw", "Depends entirely on grade (MR to IS 710)", "Edge shows the core; needs banding", "Carcasses, structural shelving, anything carrying hardware"],
      ["HDHMR", "Good, better than MDF, below plywood", "Treated for moisture; still a fibre board", "Machines cleanly; routed profiles hold", "Shutters, louvered and routed fronts, CNC panels"],
      ["MDF", "Weakest of the three at the edge", "Interior grade unless specified MR", "Cleanest machined surface", "Painted panels, wall panelling, non-load furniture"],
    ],
    footnote: "None of the three is a substitute for the others across a whole project. A typical Hyderabad kitchen uses plywood carcasses with HDHMR or MDF shutters.",
  },
  applications: [
    { heading: "Kitchen and wardrobe shutters", body: "The main use. HDHMR stays flat across a tall shutter where plywood can bow, and it takes a laminate or acrylic face without telegraphing." },
    { heading: "Louvered and fluted panels", body: "Routed profiles hold their edge in HDHMR. Plywood chips along the veneer lines and MDF crumbles at a fine profile." },
    { heading: "CNC and profile work", body: "Any design that goes through a router — grooved fronts, cut-outs, curved fascias." },
    { heading: "Where not to use it", body: "Carcass sides carrying hinge and channel screws, and anything below a sink. Use plywood there." },
  ],
  crossSell: BOARD_CROSS_SELL,
  related: [
    { label: "MDF board price", href: "/hyderabad/mdf-board-price" },
    { label: "MDF vs HDHMR", href: "/guides/mdf-vs-hdhmr" },
    { label: "HDHMR for bathroom and kitchen", href: "/guides/hdhmr-for-bathroom-kitchen" },
    { label: "Plywood price in Hyderabad", href: "/hyderabad/plywood-price" },
    { label: "MDF and HDHMR catalogue", href: "/products/mdf-and-hdhmr" },
    { label: "BOQ procurement", href: "/hyderabad/boq-procurement" },
  ],
  faqs: [
    {
      question: "What is HDHMR board?",
      answer:
        "HDHMR stands for high density high moisture resistance — a fibre board pressed to a higher density than MDF and treated for moisture. It machines cleanly and stays flat, which is why it is specified for shutters and routed panels.",
    },
    {
      question: "Is HDHMR better than plywood?",
      answer:
        "For shutters, routed fronts and anything where flatness and a clean machined edge matter, yes. For carcasses and anything holding hinges, channels or load, plywood is better because the cross-laminated veneers grip a screw in a way a fibre board cannot.",
    },
    {
      question: "Can HDHMR be used in a bathroom?",
      answer:
        "For vanity shutters and fronts that see splash, yes. For the vanity carcass itself, or anything sitting in standing water, use IS 710 BWP plywood.",
    },
    {
      question: "What does HDHMR cost per sheet in Hyderabad?",
      answer:
        "Multiply the per sq.ft rate in the table by 32 for a standard 8×4 ft sheet — the per-sheet column does that. Confirmed rates depend on thickness and volume.",
    },
  ],
};

const MDF_BOARD: PricePageConfig = {
  slug: "mdf-board-price",
  h1: "MDF Board Price in Hyderabad",
  metaTitle: "MDF Board Price in Hyderabad",
  metaDescription:
    "MDF board rates in Hyderabad by grade — interior REG and exterior MR, with IS 12406 certification and thickness range per product. Compare per sq.ft and quote the whole list.",
  eyebrow: "Hyderabad price guide",
  intro: [
    "MDF is the cheapest flat panel that takes a paint finish properly, which is why it dominates wall panelling, painted shutters and display joinery. It is also the board most often misused — an interior-grade REG sheet put somewhere it meets water will swell and never recover.",
    "The grade split is the thing to get right. IS 12406 REG is the interior grade; MR is the exterior/moisture-resistant grade and costs meaningfully more. Both are in the table below with their certification and full thickness range.",
    "Rates are per sq.ft excluding GST and are the band each board is quoted across; MDF here runs from under 2mm to 30mm, which is why the bands are wide.",
  ],
  selector: { dbCategories: ["MDF and HDHMR"], namePattern: "mdf" },
  layout: "table",
  tableNote:
    "Rates above are per sq.ft excluding GST and are the band each board is quoted across, not a rate for any one thickness. MDF is stocked in far more thicknesses than plywood, which is why the bands are wide.",
  picks: [
    { label: "Lowest MDF rate", criterion: { kind: "cheapest" }, note: "Interior panelling, painted shutters and display work in dry areas." },
    { label: "Moisture-resistant grade", criterion: { kind: "cheapestWithGrade", grades: ["MR"] }, note: "Anywhere the panel might meet humidity — the grade step that stops a swollen edge two monsoons in." },
  ],
  comparison: {
    heading: "MDF grades under IS 12406",
    intro: "The grade is printed on the board and it is the only thing that tells you where the sheet can go.",
    columns: ["Grade", "Standard", "Behaviour", "Where it belongs"],
    rows: [
      ["REG", "IS 12406 (REG)", "Interior grade; swells permanently once wet", "Wall panelling, painted shutters, display units, dry-area furniture"],
      ["MR", "IS 12406 (MR)", "Moisture resistant; handles humidity and splash", "Kitchen and utility panelling, humid rooms, exterior-facing interior work"],
      ["HMR-GP", "IS 12406 (HMR-GP)", "High density plus moisture resistance", "Shutters and routed fronts — see the HDHMR page"],
    ],
    footnote: "None of these grades is waterproof. For anything that meets standing water, the correct material is IS 710 BWP plywood, not a fibre board.",
  },
  applications: [
    { heading: "Wall panelling", body: "The main use. REG grade takes a primer and paint finish better than any plywood." },
    { heading: "Painted shutters", body: "MDF holds a sprayed finish flat and seamless. Use MR grade in kitchens." },
    { heading: "Display and retail joinery", body: "REG grade for anything indoors and dry, where the panel is finished rather than structural." },
    { heading: "Where not to use MDF", body: "Carcass sides carrying hinges, shelving under load, and anything near water. The edge is the weak point in all three cases." },
  ],
  crossSell: BOARD_CROSS_SELL,
  related: [
    { label: "HDHMR board price", href: "/hyderabad/hdhmr-board-price" },
    { label: "MDF vs HDHMR", href: "/guides/mdf-vs-hdhmr" },
    { label: "Plywood price in Hyderabad", href: "/hyderabad/plywood-price" },
    { label: "MDF and HDHMR catalogue", href: "/products/mdf-and-hdhmr" },
    { label: "Laminate price in Hyderabad", href: "/hyderabad/laminate-price" },
    { label: "BOQ procurement", href: "/hyderabad/boq-procurement" },
  ],
  faqs: [
    {
      question: "What is the price of MDF board in Hyderabad?",
      answer:
        "The table above lists live rates per sq.ft excluding GST for each MDF grade we source. Multiply by 32 for a standard 8×4 ft sheet.",
    },
    {
      question: "What is the difference between REG and MR grade MDF?",
      answer:
        "REG is the interior grade under IS 12406 and swells permanently once it gets wet. MR is the moisture-resistant grade — it costs more and belongs anywhere the panel might meet humidity or splash.",
    },
    {
      question: "Is MDF cheaper than plywood?",
      answer:
        "Per square foot, generally yes at comparable thickness. Whether it is cheaper on the job depends on the application — MDF that fails at a screw fixing or a wet edge is not a saving.",
    },
  ],
};

// --- Laminate pages ---------------------------------------------------------
//
// Laminates use the "ranges" layout, not the per-SKU table. A single rate
// covers an entire collection — Merino's 488 shades share one sheet price —
// so a shade-by-shade table would be 700 rows repeating the same number.
// Grouping by brand and collection answers the actual question ("what do
// these cost, and what ranges are there") in a screen rather than a scroll.

const LAMINATE_CROSS_SELL = [
  { label: "Plywood", href: "/products/plywood", note: "The substrate under every laminated surface — quote both together." },
  { label: "Adhesive", href: "/products/adhesive", note: "Fevicol SH, Marine and Hiper, sized to the sheet count." },
  { label: "MDF and HDHMR", href: "/products/mdf-and-hdhmr", note: "Flatter substrate for shutters and routed fronts." },
  { label: "Veneers", href: "/products/veneers", note: "Where the grain has to be real wood rather than printed." },
];

const LAMINATE_THICKNESS_COMPARISON: ComparisonBlock = {
  heading: "0.8mm vs 1mm vs 1.5mm laminate",
  intro:
    "Thickness is the first thing that moves a laminate quote, and the three bands are not interchangeable. The thin grades exist for a reason, but not the reason most quotes imply.",
  columns: ["Thickness", "Trade name", "Where it belongs", "What it cannot do"],
  rows: [
    ["0.7 – 0.8mm", "Liner / backing grade", "Internal faces of shutters, carcass interiors, the back of a laminated panel", "Not a wearing surface — it will show the substrate through it on a visible face"],
    ["1mm", "Standard grade", "Almost everything: shutters, shelves, wardrobe faces, wall panels", "Not rated for a heavy-use horizontal like a working countertop"],
    ["1.5mm+", "Countertop / heavy duty", "Kitchen countertops, reception desks, table tops, commercial horizontals", "Costs meaningfully more; wasted on a vertical face"],
  ],
  footnote:
    "Laminating a shutter on one face only will bow it. Whatever grade goes on the visible face, a balancing liner goes on the back — that is what the 0.8mm grade is for.",
};

function laminateBrandPage(opts: {
  slug: string;
  brand: string;
  /** Brand-page slug — not always the same string as the catalogue brand name. */
  brandSlug: string;
  h1: string;
  metaDescription: string;
  intro: string[];
  tableNote: string;
  faqs: { question: string; answer: string }[];
  related: { label: string; href: string }[];
  applications?: { heading: string; body: string }[];
}): PricePageConfig {
  return {
    slug: opts.slug,
    h1: opts.h1,
    metaTitle: opts.h1,
    metaDescription: opts.metaDescription,
    eyebrow: "Hyderabad price guide",
    intro: opts.intro,
    selector: { dbCategories: ["Laminates"], brands: [opts.brand] },
    layout: "ranges",
    brandSlugs: [opts.brandSlug],
    tableNote: opts.tableNote,
    comparison: LAMINATE_THICKNESS_COMPARISON,
    applications: opts.applications,
    crossSell: LAMINATE_CROSS_SELL,
    related: opts.related,
    faqs: opts.faqs,
  };
}

const LAMINATE_RELATED = [
  { label: "Laminate price in Hyderabad", href: "/hyderabad/laminate-price" },
  { label: "1mm laminate price", href: "/hyderabad/1mm-laminate-price" },
  { label: "Greenlam laminate price", href: "/hyderabad/greenlam-laminate-price" },
  { label: "Merino laminate price", href: "/hyderabad/merino-laminate-price" },
  { label: "Virgo laminate price", href: "/hyderabad/virgo-laminate-price" },
  { label: "Laminates supplier in Hyderabad", href: "/hyderabad/laminates-supplier" },
  { label: "Laminate vs veneer", href: "/comparisons/laminate-vs-veneer" },
  { label: "Laminate care and maintenance", href: "/guides/laminate-care-and-maintenance" },
  { label: "BOQ procurement", href: "/hyderabad/boq-procurement" },
];

const LAMINATE_APPLICATIONS = [
  { heading: "Kitchen shutters", body: "1mm on the visible face, a liner grade on the back to balance it. Matt and suede finishes hide fingerprints in a way high gloss does not." },
  { heading: "Countertops", body: "1.5mm or a dedicated countertop grade. A 1mm sheet on a working horizontal wears through at the sink edge first." },
  { heading: "Wardrobe faces", body: "1mm throughout. This is where the shade catalogue actually matters — and where a discontinued shade halfway through a project hurts most, so confirm availability across the whole quantity up front." },
  { heading: "Wall panelling and commercial", body: "1mm, with fire and chemical-resistance grades where the fit-out specification calls for them." },
];

const LAMINATE_PRICE: PricePageConfig = {
  slug: "laminate-price",
  h1: "Laminate Price in Hyderabad",
  metaTitle: "Laminate Price in Hyderabad",
  metaDescription:
    "Laminate sheet rates in Hyderabad across Merino, Virgo, Greenlam, Century and acrylic ranges — by brand, collection and thickness. Compare rates and quote your full shade list.",
  eyebrow: "Hyderabad price guide",
  intro: [
    "Laminate is quoted by the sheet, not by the square foot, and the sheet is 8×4 ft almost everywhere. That makes it the easiest material on a BOQ to compare — provided you are comparing the same thickness and the same grade, which most quotes are not.",
    "The table below groups the catalogue by brand and collection, because within a collection the rate is usually one number across every shade in it. A Merino collection with 400 shades has one sheet price; what changes between shades is availability, not cost.",
    "Where a manufacturer's rates are not loaded yet the row says so rather than showing an estimate. Rates exclude GST.",
  ],
  selector: { dbCategories: ["Laminates"] },
  layout: "ranges",
  tableNote:
    "Rates above are per 8×4 ft sheet excluding GST. Within a collection the rate is generally uniform across shades — what varies between shades is stock, not price. Click a range to see every shade in it.",
  comparison: LAMINATE_THICKNESS_COMPARISON,
  applications: LAMINATE_APPLICATIONS,
  crossSell: LAMINATE_CROSS_SELL,
  related: [
    { label: "1mm laminate price", href: "/hyderabad/1mm-laminate-price" },
    { label: "Greenlam laminate price", href: "/hyderabad/greenlam-laminate-price" },
    { label: "Merino laminate price", href: "/hyderabad/merino-laminate-price" },
    { label: "Virgo laminate price", href: "/hyderabad/virgo-laminate-price" },
    { label: "Laminates supplier in Hyderabad", href: "/hyderabad/laminates-supplier" },
    { label: "Acrylic laminates supplier", href: "/hyderabad/acrylic-laminates-supplier" },
    { label: "Laminate vs veneer", href: "/comparisons/laminate-vs-veneer" },
    { label: "Laminate care and maintenance", href: "/guides/laminate-care-and-maintenance" },
    { label: "Plywood price in Hyderabad", href: "/hyderabad/plywood-price" },
    { label: "BOQ procurement", href: "/hyderabad/boq-procurement" },
  ],
  faqs: [
    {
      question: "What is the price of a laminate sheet in Hyderabad?",
      answer:
        "It depends on brand, collection and thickness. The table on this page shows the live rate for each range we source, per 8×4 ft sheet excluding GST, along with how many shades sit behind each rate.",
    },
    {
      question: "Why do all the shades in one collection cost the same?",
      answer:
        "Because manufacturers price laminate by grade and finish family, not by colour. A collection with four hundred shades typically has one sheet rate; the differences between shades are availability and lead time.",
    },
    {
      question: "How many laminate sheets do I need?",
      answer:
        "Count the visible faces, add a balancing liner sheet for every laminated shutter, and add roughly 10% for cutting waste and matching. Send the elevations and we will size the list against the actual design.",
    },
    {
      question: "Do you supply acrylic and ASA laminates as well?",
      answer:
        "Yes — acrylic sheets in gloss and matt, and ASA. They are priced separately from standard HPL and appear as their own ranges in the table above.",
    },
    {
      question: "Can I order laminate and plywood together?",
      answer:
        "Yes, and it is worth doing. Sheets and substrate quoted together means one delivery to site and one document to reconcile rather than two.",
    },
  ],
};

const ONE_MM_LAMINATE: PricePageConfig = {
  slug: "1mm-laminate-price",
  h1: "1mm Laminate Price in Hyderabad",
  metaTitle: "1mm Laminate Price in Hyderabad",
  metaDescription:
    "1mm laminate sheet rates in Hyderabad across Merino, Virgo, Greenlam and Century ranges. See which collections stock 1mm, compare per-sheet rates and quote your shade list.",
  eyebrow: "Hyderabad price guide",
  intro: [
    "1mm is the standard grade — the sheet that goes on wardrobe faces, kitchen shutters, shelving and wall panels. Unless the surface is a working countertop or a hidden internal face, this is the thickness the quote should be for.",
    "The table below lists every range stocked at 1mm, grouped by brand and collection, with the live per-sheet rate. Thinner liner grades and thicker countertop grades are excluded here — they are on the main laminate price page.",
    "Rates are per 8×4 ft sheet excluding GST.",
  ],
  selector: { dbCategories: ["Laminates"], thicknessMm: 1, thicknessTolerance: 0 },
  layout: "ranges",
  tableNote:
    "Only ranges stocked at 1mm appear above. Rates are per 8×4 ft sheet excluding GST and are generally uniform across every shade in a collection.",
  comparison: LAMINATE_THICKNESS_COMPARISON,
  applications: LAMINATE_APPLICATIONS,
  crossSell: LAMINATE_CROSS_SELL,
  related: LAMINATE_RELATED,
  faqs: [
    {
      question: "Is 1mm laminate thick enough for kitchen shutters?",
      answer:
        "Yes. 1mm is the standard grade for vertical surfaces including kitchen and wardrobe shutters. Countertops and heavy-use horizontals are where a thicker grade earns its cost.",
    },
    {
      question: "What is the price of 1mm laminate in Hyderabad?",
      answer:
        "The table above shows the live per-sheet rate for every 1mm range we source, excluding GST. Rates vary by brand and collection rather than by shade.",
    },
    {
      question: "Do I need a backing laminate as well?",
      answer:
        "On any shutter, yes. Laminating one face only puts the panel under uneven tension and it will bow. A thin liner grade on the back costs a fraction of the face sheet and prevents it.",
    },
    {
      question: "What is the difference between 0.8mm and 1mm laminate?",
      answer:
        "0.7–0.8mm is a liner or backing grade meant for internal faces and balancing. 1mm is the wearing grade for visible surfaces. Using a liner grade on a visible face shows the substrate through it.",
    },
  ],
};

const GREENLAM_LAMINATE = laminateBrandPage({
  slug: "greenlam-laminate-price",
  brand: "Greenlam",
  brandSlug: "greenlam",
  h1: "Greenlam Laminate Price in Hyderabad",
  metaDescription:
    "Greenlam laminate ranges in Hyderabad — HPL, VRB, Lexus, HD Gloss, Countertop, Unicore and door grades, with thickness and shade counts per collection. Request current rates.",
  intro: [
    "Greenlam's catalogue is the broadest of any laminate brand we stock, and the collections do genuinely different jobs: HPL and VRB for general surfacing, Unicore where a cut edge must not show a dark line, Lab Guardian for chemical resistance, Countertop and Infinia for horizontals, and dedicated door grades.",
    "Greenlam rates are quoted on request rather than published here. The table below shows every collection with its thickness, sheet size and how many shades sit behind it, so you can narrow the specification before asking for a number.",
    "For a like-for-like comparison against brands whose rates are published, see the laminate price page.",
  ],
  tableNote:
    "Greenlam rates are quoted against the specific collection, finish and volume rather than published on this page. Shade counts, thickness and sheet size are read live from the catalogue.",
  applications: [
    { heading: "Kitchen and wardrobe shutters", body: "HPL and VRB collections cover most shutter work at 1mm." },
    { heading: "Countertops", body: "The Countertop and Infinia Countertop ranges rather than a standard 1mm sheet." },
    { heading: "Doors", body: "Door Special and Door Laminates are sized and graded for full door faces." },
    { heading: "Labs and commercial", body: "Lab Guardian where chemical resistance is specified; Unicore where a cut edge is visible." },
  ],
  faqs: [
    {
      question: "What is the price of Greenlam laminate in Hyderabad?",
      answer:
        "Greenlam rates are quoted per requirement rather than published here. Send the collection, finish, shade codes and sheet count and a confirmed rate comes back the same day.",
    },
    {
      question: "What is Greenlam Unicore?",
      answer:
        "Unicore laminates are coloured all the way through, so a cut or mitred edge shows the surface colour instead of the dark kraft core line. It is specified where an edge will be visible without banding.",
    },
    {
      question: "Is EightByFour an authorised Greenlam dealer?",
      answer:
        "We are a supplier, not an authorised dealer or distributor. Greenlam sheets are sourced through our supply network.",
    },
    {
      question: "Can I see a Greenlam shade before ordering?",
      answer:
        "Yes — every shade in the table above links through to its own page, and physical samples of shortlisted shades can be arranged before you commit a full project quantity.",
    },
  ],
  related: [{ label: "Greenlam brand page", href: "/brands/greenlam" }, { label: "Greenlam laminate finishes guide", href: "/guides/greenlam-laminate-finishes-guide" }, ...LAMINATE_RELATED],
});

const MERINO_LAMINATE = laminateBrandPage({
  slug: "merino-laminate-price",
  brand: "Merino",
  brandSlug: "merino",
  h1: "Merino Laminate Price in Hyderabad",
  metaDescription:
    "Merino laminate sheet rates in Hyderabad across the Laminates, Luvih and Special Laminates ranges — live per-sheet pricing, 1mm thickness, 8×4 ft. Compare and quote your shade list.",
  intro: [
    "Merino is the brand most Hyderabad fabricators default to for wardrobe and shutter work, and the reason is consistency: one rate across a very large shade book, so a designer can change their mind about a colour without changing the quote.",
    "The table below groups the catalogue by collection with the live per-sheet rate and the number of shades in each. Rates are per 8×4 ft sheet excluding GST.",
    "Where a project needs a shade held across several deliveries, say so with the enquiry — that is a stock question rather than a price one, and it is worth confirming before the first delivery rather than after.",
  ],
  tableNote:
    "Rates above are per 8×4 ft sheet excluding GST. Merino prices by grade rather than by shade, so every shade within a collection carries the same rate. Click a range to browse its shades.",
  applications: LAMINATE_APPLICATIONS,
  faqs: [
    {
      question: "What is the price of Merino laminate in Hyderabad?",
      answer:
        "The table above carries the live per-sheet rate for each Merino range we stock, excluding GST. The rate is uniform across shades within a collection.",
    },
    {
      question: "How many shades does Merino offer?",
      answer:
        "The shade count per collection is shown in the table above and read live from the catalogue — click through to browse every shade in a range.",
    },
    {
      question: "What is Merino Luvih?",
      answer:
        "Luvih is Merino's decorative sub-brand, listed as its own collection in the table above with its own shade set.",
    },
    {
      question: "Can Merino laminate be used on a countertop?",
      answer:
        "Standard 1mm Merino sheets are a vertical-surface grade. For a working countertop, ask for a countertop-grade sheet rather than a standard one — it is a different product, not just a thicker one.",
    },
  ],
  related: [{ label: "Merino brand page", href: "/brands/merino" }, { label: "Merino laminate finishes guide", href: "/guides/merino-laminate-finishes-guide" }, ...LAMINATE_RELATED],
});

const VIRGO_LAMINATE = laminateBrandPage({
  slug: "virgo-laminate-price",
  brand: "Virgo",
  brandSlug: "virgo",
  h1: "Virgo Laminate Price in Hyderabad",
  metaDescription:
    "Virgo laminate rates in Hyderabad across Superlative High Gloss, Super Matt, Sparkle, Fluted and leather-finish ranges — live per-sheet pricing at 1mm. Compare and quote your list.",
  intro: [
    "Virgo's catalogue is built around finish rather than shade: Superlative High Gloss, Super Matt, Suede, Sparkle High Gloss, Mapa Leather, Fluted. The finish code on the sheet is what identifies it — the same colour name exists in three different finishes.",
    "That makes the finish code the thing to quote from, not the shade name. The table below groups by collection with the live per-sheet rate and the shade count behind each.",
    "Rates are per 8×4 ft sheet excluding GST.",
  ],
  tableNote:
    "Rates above are per 8×4 ft sheet excluding GST. Virgo prices by finish family, so shades within a collection share a rate. Quote the finish code alongside the shade name — the same colour exists across several finishes.",
  applications: [
    { heading: "High gloss shutters", body: "Superlative High Gloss and Sparkle High Gloss. Worth knowing before specifying: gloss shows every fingerprint and every substrate imperfection under it." },
    { heading: "Matt and suede finishes", body: "Super Matt and Suede for kitchens that get daily use — the practical alternative to gloss on the same shade." },
    { heading: "Fluted and textured panels", body: "The Fluted range for feature walls and TV unit backdrops." },
    { heading: "Leather and speciality", body: "Mapa Leather and the textured ranges for wardrobe faces and headboards." },
  ],
  faqs: [
    {
      question: "What is the price of Virgo laminate in Hyderabad?",
      answer:
        "The table above carries the live per-sheet rate for each Virgo range, excluding GST, at 1mm on 8×4 ft sheets.",
    },
    {
      question: "What do Virgo finish codes like SHG and SMT mean?",
      answer:
        "They identify the finish family — SHG is Superlative High Gloss, SMT is Super Matt. The same shade name can exist across several finishes, so the code is what pins down the exact sheet.",
    },
    {
      question: "Is high gloss laminate practical for a kitchen?",
      answer:
        "It looks excellent and shows every fingerprint. In a kitchen that gets daily use, a super matt or suede finish in the same shade is usually the better call — and costs the same.",
    },
  ],
  related: [{ label: "Virgo brand page", href: "/brands/virgo" }, ...LAMINATE_RELATED],
});

export const PRICE_PAGES: PricePageConfig[] = [
  PLYWOOD_PRICE,
  EIGHTEEN_MM,
  TWELVE_MM,
  SIX_MM,
  MR_PLYWOOD,
  BWP_PLYWOOD,
  MARINE_PLYWOOD,
  CENTURY_PLYWOOD,
  GREENPLY_PLYWOOD,
  HDHMR_BOARD,
  MDF_BOARD,
  LAMINATE_PRICE,
  ONE_MM_LAMINATE,
  GREENLAM_LAMINATE,
  MERINO_LAMINATE,
  VIRGO_LAMINATE,
];

export const PRICE_PAGE_SLUGS: string[] = PRICE_PAGES.map((p) => p.slug);

export function getPricePage(slug: string): PricePageConfig | undefined {
  return PRICE_PAGES.find((p) => p.slug === slug);
}

export interface PricePageLink {
  slug: string;
  title: string;
}

/**
 * Price pages that answer a commercial question about this category — linked
 * from the category listing so "what plywood do you stock" and "what does
 * plywood cost" stay one click apart instead of competing for the same query.
 * Derived from each page's own selector, so a new price page appears on the
 * right category page without a second registry to keep in sync.
 */
export function pricePagesForDbCategory(dbCategory: string, limit = 8): PricePageLink[] {
  return PRICE_PAGES.filter((page) => page.selector.dbCategories.includes(dbCategory))
    .slice(0, limit)
    .map((page) => ({ slug: page.slug, title: page.h1 }));
}

export function pricePagesForBrandSlug(brandSlug: string): PricePageLink[] {
  return PRICE_PAGES.filter((page) => page.brandSlugs?.includes(brandSlug)).map((page) => ({ slug: page.slug, title: page.h1 }));
}

