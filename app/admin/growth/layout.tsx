import type { ReactNode } from "react";
import { GrowthNav } from "@/components/admin/growth/GrowthNav";
import { CommandPalette } from "@/components/admin/growth/CommandPalette";

// Auth is already enforced by app/admin/layout.tsx (requireAdmin(), see
// docs/ADMIN.md) — this nests inside it, so no new auth check is added here.
//
// Known limitation, inherited from /admin generally: this still renders
// inside the public site's SiteHeader/SiteFooter/SkuRibbon, since
// app/layout.tsx is the only root layout and there is no app/(admin) route
// group yet (docs/ADMIN.md already flags this as "not built yet" — not
// re-fixed here, per the brief's own "don't replace working systems"
// instruction).
export default function GrowthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-7xl px-6 py-8" style={{ background: "var(--paper)" }}>
      <div className="mb-6 flex items-center justify-between gap-4 border-b pb-4" style={{ borderColor: "var(--line)" }}>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--line-strong)" }}>
            EightByFour · internal
          </p>
          <h1 className="serif" style={{ fontSize: "var(--fs-h1)" }}>
            Growth Command Center
          </h1>
        </div>
        <CommandPalette />
      </div>
      <div className="flex flex-col gap-8 lg:flex-row">
        <GrowthNav />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
