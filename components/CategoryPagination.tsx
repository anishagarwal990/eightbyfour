import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { categoryPageUrl } from "@/lib/categoryPagination";

// rel=prev/next link tags — rendered from a server component, Next hoists
// any <link>/<meta> it finds straight into <head>, no metadata API plumbing needed.
export function CategoryPaginationLinks({
  slug,
  page,
  totalPages,
  collection,
}: {
  slug: string;
  page: number;
  totalPages: number;
  collection: string | null;
}) {
  return (
    <>
      {page > 1 ? <link rel="prev" href={categoryPageUrl(slug, page - 1, collection)} /> : null}
      {page < totalPages ? <link rel="next" href={categoryPageUrl(slug, page + 1, collection)} /> : null}
    </>
  );
}

export function CategoryPagination({
  slug,
  page,
  totalPages,
  collection,
}: {
  slug: string;
  page: number;
  totalPages: number;
  collection: string | null;
}) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={categoryPageUrl(slug, page - 1, collection)} className={buttonClasses("secondary", "sm")} rel="prev">
          ← Previous
        </Link>
      ) : (
        <span className={buttonClasses("secondary", "sm", "opacity-40 pointer-events-none")}>← Previous</span>
      )}
      <span className="text-sm" style={{ color: "var(--line-strong)" }}>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={categoryPageUrl(slug, page + 1, collection)} className={buttonClasses("secondary", "sm")} rel="next">
          Next →
        </Link>
      ) : (
        <span className={buttonClasses("secondary", "sm", "opacity-40 pointer-events-none")}>Next →</span>
      )}
    </nav>
  );
}
