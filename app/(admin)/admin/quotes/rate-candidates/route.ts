import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-server";
import { findRateCandidates } from "@/lib/data/rates";

/** Rate Book candidates for a quote line the operator is pricing by hand.
 *  Returns what the book holds for brand + thickness (+ optional label/range)
 *  so the operator can pick one explicitly — never auto-applied here. */
export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ rates: [] }, { status: 403 });
  const p = request.nextUrl.searchParams;
  const rates = await findRateCandidates({
    brand: p.get("brand"),
    thickness: p.get("thickness"),
    label: p.get("label"),
    rangeName: p.get("range"),
    grade: p.get("grade"),
  });
  return NextResponse.json({ rates }, { headers: { "Cache-Control": "no-store" } });
}
