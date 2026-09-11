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

/**
 * Whether EightxFour's current commerce architecture makes ANY product
 * eligible for a Google Merchant product feed, checked 2026-09-12:
 *
 *   - No product page has an "Add to cart" or "Buy" action anywhere on the
 *     site — every CTA (Get Project Pricing / Get Today's Price / WhatsApp
 *     for Quote / the BOQ-upload quote modal) leads to a lead-capture form
 *     that inserts a row into Supabase `inquiries` and hands off to
 *     WhatsApp. See ProductQuoteSection, QuoteRequestForm, QuoteModalContext.
 *   - No checkout route exists. No payment gateway is wired in anywhere
 *     (checked package.json and the full app/lib tree — no Stripe/Razorpay/
 *     PayU/PayPal, no cart state, no order model).
 *   - `price_table` holding a number means a rate is on file for quoting —
 *     it is not a live, purchasable price a customer can act on without a
 *     human confirming quantity, finish, thickness and delivery first (the
 *     same "price on request" logic the product pages and Product schema
 *     already use — a price alone does not make a SKU transactable).
 *
 * That is a quote/procurement flow end to end, not a direct-purchase one —
 * Google Merchant Center's own policy requires a working checkout a
 * customer can actually complete on click-through, which nothing here
 * provides for any SKU. So today, correctly, NO product qualifies: the
 * feed emits its header row and nothing else rather than assert an
 * `availability` (in_stock/backorder/out_of_stock all equally invented,
 * per lib/seoProtection.ts's sibling reasoning for schema.org) or a `price`
 * a customer can't actually transact on right now.
 *
 * Flip this back on — per-row, not fleet-wide — only once a real checkout
 * exists for at least some SKUs, and gate `isMerchantEligible` on that
 * per-product signal rather than on `price_table` alone.
 */
// Unused today — the real per-product shape this will read once it can return true.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isMerchantEligible(_product: ProductRow): boolean {
  return false;
}

export async function GET() {
  const supabase = createServerSupabaseClient();
  const { data: products, error } = await supabase.from("products").select("*").not("price_table", "is", null);
  if (error) throw error;

  const rows = (products as ProductRow[])
    .filter(isMerchantEligible)
    .map((p) => {
      const price = resolvePrice(p);
      if (price === null || !p.main_img_url) return null; // Merchant Center requires both
      return [
        String(p.id),
        `${p.brand} ${p.name}`,
        p.description || `${p.brand} ${p.name} — available in Hyderabad from EightxFour.`,
        `${SITE_URL}/products/${p.slug}`,
        p.main_img_url,
        // Left in place (not "in_stock"/"backorder") for when
        // isMerchantEligible starts admitting real rows — see its comment.
        // A row that reaches this line is, by construction, one where
        // availability is genuinely known, not inferred from price alone.
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
