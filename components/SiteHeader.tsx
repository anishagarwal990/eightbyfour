"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SearchBar } from "@/components/SearchBar";
import { RequestQuoteButton } from "@/components/RequestQuoteButton";

const NAV_LINKS = [
  { href: "/products", label: "Products" },
  { href: "/brands", label: "Brands" },
  { href: "/applications", label: "Applications" },
  { href: "/guides", label: "Guides" },
  { href: "/comparisons", label: "Comparisons" },
  { href: "/hyderabad", label: "Serving Hyderabad" },
];

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link href={href} className="group relative py-1 transition-colors duration-200 hover:text-[var(--burgundy)]">
      {label}
      <span
        aria-hidden="true"
        className={`absolute -bottom-0.5 left-0 h-[1.5px] w-full origin-left transition-transform duration-300 [transition-timing-function:var(--ease-out-soft)] ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
        style={{ background: "var(--burgundy)" }}
      />
    </Link>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky z-20 flex flex-wrap items-center gap-5 border-b-2 px-7 transition-[padding,background-color,border-color,box-shadow] duration-300 [transition-timing-function:var(--ease-out-soft)] ${
        scrolled ? "border-b py-2 shadow-[var(--shadow-sm)] backdrop-blur-md" : "py-3.5"
      }`}
      style={{
        top: "var(--sku-ribbon-h)",
        borderColor: scrolled ? "var(--line-strong)" : "var(--ink)",
        background: scrolled ? "rgba(255,255,255,0.72)" : "var(--paper)",
      }}
    >
      <Link href="/" className="leading-tight">
        <span className="serif block" style={{ fontSize: "26px", fontWeight: 900, letterSpacing: "-0.5px" }}>
          EIGHT<span style={{ color: "var(--accent)" }}>×</span>FOUR
        </span>
        <span className="tracked-caps block text-[10px]" style={{ color: "var(--line-strong)" }}>
          Base to Surface
        </span>
      </Link>
      <nav className="flex flex-wrap items-center gap-5 text-sm" aria-label="Primary">
        {NAV_LINKS.map((link) => (
          <NavLink key={link.href} href={link.href} label={link.label} active={pathname?.startsWith(link.href) ?? false} />
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-3">
        <SearchBar />
        <RequestQuoteButton />
      </div>
    </header>
  );
}
