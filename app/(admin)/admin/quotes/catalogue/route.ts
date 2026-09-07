import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-server";
import { searchCatalogue } from "@/lib/data/quotes";

/** Catalogue product search for the quote builder's line editor and the Rate
 *  Book form's optional product link. Admin-only, never cached. */
export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ products: [] }, { status: 403 });
  const term = request.nextUrl.searchParams.get("q") ?? "";
  const products = await searchCatalogue(term);
  return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } });
}
