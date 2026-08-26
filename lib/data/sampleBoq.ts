import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/lib/supabase/types";
import { formatPrice, toPriceRow } from "@/lib/priceRows";

// The line items behind the "what a consolidated quotation looks like" table
// on the BOQ page. Products are real catalogue rows and their rates are read
// live; only the quantities are illustrative, and the page says so. Nothing
// here invents a price, a customer or a project.
const SAMPLE_LINES: { slug: string; quantity: string; note: string }[] = [
  { slug: "century-club-prime-ply", quantity: "18 sheets · 19mm", note: "Kitchen base units and bathroom vanity — IS 710 boil-proof carcass" },
  { slug: "century-sainik-mr-mr", quantity: "24 sheets · 19mm", note: "Wardrobe carcasses and shutters on dry internal walls" },
  { slug: "green-panel-mr-mr", quantity: "12 sheets · 12mm", note: "Wardrobe shelving and cabinet partitions" },
  { slug: "merino-14603-huron-lowa-walnut", quantity: "22 sheets · 1mm", note: "Wardrobe and shutter faces" },
  { slug: "virgo-1096-smt-pebble", quantity: "9 sheets · 1mm", note: "Kitchen shutters — super matt finish" },
  { slug: "green-panel-hdwr-high-density-water-resistant-hmr-gp-grade", quantity: "8 sheets · 18mm", note: "Routed and louvered shutter fronts" },
  { slug: "fevicol-fevicol-sh", quantity: "3 × 20 kg", note: "General laminating adhesive across the project" },
  { slug: "fevicol-fevicol-marine", quantity: "2 × 5 kg", note: "Wet-area laminating — kitchen and vanity" },
  { slug: "propperly-blockboard", quantity: "6 sheets · 18mm", note: "Long-span shelving and TV unit frames" },
];

export interface SampleBoqLine {
  slug: string;
  displayName: string;
  quantity: string;
  note: string;
  /** Live formatted rate, or null when the catalogue has no rate loaded. */
  rate: string | null;
}

export async function getSampleBoqLines(): Promise<SampleBoqLine[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .in("slug", SAMPLE_LINES.map((line) => line.slug));
  if (error) throw error;

  const bySlug = new Map<string, ProductRow>(data.map((row) => [row.slug, row]));

  // Drop any line whose product has left the catalogue rather than rendering a
  // dead row — the table is meant to show real, clickable products.
  return SAMPLE_LINES.flatMap((line) => {
    const product = bySlug.get(line.slug);
    if (!product) return [];
    const row = toPriceRow(product);
    return [{ slug: line.slug, displayName: row.displayName, quantity: line.quantity, note: line.note, rate: formatPrice(row) }];
  });
}
