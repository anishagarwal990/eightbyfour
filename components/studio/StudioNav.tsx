"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { STUDIO_SERVICES } from "@/lib/studio/services";

/**
 * The Studio's own nav bar, sitting under the master EightByFour header. It
 * does two jobs: move between services, and make it obvious at all times that
 * you are inside a branded environment you can step back out of — hence the
 * permanent "Shop materials" return on the right rather than only in the
 * footer.
 */
export function StudioNav() {
  const pathname = usePathname();

  return (
    // Deliberately not sticky. The master header is fixed and re-expands on
    // scroll-up, so a second pinned bar underneath it either gets covered or
    // has to chase the header's changing height every frame. The element that
    // genuinely needs to persist on these pages is the price, and the quote
    // panel and mobile price bar already do that.
    <div className="border-b" style={{ borderColor: "var(--studio-line)", background: "var(--stone)" }}>
      <div className="mx-auto flex max-w-[1280px] items-center gap-4 px-4 sm:px-7">
        <Link href="/studio" className="group flex shrink-0 items-center gap-2 py-2.5">
          <span
            className="metric flex h-6 items-center rounded-[2px] px-1.5 text-[11px] text-white"
            style={{ background: "var(--burgundy)" }}
          >
            8×4
          </span>
          <span className="serif text-[14px] leading-none">
            Studio<span style={{ color: "var(--ink-faint)" }}> EightxFour</span>
          </span>
        </Link>

        <nav className="option-rail flex-1 py-2" aria-label="Studio services">
          {STUDIO_SERVICES.map((s) => {
            const href = `/studio/${s.slug}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={s.slug}
                href={href}
                className="relative shrink-0 whitespace-nowrap px-2 py-1 text-[12.5px] transition-colors hover:text-[var(--burgundy)]"
                style={{ color: active ? "var(--burgundy)" : "var(--ink-soft)", fontWeight: active ? 600 : 400 }}
              >
                {s.navLabel}
                {active ? (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-2 -bottom-[9px] h-[2px]"
                    style={{ background: "var(--burgundy)" }}
                  />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <Link
          href="/products"
          className="hidden shrink-0 items-center gap-1.5 border-l py-2.5 pl-4 text-[12.5px] transition-colors hover:text-[var(--burgundy)] lg:flex"
          style={{ borderColor: "var(--studio-line)", color: "var(--ink-soft)" }}
        >
          <span aria-hidden="true">←</span> Shop materials
        </Link>
      </div>
    </div>
  );
}
