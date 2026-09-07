import { type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-server";
import { getCustomerQuote } from "@/lib/data/quotes";
import { pdfFileName } from "@/lib/customer-quote";
import { renderQuotePdf } from "@/lib/pdf/render";
import { isUuid } from "@/lib/uuid";

// Node runtime — @react-pdf/renderer is not edge-compatible.
export const runtime = "nodejs";

/**
 * Customer quotation PDF, generated server-side from the frozen quote-version
 * snapshot. Admin-only. Nothing internal (cost, supplier, rate_book_id,
 * override flags, audit, created_by) reaches the DTO the PDF is built from.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (!check.ok) return new Response("Forbidden", { status: 403 });

  const { id } = await params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });

  const v = request.nextUrl.searchParams.get("v");
  const versionNo = v ? Number.parseInt(v, 10) || undefined : undefined;

  const result = await getCustomerQuote(id, versionNo);
  if (!result) return new Response("Not found", { status: 404 });

  const bytes = await renderQuotePdf(result.dto);
  // ?inline=1 opens it in the browser's viewer; default downloads it.
  const inline = request.nextUrl.searchParams.get("inline") === "1";
  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${pdfFileName(result.dto)}"`,
      "Cache-Control": "no-store",
    },
  });
}
