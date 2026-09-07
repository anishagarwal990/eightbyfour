"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  /** Reserved for a later slice — rendered, but inert and visibly muted. */
  soon?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// The sections a later slice fills in are listed now rather than appearing
// later, so the shape of the console is legible from day one — but they are
// inert, not links to a 404.
const SECTIONS: NavSection[] = [
  {
    title: "Operations",
    items: [
      { label: "Enquiries", href: "/admin/enquiries" },
      { label: "Quotes", href: "/admin/quotes" },
      { label: "Orders", href: "/admin/orders", soon: true },
    ],
  },
  {
    title: "Catalogue",
    items: [
      { label: "Products", href: "/admin" },
      { label: "Rate Book", href: "/admin/rates" },
    ],
  },
];

/** /admin is the catalogue index, so it only counts as active on an exact match. */
function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  return (
    <nav aria-label="Admin sections" className="flex flex-col gap-5">
      {SECTIONS.map((section) => (
        <div key={section.title}>
          <p className="tracked-caps px-2 text-[10px]" style={{ color: "var(--line-strong)" }}>
            {section.title}
          </p>
          <ul className="mt-1.5 flex flex-col">
            {section.items.map((item) => {
              if (item.soon) {
                return (
                  <li key={item.label}>
                    <span
                      aria-disabled="true"
                      className="flex cursor-default items-center justify-between rounded px-2 py-1.5 text-sm"
                      style={{ color: "var(--line-strong)", opacity: 0.55 }}
                    >
                      {item.label}
                      <span className="text-[9px] uppercase tracking-wide">Soon</span>
                    </span>
                  </li>
                );
              }
              const active = isActive(pathname, item.href);
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className="block rounded px-2 py-1.5 text-sm transition-colors"
                    style={
                      active
                        ? { background: "var(--card)", color: "var(--burgundy)", fontWeight: 600 }
                        : { color: "var(--ink)" }
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Desktop rail. Lives in the layout's body row, beside the page content. */
export function AdminSidebar() {
  return (
    <aside
      className="hidden w-[168px] shrink-0 border-r px-3 py-4 lg:block"
      style={{ borderColor: "var(--line)", background: "var(--paper)" }}
    >
      <div className="sticky top-4">
        <NavLinks />
        <Link href="/" className="mt-6 block px-2 text-xs hover:underline" style={{ color: "var(--line-strong)" }}>
          View site →
        </Link>
      </div>
    </aside>
  );
}

/**
 * The same list behind a disclosure on small screens. Lives in the header, and
 * the panel is absolutely positioned against it — deliberately not a full
 * modal drawer with a focus trap, which would be more machinery than a
 * five-item nav warrants.
 */
export function AdminMobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="admin-mobile-nav"
        className="rounded border px-2 py-1 text-xs"
        style={{ borderColor: "var(--line)" }}
      >
        {open ? "Close" : "Menu"}
      </button>
      {open ? (
        <div
          id="admin-mobile-nav"
          className="absolute left-0 right-0 top-full z-30 border-b px-4 py-4 shadow-[var(--shadow-md)]"
          style={{ borderColor: "var(--line)", background: "var(--paper)" }}
        >
          <NavLinks onNavigate={() => setOpen(false)} />
          <Link href="/" className="mt-5 block text-xs hover:underline" style={{ color: "var(--line-strong)" }}>
            View site →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
