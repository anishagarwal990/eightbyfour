// Manufacturer finish codes → the finish's own name, for the codes a source
// in this repo actually defines. Nothing here is guessed: Merino and Greenlam
// come from the finish guides in content/guides/, Virgo from the "Finish Name"
// rows seeded into its products' spec_table. Century Laminates publishes no
// names alongside its codes (SU, LU, SI…), so its codes are shown bare rather
// than expanded into something that might be wrong on a buying page.
//
// Keyed by the `brand` column exactly as stored in `products`.
const FINISH_NAMES: Record<string, Record<string, string>> = {
  Merino: {
    FNW: "FineWood",
    PSC: "Pine Sync",
    HRZ: "Horizon",
    MNT: "Monte",
    VLY: "Valley",
    VNR: "Veneer",
    VNZ: "Venza",
    IMP: "Impression",
    STK: "Streak",
    SCT: "Saw Cut",
    PRH: "Parrish",
    HGL: "Hi Gloss",
    JW: "Jewel",
    OPL: "Opal",
    GMS: "Gemstone",
    MT: "Matt",
    SF: "Suede",
    FT: "Feather Touch",
    PT: "Pebble Touch",
    NL: "Nubuck Leather",
    FLT: "Fluted",
    WVN: "Woven",
    SLT: "Slant",
    GNR: "Grains",
    ML: "Microlines",
    VL: "Vertiline",
    FB: "Fabric",
    LNN: "Linen",
    CMR: "Chimera",
    CFR: "Crossfire",
    DW: "Dew Drop",
    DZL: "Drizzle",
    FK: "Flicker",
    WV: "Wave",
    BRK: "Bark",
    BR: "Brush",
    CMT: "Cement",
    MNS: "Moonscape",
    WTN: "Whitney",
  },
  Greenlam: {
    SUD: "Suede",
    SGL: "Super Gloss",
    SAT: "Satin",
    HDG: "HD Gloss",
    JUP: "Jupiter",
    FWN: "Fawn",
    OLM: "Olmo",
    ASH: "Edgy Ash",
    ARN: "Aran",
    BRL: "Barrel",
    CNY: "Canyon",
  },
  Virgo: {
    SHG: "Superlative High Gloss",
    SMT: "Super Matt",
    SHN: "Shiny",
    SF: "Suede Finish",
    MLR: "Mapa Leather",
    "GLX-5": "Sparkle High Gloss",
    TRA: "Teracota",
    FLD: "Fluted",
    ST: "Stone",
    SOK: "Seatd Oak",
    CHN: "Channelled",
    GSE: "Grascia Stone",
  },
};

/** The finish's name for a brand's finish code, or null when no source in the repo defines it. */
export function finishName(brand: string, code: string): string | null {
  return FINISH_NAMES[brand]?.[code.trim().toUpperCase()] ?? null;
}

/**
 * Human label for a finish value: "Feather Touch (FT)" when the code is
 * known, the value untouched otherwise ("Standard", "LU", or a value that
 * already carries its own name like "Suede (SUD)").
 */
export function finishLabel(brand: string, value: string): string {
  const trimmed = value.trim();
  if (trimmed.includes("(")) return trimmed;
  const name = finishName(brand, trimmed);
  return name ? `${name} (${trimmed})` : trimmed;
}
