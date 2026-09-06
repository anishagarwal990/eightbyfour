/**
 * Indicative material rates for the Studio configurators.
 *
 * These are demo values standing in for live catalogue pricing. They are
 * deliberately shaped like the real thing — a sheet rate for an 8×4 board, a
 * per-sheet rate for laminate, a per-piece rate for hardware — so that when
 * this is wired to Supabase the pricing engine keeps its shape and only the
 * source of `rate` changes.
 *
 * Every option that maps to a real EightByFour category carries `catalogue`,
 * the route a customer can open to see the actual SKUs behind the line.
 */

export const SHEET_SQFT = 32; // A standard 8 × 4 ft sheet.

export interface MaterialOption {
  id: string;
  label: string;
  /** Brand shown on the quote line. Uses names already stocked on the shop. */
  brand: string;
  /** e.g. "19 mm", "1 mm" — appears in the specification chips. */
  spec: string;
  /** Rate per 8×4 sheet unless the consuming engine says otherwise. */
  rate: number;
  /** Why someone would pick this, in one line a homeowner can read. */
  note: string;
  /** Simple-mode label — the benefit, not the material. */
  plain: string;
  catalogue?: string;
  /** CSS colour for the swatch chip. */
  swatch: string;
  /** Optional second colour — swatches render as a two-stop material gradient. */
  swatchTo?: string;
  /** Logo file in /public/brand-logos, where one exists for this brand. */
  logo?: string;
}

// ---------------------------------------------------------------- carcass ---

export const CARCASS_OPTIONS: MaterialOption[] = [
  {
    id: "particle",
    label: "Particle Board",
    brand: "Action Tesa",
    spec: "18 mm pre-laminated",
    rate: 1450,
    note: "Lowest cost. Dry areas only — it does not tolerate standing water.",
    plain: "Budget",
    catalogue: "/products/mdf-and-hdhmr",
    swatch: "#c8a97e",
    swatchTo: "#a1815a",
    logo: "action-tesa.png",
  },
  {
    id: "mdf",
    label: "MDF",
    brand: "Action Tesa",
    spec: "18 mm",
    rate: 1980,
    note: "Flat and stable, machines cleanly. Holds screws less well than ply.",
    plain: "Smooth & stable",
    catalogue: "/products/mdf-and-hdhmr",
    swatch: "#b98d63",
    swatchTo: "#8f6a45",
    logo: "action-tesa.png",
  },
  {
    id: "hdhmr",
    label: "HDHMR",
    brand: "Action Tesa",
    spec: "18 mm",
    rate: 2680,
    note: "Dense, moisture-resistant, screw-holding close to ply. The default for kitchens.",
    plain: "Moisture resistant",
    catalogue: "/products/mdf-and-hdhmr",
    swatch: "#a97b4f",
    swatchTo: "#7d5732",
    logo: "action-tesa.png",
  },
  {
    id: "commercial-ply",
    label: "Commercial Ply",
    brand: "Century",
    spec: "19 mm MR grade",
    rate: 2740,
    note: "Standard interior grade. Fine for bedrooms and dry storage.",
    plain: "Everyday durable",
    catalogue: "/products/plywood",
    swatch: "#d9b483",
    swatchTo: "#b08a56",
    logo: "century-laminates.jpg",
  },
  {
    id: "bwp-ply",
    label: "BWP Plywood",
    brand: "Century",
    spec: "19 mm boiling-water-proof",
    rate: 3480,
    note: "Boil-proof bonding. Worth the premium in kitchens, bathrooms and monsoon-exposed sites.",
    plain: "Highest durability",
    catalogue: "/products/plywood",
    swatch: "#c99a5c",
    swatchTo: "#966d38",
    logo: "century-laminates.jpg",
  },
];

// --------------------------------------------------------------- shutters ---

export const SHUTTER_OPTIONS: MaterialOption[] = [
  {
    id: "particle",
    label: "Particle Board",
    brand: "Action Tesa",
    spec: "18 mm",
    rate: 1450,
    note: "Only where the shutter stays dry and light.",
    plain: "Budget",
    catalogue: "/products/mdf-and-hdhmr",
    swatch: "#c8a97e",
    swatchTo: "#a1815a",
  },
  {
    id: "mdf",
    label: "MDF",
    brand: "Action Tesa",
    spec: "18 mm",
    rate: 1980,
    note: "The flattest shutter face — the right base under acrylic, PU and gloss.",
    plain: "Best for a flat finish",
    catalogue: "/products/mdf-and-hdhmr",
    swatch: "#b98d63",
    swatchTo: "#8f6a45",
  },
  {
    id: "hdhmr",
    label: "HDHMR",
    brand: "Action Tesa",
    spec: "18 mm",
    rate: 2680,
    note: "Flat like MDF but moisture-tolerant. Common on kitchen shutters.",
    plain: "Flat + moisture resistant",
    catalogue: "/products/mdf-and-hdhmr",
    swatch: "#a97b4f",
    swatchTo: "#7d5732",
  },
  {
    id: "ply",
    label: "Plywood",
    brand: "Century",
    spec: "19 mm BWP",
    rate: 3480,
    note: "Strongest shutter, best screw hold at the hinge. Slight grain telegraph under gloss.",
    plain: "Strongest",
    catalogue: "/products/plywood",
    swatch: "#c99a5c",
    swatchTo: "#966d38",
  },
];

// ----------------------------------------------------------------- finish ---

export interface FinishOption extends MaterialOption {
  /** Extra fabrication effort this finish adds, ₹ per sq ft of shutter face. */
  applicationRate: number;
  /** True where the finish is applied wet on site / in a booth, not pressed. */
  sprayed?: boolean;
}

export const FINISH_OPTIONS: FinishOption[] = [
  {
    id: "lam-08",
    label: "0.8 mm Laminate",
    brand: "Merino",
    spec: "0.8 mm, matt",
    rate: 1180,
    applicationRate: 38,
    note: "The workhorse. Widest shade range, easiest to replace years later.",
    plain: "Good",
    catalogue: "/products/laminates",
    swatch: "#e6ddd0",
    swatchTo: "#cfc2ae",
    logo: "merino.webp",
  },
  {
    id: "lam-1",
    label: "1 mm Laminate",
    brand: "Greenlam",
    spec: "1 mm, suede",
    rate: 1520,
    applicationRate: 42,
    note: "Thicker face, better impact resistance at the edges. The usual default.",
    plain: "Better",
    catalogue: "/products/laminates",
    swatch: "#ded2c0",
    swatchTo: "#b9a894",
    logo: "greenlam.webp",
  },
  {
    id: "lam-woodgrain",
    label: "Woodgrain Laminate",
    brand: "Greenlam",
    spec: "1 mm, synchronised texture",
    rate: 1760,
    applicationRate: 46,
    note: "Texture registered to the print, so it reads as timber under a hand.",
    plain: "Timber look",
    catalogue: "/products/laminates",
    swatch: "#a9764a",
    swatchTo: "#6f4a29",
    logo: "greenlam.webp",
  },
  {
    id: "lam-gloss",
    label: "Gloss Laminate",
    brand: "Merino",
    spec: "1 mm high gloss",
    rate: 2140,
    applicationRate: 54,
    note: "Mirror face at laminate cost. Shows dust and fingerprints.",
    plain: "High shine",
    catalogue: "/products/laminates",
    swatch: "#f2efe9",
    swatchTo: "#cdd3d6",
    logo: "merino.webp",
  },
  {
    id: "acrylic-gloss",
    label: "Acrylic Gloss",
    brand: "Durlax",
    spec: "1 mm acrylic, mirror gloss",
    rate: 4180,
    applicationRate: 96,
    note: "Deepest reflection available on a pressed shutter. Needs an MDF base to stay flat.",
    plain: "Premium shine",
    catalogue: "/products/laminates",
    swatch: "#ffffff",
    swatchTo: "#dfe6ea",
    logo: "durlax.png",
  },
  {
    id: "acrylic-matt",
    label: "Acrylic Matt",
    brand: "Durlax",
    spec: "1 mm acrylic, anti-fingerprint",
    rate: 4460,
    applicationRate: 96,
    note: "Soft-touch matt that resists fingerprints — the current kitchen default at the top end.",
    plain: "Premium matt",
    catalogue: "/products/laminates",
    swatch: "#3c4147",
    swatchTo: "#23272b",
    logo: "durlax.png",
  },
  {
    id: "veneer",
    label: "Natural Veneer",
    brand: "Vivanta",
    spec: "0.5 mm, teak, book-matched",
    rate: 3980,
    applicationRate: 145,
    note: "Real timber face. Every panel differs, and it is polished after fitting, not before.",
    plain: "Real timber",
    catalogue: "/products/veneers",
    swatch: "#8a5a30",
    swatchTo: "#5c3a1d",
    logo: "vivanta.jpeg",
    sprayed: true,
  },
  {
    id: "pu",
    label: "PU Paint",
    brand: "Studio applied",
    spec: "2K PU, matt or gloss",
    rate: 0,
    applicationRate: 340,
    note: "Sprayed and cured, so any colour is possible — and any damage needs a respray, not a swap.",
    plain: "Any colour",
    swatch: "#6e1f2e",
    swatchTo: "#4f1520",
    sprayed: true,
  },
];

// -------------------------------------------------------- internal finish ---

export const INTERNAL_FINISH_OPTIONS: MaterialOption[] = [
  {
    id: "white-lam",
    label: "White Laminate",
    brand: "Merino",
    spec: "0.8 mm white",
    rate: 980,
    note: "Brightest interior, easiest to keep clean. The standard choice.",
    plain: "Bright & standard",
    catalogue: "/products/laminates",
    swatch: "#fbfaf7",
    swatchTo: "#e6e3db",
  },
  {
    id: "prelam",
    label: "Pre-laminated Board",
    brand: "Action Tesa",
    spec: "Factory-finished both faces",
    rate: 0,
    note: "Interior comes finished from the board mill — no separate pressing, lowest cost.",
    plain: "Lowest cost",
    catalogue: "/products/mdf-and-hdhmr",
    swatch: "#efe9df",
    swatchTo: "#d6cec1",
  },
  {
    id: "decorative",
    label: "Decorative Laminate",
    brand: "Greenlam",
    spec: "0.8 mm, textured",
    rate: 1280,
    note: "A shade inside that isn't white — reads better in an open wardrobe.",
    plain: "Considered",
    catalogue: "/products/laminates",
    swatch: "#cdb79a",
    swatchTo: "#a99175",
  },
  {
    id: "matching",
    label: "Matching Finish",
    brand: "Matched to shutter",
    spec: "Same laminate inside and out",
    rate: 1520,
    note: "Interior matches the shutter face. Most expensive, most resolved.",
    plain: "Fully matched",
    catalogue: "/products/laminates",
    swatch: "#b8a78e",
    swatchTo: "#8f7f68",
  },
];

// --------------------------------------------------------------- hardware ---

export interface HardwareTier {
  id: string;
  label: string;
  brand: string;
  plain: string;
  note: string;
  /** Named components shown on the quote, with per-piece rates. */
  components: { label: string; rate: number; unit: string }[];
  /** Multiplier applied to the derived piece counts. */
  hingeRate: number;
  channelRate: number;
  handleRate: number;
  logo?: string;
}

export const HARDWARE_TIERS: HardwareTier[] = [
  {
    id: "essential",
    label: "Essential",
    brand: "Ebco",
    plain: "Works",
    note: "Standard hydraulic hinges and telescopic channels. Everything opens and closes properly.",
    hingeRate: 210,
    channelRate: 640,
    handleRate: 260,
    logo: "ebco.png",
    components: [
      { label: "Soft-close hinge", rate: 210, unit: "each" },
      { label: "Telescopic drawer channel", rate: 640, unit: "set" },
      { label: "Aluminium handle", rate: 260, unit: "each" },
    ],
  },
  {
    id: "premium",
    label: "Premium",
    brand: "Hettich",
    plain: "Feels better every day",
    note: "Sensys hinges and Quadro undermount runners — the difference you feel on every open.",
    hingeRate: 420,
    channelRate: 1980,
    handleRate: 540,
    logo: "hettich.png",
    components: [
      { label: "Sensys soft-close hinge", rate: 420, unit: "each" },
      { label: "Quadro undermount runner", rate: 1980, unit: "set" },
      { label: "Profile handle", rate: 540, unit: "each" },
    ],
  },
  {
    id: "luxury",
    label: "Luxury",
    brand: "Blum",
    plain: "The best available",
    note: "Blum Clip-top Blumotion and Tandembox with motion technology. Lifetime-rated mechanisms.",
    hingeRate: 720,
    channelRate: 4200,
    handleRate: 980,
    logo: "blum.png",
    components: [
      { label: "Clip-top Blumotion hinge", rate: 720, unit: "each" },
      { label: "Tandembox drawer system", rate: 4200, unit: "set" },
      { label: "Gola / integrated profile", rate: 980, unit: "running ft" },
    ],
  },
];

// ------------------------------------------------------------ accessories ---

export interface Accessory {
  id: string;
  label: string;
  brand: string;
  /** Flat price for the accessory as configured. */
  rate: number;
  unit: string;
  note: string;
  /** Only offered on these furniture types. Empty = offered on all. */
  onlyFor?: string[];
}

export const ACCESSORIES: Accessory[] = [
  { id: "drawers", label: "Drawer bank (3)", brand: "Hettich", rate: 8400, unit: "set of 3", note: "Internal drawers on undermount runners." },
  { id: "trouser", label: "Trouser rack", brand: "Ebco", rate: 3200, unit: "unit", note: "Pull-out, soft-close.", onlyFor: ["wardrobe"] },
  { id: "shoe", label: "Shoe rack", brand: "Ebco", rate: 4600, unit: "unit", note: "Tilt-out shoe storage.", onlyFor: ["wardrobe", "storage"] },
  { id: "jewellery", label: "Jewellery organiser", brand: "Hettich", rate: 5400, unit: "unit", note: "Felt-lined insert drawer.", onlyFor: ["wardrobe"] },
  { id: "mirror", label: "Mirror unit", brand: "Ebco", rate: 4200, unit: "unit", note: "Pull-out or shutter-mounted.", onlyFor: ["wardrobe", "vanity"] },
  { id: "lift", label: "Wardrobe lift", brand: "Hafele", rate: 9800, unit: "unit", note: "Pull-down rail for loft hanging.", onlyFor: ["wardrobe"] },
  { id: "led", label: "LED profile lighting", brand: "Ozone", rate: 6200, unit: "run", note: "Sensor-triggered internal lighting." },
  { id: "loft", label: "Loft storage", brand: "—", rate: 11500, unit: "unit", note: "Additional carcass and shutters above 8 ft.", onlyFor: ["wardrobe", "storage"] },
  { id: "tandem", label: "Tandem pantry unit", brand: "Hafele", rate: 22000, unit: "unit", note: "Full-height pull-out pantry.", onlyFor: ["kitchen"] },
  { id: "corner", label: "Corner carousel", brand: "Hafele", rate: 14500, unit: "unit", note: "Magic corner for blind corners.", onlyFor: ["kitchen"] },
  { id: "cutlery", label: "Cutlery organiser", brand: "Hettich", rate: 3400, unit: "unit", note: "Drawer insert, sized to the drawer.", onlyFor: ["kitchen"] },
];

// ---------------------------------------------------- solid surface sheets ---

export interface SurfaceOption {
  id: string;
  label: string;
  brand: string;
  shade: string;
  /** Rate per 12 ft × 30 in sheet. */
  rate: number;
  swatch: string;
  swatchTo?: string;
  note: string;
  logo?: string;
}

export const SURFACE_OPTIONS: SurfaceOption[] = [
  {
    id: "himacs-white",
    label: "HIMACS Alpine White",
    brand: "LX Hausys",
    shade: "S028",
    rate: 18400,
    swatch: "#fbfaf6",
    swatchTo: "#e8e6df",
    note: "The reference white. Seams disappear completely.",
    logo: "lx-hausys.jpeg",
  },
  {
    id: "corian-glacier",
    label: "Corian Glacier White",
    brand: "Corian",
    shade: "Glacier White",
    rate: 22600,
    swatch: "#ffffff",
    swatchTo: "#eceae4",
    note: "The original acrylic solid surface, and the widest fabricator familiarity.",
  },
  {
    id: "staron-sanded",
    label: "Staron Sanded Onyx",
    brand: "Staron",
    shade: "SO423",
    rate: 19800,
    swatch: "#3a3a3c",
    swatchTo: "#1e1e20",
    note: "Dark particulate. Shows water spotting more than a white.",
    logo: "staron.png",
  },
  {
    id: "durasein-quartz",
    label: "Durasein Quartz Grey",
    brand: "Durasein",
    shade: "DQ-118",
    rate: 16900,
    swatch: "#b7b7b2",
    swatchTo: "#8e8e89",
    note: "Mid grey with a fine particulate — the forgiving choice for a busy kitchen.",
    logo: "durasein.webp",
  },
  {
    id: "durian-marble",
    label: "Durian Statuario",
    brand: "Durian",
    shade: "DS-902",
    rate: 24800,
    swatch: "#f4f2ee",
    swatchTo: "#cfd3d6",
    note: "Veined pattern — veins must be run-matched across a joint, which adds fabrication time.",
    logo: "durian.webp",
  },
];

// --------------------------------------------- boards & laminates: pressing ---

export interface PressBoard {
  id: string;
  label: string;
  brand: string;
  thickness: string;
  rate: number;
  swatch: string;
  swatchTo?: string;
  catalogue: string;
  logo?: string;
}

export const PRESS_BOARDS: PressBoard[] = [
  { id: "mr-ply-19", label: "Commercial Ply (MR)", brand: "Century", thickness: "19 mm", rate: 2740, swatch: "#d9b483", swatchTo: "#b08a56", catalogue: "/products/plywood", logo: "century-laminates.jpg" },
  { id: "bwp-ply-19", label: "BWP Plywood", brand: "Century", thickness: "19 mm", rate: 3480, swatch: "#c99a5c", swatchTo: "#966d38", catalogue: "/products/plywood", logo: "century-laminates.jpg" },
  { id: "mdf-18", label: "MDF", brand: "Action Tesa", thickness: "18 mm", rate: 1980, swatch: "#b98d63", swatchTo: "#8f6a45", catalogue: "/products/mdf-and-hdhmr", logo: "action-tesa.png" },
  { id: "hdhmr-18", label: "HDHMR", brand: "Action Tesa", thickness: "18 mm", rate: 2680, swatch: "#a97b4f", swatchTo: "#7d5732", catalogue: "/products/mdf-and-hdhmr", logo: "action-tesa.png" },
  { id: "bwp-ply-12", label: "BWP Plywood", brand: "Century", thickness: "12 mm", rate: 2380, swatch: "#cfa267", swatchTo: "#9c7440", catalogue: "/products/plywood", logo: "century-laminates.jpg" },
];

export interface PressLaminate {
  id: string;
  label: string;
  brand: string;
  code: string;
  thickness: string;
  rate: number;
  swatch: string;
  swatchTo?: string;
  logo?: string;
}

export const PRESS_LAMINATES: PressLaminate[] = [
  { id: "gl-5347", label: "Suede Walnut", brand: "Greenlam", code: "5347 SUD", thickness: "1 mm", rate: 1520, swatch: "#7c5233", swatchTo: "#4f331d", logo: "greenlam.webp" },
  { id: "mer-1108", label: "Frosty White", brand: "Merino", code: "1108 SF", thickness: "1 mm", rate: 1380, swatch: "#fbfaf7", swatchTo: "#e4e1d9", logo: "merino.webp" },
  { id: "cen-8842", label: "Smoked Oak", brand: "Century", code: "8842 CSD", thickness: "1 mm", rate: 1640, swatch: "#9c7b58", swatchTo: "#6b5138", logo: "century-laminates.jpg" },
  { id: "gl-2201", label: "Graphite Matt", brand: "Greenlam", code: "2201 MT", thickness: "1 mm", rate: 1580, swatch: "#4a4d51", swatchTo: "#2c2e31", logo: "greenlam.webp" },
  { id: "mer-4501", label: "Linen Texture", brand: "Merino", code: "4501 TXN", thickness: "1 mm", rate: 1460, swatch: "#ddd4c4", swatchTo: "#bcb0a0", logo: "merino.webp" },
];

export const BALANCING_LAMINATES: PressLaminate[] = [
  { id: "bal-08", label: "Balancing Laminate", brand: "Merino", code: "BL-08", thickness: "0.8 mm white", rate: 780, swatch: "#f4f1ea", swatchTo: "#dcd8ce", logo: "merino.webp" },
  { id: "bal-liner", label: "Liner Grade", brand: "Greenlam", code: "LNR-06", thickness: "0.6 mm", rate: 620, swatch: "#e9e3d7", swatchTo: "#cec7b8", logo: "greenlam.webp" },
  { id: "bal-match", label: "Same as front", brand: "Matched", code: "—", thickness: "matched", rate: 0, swatch: "#c9b79c", swatchTo: "#9d8b71" },
];
