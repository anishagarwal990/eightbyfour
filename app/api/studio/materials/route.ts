import { NextResponse } from "next/server";
import {
  getStudioMaterialFacets,
  getStudioMaterials,
  type StudioMaterialKind,
} from "@/lib/studio/materialCatalogue";
import { requireAdmin } from "@/lib/supabase/admin-server";

/**
 * Search the real catalogue for a Studio material picker.
 *
 * ?kind=board|laminate            (required)
 * ?brand= &grade= &thickness= &q= (filters)
 * ?offset=                        (paging; limit is fixed at 40)
 * ?facets=1                       (also return brand/grade/thickness facets)
 *
 * Facets are only needed once when the picker opens, so they are opt-in
 * rather than on every keystroke.
 */
export async function GET(request: Request) {
  // Studio is not public yet. Middleware turns anonymous callers away with a
  // 401; this is the authorization half — signed in is not allowlisted.
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.message }, { status: check.reason === "signed-out" ? 401 : 403 });
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  if (kind !== "board" && kind !== "laminate") {
    return NextResponse.json({ error: "kind must be 'board' or 'laminate'" }, { status: 400 });
  }

  const query = {
    brand: url.searchParams.get("brand") || undefined,
    grade: url.searchParams.get("grade") || undefined,
    thickness: url.searchParams.get("thickness") || undefined,
    q: url.searchParams.get("q") || undefined,
    offset: Number(url.searchParams.get("offset")) || 0,
    limit: 40,
  };

  try {
    const [page, facets] = await Promise.all([
      getStudioMaterials(kind as StudioMaterialKind, query),
      url.searchParams.get("facets") ? getStudioMaterialFacets(kind as StudioMaterialKind) : Promise.resolve(null),
    ]);

    // NOT `public`: this is behind a session now, and a shared cache holding
    // an authenticated response is a shared cache that can hand it to someone
    // else. The catalogue behind it is public data, but the endpoint is not.
    return NextResponse.json({ ...page, facets }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("studio materials search failed", err);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }
}
