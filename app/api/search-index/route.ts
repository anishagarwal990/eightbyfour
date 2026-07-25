import { NextResponse } from "next/server";
import { buildSearchIndex } from "@/lib/search-index";

export async function GET() {
  const index = await buildSearchIndex();
  return NextResponse.json(index, {
    headers: { "Cache-Control": "public, max-age=300, stale-while-revalidate=3600" },
  });
}
