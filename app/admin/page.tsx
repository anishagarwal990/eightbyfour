import Link from "next/link";
import { listAdminProducts, getAdminFacets, ADMIN_PAGE_SIZE } from "@/lib/data/adminProducts";
import { resolvePrice, unitLabel } from "@/lib/pricing";
import { productDisplayName } from "@/lib/productDisplay";
import { AdminFilters } from "@/components/admin/AdminFilters";

type SearchParams = { q?: string; category?: string; brand?: string; filter?: string; page?: string };

const FILTERS = new Set(["all", "unpriced", "no-rates", "no-description"]);

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const filter = (FILTERS.has(params.filter ?? "") ? params.filter : "all") as "all" | "unpriced" | "no-rates" | "no-description";
  const page = Number.parseInt(params.page ?? "1", 10) || 1;

  const [{ products, total, totalPages }, facets] = await Promise.all([
    listAdminProducts({ search: params.q, category: params.category, brand: params.brand, filter, page }),
    getAdminFacets(),
  ]);

  const query = new URLSearchParams();
  if (params.q) query.set("q", params.q);
  if (params.category) query.set("category", params.category);
  if (params.brand) query.set("brand", params.brand);
  if (filter !== "all") query.set("filter", filter);
  const pageHref = (n: number) => {
    const next = new URLSearchParams(query);
    if (n > 1) next.set("page", String(n));
    return `/admin?${next.toString()}`;
  };

  return (
    <main className="px-6 py-6">
      <AdminFilters categories={facets.categories} brands={facets.brands} current={{ ...params, filter }} />

      <p className="mt-4 text-xs" style={{ color: "var(--line-strong)" }}>
        {total} product{total === 1 ? "" : "s"}
        {totalPages > 1 ? ` · page ${page} of ${totalPages}` : ""}
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--line)" }}>
              <th className="px-3 py-2 text-left font-medium">Product</th>
              <th className="px-3 py-2 text-left font-medium">Category</th>
              <th className="px-3 py-2 text-left font-medium">Grade</th>
              <th className="px-3 py-2 text-left font-medium">Band</th>
              <th className="px-3 py-2 text-left font-medium">Per-thickness rates</th>
              <th className="px-3 py-2 text-left font-medium">Description</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const price = resolvePrice(product);
              return (
                <tr key={product.slug} style={{ borderBottom: "1px solid var(--line)" }}>
                  <td className="px-3 py-2">
                    <Link href={`/admin/products/${product.slug}`} className="font-medium hover:opacity-70">
                      {productDisplayName(product)}
                    </Link>
                    {product.sd_code ? (
                      <span className="ml-2 text-xs" style={{ color: "var(--line-strong)" }}>
                        {product.sd_code}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--line-strong)" }}>
                    {product.category}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--line-strong)" }}>
                    {product.grade ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {price ? (
                      <span style={{ color: "var(--burgundy)" }}>
                        {price.kind === "range" ? `₹${price.min}–₹${price.max}` : `₹${price.amount}`}/{unitLabel(price.unit)}
                      </span>
                    ) : (
                      <span style={{ color: "var(--line-strong)" }}>none</span>
                    )}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--line-strong)" }}>
                    {product.variants ? "yes" : "—"}
                  </td>
                  <td className="px-3 py-2" style={{ color: "var(--line-strong)" }}>
                    {product.description ? "yes" : "—"}
                  </td>
                </tr>
              );
            })}
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center" style={{ color: "var(--line-strong)" }}>
                  Nothing matches those filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="hover:opacity-70">
              ← Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="hover:opacity-70">
              Next →
            </Link>
          ) : null}
          <span className="text-xs" style={{ color: "var(--line-strong)" }}>
            {ADMIN_PAGE_SIZE} per page
          </span>
        </div>
      ) : null}
    </main>
  );
}
