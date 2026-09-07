import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-server";
import { searchCatalogue } from "@/lib/data/quotes";

/** Catalogue lookup for the Rate Book form's optional "link to product". */
export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ products: [] }, { status: 403 });
  const products = await searchCatalogue(request.nextUrl.searchParams.get("q") ?? "");
  return NextResponse.json({ products }, { headers: { "Cache-Control": "no-store" } });
}
