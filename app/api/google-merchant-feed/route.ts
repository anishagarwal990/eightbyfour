import { createServerSupabaseClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/seo";
import type { ProductRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

// Google's product taxonomy path for building materials sold loose (not a
// perfect match per category, but the closest stable branch that exists in
// Google's taxonomy for both plywood and laminates).
const GOOGLE_PRODUCT_CATEGORY = "Home & Garden > Hardware > Building Consumables";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

function resolvePrice(product: ProductRow): number | null {
  const table = product.price_table;
  if (!table || typeof table !== "object") return null;
  const t = table as { starting_price?: unknown; min_price?: unknown };
  if (typeof t.min_price === "number") return t.min_price;
  if (typeof t.starting_price === "number") return t.starting_price;
  return null;
}

const HEADERS = [
  "id",
  "title",
  "description",
  "link",
  "image_link",
  "availability",
  "price",
  "brand",
  "condition",
  "identifier_exists",
  "google_product_category",
  "tax",
];

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: products, error } = await supabase.from("products").select("*").not("price_table", "is", null);
  if (error) throw error;

  const rows = (products as ProductRow[])
    .map((p) => {
      const price = resolvePrice(p);
      if (price === null || !p.main_img_url) return null; // Merchant Center requires both
      return [
        String(p.id),
        `${p.brand} ${p.name}`,
        p.description || `${p.brand} ${p.name} — available in Hyderabad from EightxFour.`,
        `${SITE_URL}/products/${p.slug}`,
        p.main_img_url,
        "in_stock",
        `${price.toFixed(2)} INR`,
        p.brand,
        "new",
        "no",
        GOOGLE_PRODUCT_CATEGORY,
        "IN::18:n", // 18% GST, not applied to shipping - displayed prices are excl. GST
      ]
        .map((v) => csvEscape(String(v)))
        .join(",");
    })
    .filter((r): r is string => r !== null);

  const csv = [HEADERS.join(","), ...rows].join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
