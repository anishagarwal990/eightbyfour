import Link from "next/link";
import type { Metadata } from "next";
import { CATEGORIES } from "@/lib/categories";
import { buttonClasses } from "@/components/ui/Button";

// A dedicated 404 keeps a broken/removed URL from dead-ending the crawl or
// the visitor — it always returns a real 404 status (Next.js sets this
// automatically for not-found.tsx) and routes people back into the real
// catalogue instead of a blank error page.
export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex flex-col items-center px-7 py-24 text-center">
      <p className="tracked-caps text-xs" style={{ color: "var(--accent)" }}>
        404
      </p>
      <h1 className="serif mt-3" style={{ fontSize: "var(--fs-h1)" }}>
        We couldn&apos;t find that page
      </h1>
      <p className="mt-3 max-w-md" style={{ fontSize: "var(--fs-body)", lineHeight: "var(--lh-normal)", color: "var(--line-strong)" }}>
        The page you&apos;re looking for may have moved or no longer exists. Here are a few places to pick back up.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonClasses("primary")}>
          Back to Home
        </Link>
        <Link href="/products" className={buttonClasses("secondary")}>
          Browse Products
        </Link>
        <Link href="/brands" className={buttonClasses("secondary")}>
          Browse Brands
        </Link>
      </div>
      <div className="mt-10">
        <p className="tracked-caps text-xs" style={{ color: "var(--line-strong)" }}>
          Popular Categories
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {CATEGORIES.slice(0, 6).map((c) => (
            <Link
              key={c.slug}
              href={`/products/${c.slug}`}
              className="rounded-full px-3 py-1 text-sm hover:opacity-70"
              style={{ background: "var(--paper-dim)" }}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
