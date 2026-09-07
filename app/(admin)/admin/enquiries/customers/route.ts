import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-server";
import { searchCustomers } from "@/lib/data/enquiries";

/**
 * Customer lookup for the create form's picker.
 *
 * A route handler rather than an imperative Server Action: this is a plain
 * read that runs on every keystroke, it is trivially testable with curl, and
 * it keeps the debounce/abort story on the client where it belongs.
 *
 * Authorization is re-checked here, not inherited from the page — middleware
 * guards /admin/* rendering, but this endpoint is reachable on its own.
 */
export async function GET(request: NextRequest) {
  const check = await requireAdmin();
  if (!check.ok) return NextResponse.json({ customers: [] }, { status: 403 });

  const term = request.nextUrl.searchParams.get("q") ?? "";
  const customers = await searchCustomers(term);
  // Contact details — never cached at the edge or in the browser.
  return NextResponse.json({ customers }, { headers: { "Cache-Control": "no-store" } });
}
