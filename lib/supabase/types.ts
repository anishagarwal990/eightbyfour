// Hand-maintained until we wire up `supabase gen types` — kept minimal,
// just the shape the app code actually reads/writes.
export interface ProductRow {
  id: number;
  slug: string;
  category: string;
  brand: string;
  name: string;
  collection: string | null;
  grade: string | null;
  size: string | null;
  thicknesses: string[] | null;
  sd_code: string | null;
  eb_code: string | null;
  finish: string | null;
  finishes: string[] | null;
  mood: string | null;
  tone: string | null;
  main_img_url: string | null;
  edge_img_url: string | null;
  app_img_url: string | null;
  gallery_img_urls: string[] | null;
  price_table: unknown;
  description: string | null;
  core: string | null;
  density: string | null;
  warranty: string | null;
  certifications: string[] | null;
  applications: string[] | null;
  catalogue_url: string | null;
  tech_sheet_url: string | null;
  installation_guide_url: string | null;
  created_at: string;
}

export interface BrandRow {
  id: number;
  slug: string;
  name: string;
  logo_url: string | null;
  overview: string | null;
  website_url: string | null;
  created_at: string;
}

