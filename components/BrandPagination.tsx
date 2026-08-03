import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { brandPagePath } from "@/lib/brandPagination";

export function BrandPaginationLinks({ slug, page, totalPages }: { slug: string; page: number; totalPages: number }) {
  return (
    <>
      {page > 1 ? <link rel="prev" href={brandPagePath(slug, page - 1)} /> : null}
      {page < totalPages ? <link rel="next" href={brandPagePath(slug, page + 1)} /> : null}
    </>
  );
}

export function BrandPagination({ slug, page, totalPages }: { slug: string; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-4">
      {page > 1 ? (
        <Link href={brandPagePath(slug, page - 1)} className={buttonClasses("secondary", "sm")} rel="prev">
          ← Previous
        </Link>
      ) : (
        <span className={buttonClasses("secondary", "sm", "opacity-40 pointer-events-none")}>← Previous</span>
      )}
      <span className="text-sm" style={{ color: "var(--line-strong)" }}>
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={brandPagePath(slug, page + 1)} className={buttonClasses("secondary", "sm")} rel="next">
          Next →
        </Link>
      ) : (
        <span className={buttonClasses("secondary", "sm", "opacity-40 pointer-events-none")}>Next →</span>
      )}
    </nav>
  );
}
