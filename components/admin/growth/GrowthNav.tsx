"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin/growth", label: "Overview" },
  { href: "/admin/growth/business-brain", label: "Business Brain" },
  { href: "/admin/growth/market-intelligence", label: "Market Intelligence" },
  { href: "/admin/growth/customer-intelligence", label: "Customer Intelligence" },
  { href: "/admin/growth/seo", label: "SEO / GEO" },
  { href: "/admin/growth/leads", label: "Lead Generation" },
  { href: "/admin/growth/social", label: "Social" },
  { href: "/admin/growth/creative", label: "Creative Studio" },
  { href: "/admin/growth/ads", label: "Meta Ads" },
  { href: "/admin/growth/cro", label: "Website CRO" },
  { href: "/admin/growth/studio", label: "Studio EightByFour" },
  { href: "/admin/growth/analytics", label: "Growth Analytics" },
] as const;

export function GrowthNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5 lg:w-56 lg:shrink-0">
      {NAV.map((item) => {
        const active = item.href === "/admin/growth" ? pathname === item.href : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className="px-3 py-1.5 text-sm transition-colors"
            style={{
              color: active ? "var(--burgundy)" : "var(--ink)",
              fontWeight: active ? 600 : 400,
              background: active ? "color-mix(in srgb, var(--burgundy) 8%, transparent)" : "transparent",
              borderRadius: "var(--radius-xs)",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
