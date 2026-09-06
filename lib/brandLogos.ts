// Static brand-name -> logo URL map so product cards/pages can show a logo
// without an extra DB round trip per card. Mirrors `brands.logo_url` in
// Supabase — update here if a brand's logo changes or a new stocked brand
// is added (see SOURCE_ONLY_BRANDS in lib/source-only-brands.ts for brands
// we don't stock as SKUs).
export const BRAND_LOGOS: Record<string, string> = {
  Austin: "/brand-logos/austin.png",
  "Bison Panel": "/brand-logos/bisonpanel.webp",
  Century: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/century.png",
  "Century Laminates": "/brand-logos/century-laminates.jpg",
  Durasein: "/brand-logos/durasein.webp",
  EightByFour: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/eightbyfour.png",
  Fevicol: "/brand-logos/fevicol.jpeg",
  "Green Panel": "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/green-panel.png",
  Greenlam: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/greenlam.webp",
  Greenply: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/greenply.svg",
  Merino: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/merino.webp",
  Mikasa: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/mikasa.png",
  RelWOOD: "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/relwood.jpeg",
  "Sky Decor": "https://svjlalgrcuwyvwpxriwd.supabase.co/storage/v1/object/public/product-images/brands/skydecor.png",
  Tiara: "/brand-logos/tiara.png",
  Virgo: "/brand-logos/virgo.jpg",
  "Wigwam Excel": "/brand-logos/wigwam.png",
};
