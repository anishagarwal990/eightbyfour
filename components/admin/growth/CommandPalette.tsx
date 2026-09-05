"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction } from "@/app/admin/growth/actions";
import type { GrowthModule, GrowthTaskType } from "@/lib/growth/types";

interface Command {
  label: string;
  hint: string;
  run: () => void | Promise<void>;
}

// Routes to the right module. Where the brief's example commands imply
// research/generation ("Research Plywala", "Generate next week's LinkedIn
// posts"), this queues a real growth_tasks row with a structured prompt and
// lands the admin on the module that will review it — it does not pretend to
// call an unavailable agent. See growth_tasks.status: nothing here ever
// flips itself to "completed".
function queueAndGo(router: ReturnType<typeof useRouter>, module: GrowthModule, type: GrowthTaskType, title: string, prompt: string) {
  return async () => {
    await createTaskAction({ type, title, module, input: { prompt } });
    router.push(`/admin/growth/${module.replace(/_/g, "-")}`);
  };
}

function buildCommands(router: ReturnType<typeof useRouter>): Command[] {
  return [
    { label: "Go to Overview", hint: "nav", run: () => router.push("/admin/growth") },
    { label: "Go to Business Brain", hint: "nav", run: () => router.push("/admin/growth/business-brain") },
    { label: "Go to Market Intelligence", hint: "nav", run: () => router.push("/admin/growth/market-intelligence") },
    { label: "Go to Customer Intelligence", hint: "nav", run: () => router.push("/admin/growth/customer-intelligence") },
    { label: "Go to SEO / GEO", hint: "nav", run: () => router.push("/admin/growth/seo") },
    { label: "Go to Lead Generation", hint: "nav", run: () => router.push("/admin/growth/leads") },
    { label: "Go to Social", hint: "nav", run: () => router.push("/admin/growth/social") },
    { label: "Go to Creative Studio", hint: "nav", run: () => router.push("/admin/growth/creative") },
    { label: "Go to Meta Ads", hint: "nav", run: () => router.push("/admin/growth/ads") },
    { label: "Go to Website CRO", hint: "nav", run: () => router.push("/admin/growth/cro") },
    { label: "Go to Studio EightByFour", hint: "nav", run: () => router.push("/admin/growth/studio") },
    { label: "Go to Growth Analytics", hint: "nav", run: () => router.push("/admin/growth/analytics") },
    {
      label: "Find SEO opportunities",
      hint: "queues a task",
      run: queueAndGo(router, "seo", "SEO_RESEARCH", "Find SEO opportunities", "Review category-page gap list and identify the next 3 price/content pages worth building."),
    },
    {
      label: "Audit homepage CRO",
      hint: "queues a task",
      run: queueAndGo(router, "cro", "CRO_AUDIT", "Audit homepage CRO", "Review homepage entry rate, scroll depth and CTA clicks once GA4 reporting is connected; note structural issues visible today."),
    },
    {
      label: "Review Studio funnel",
      hint: "queues a task",
      run: queueAndGo(router, "studio", "STUDIO_ANALYSIS", "Review Studio EightByFour funnel", "Check estimator start/completion and quote-request conversion for each Studio service."),
    },
    {
      label: "Find contractors to prospect",
      hint: "queues a task",
      run: queueAndGo(router, "leads", "PROSPECT_RESEARCH", "Find contractors to prospect", "Identify turnkey/design-build contractors executing projects in Hyderabad without a known local material supplier."),
    },
  ];
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs"
        style={{ color: "var(--line-strong)", border: "1px solid var(--line)", borderRadius: "var(--radius-xs)", padding: "4px 10px" }}
      >
        Commands <kbd className="ml-1 font-mono">⌘K</kbd>
      </button>
    );
  }

  const commands = buildCommands(router).filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24" style={{ background: "rgba(18,18,18,0.4)" }} onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-lg border"
        style={{ background: "var(--paper)", borderColor: "var(--line)", borderRadius: "var(--radius-xs)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command…"
          className="w-full border-b px-4 py-3 text-sm outline-none"
          style={{ borderColor: "var(--line)", background: "transparent" }}
        />
        <div className="max-h-80 overflow-y-auto py-1">
          {commands.length === 0 ? (
            <p className="px-4 py-3 text-sm" style={{ color: "var(--line-strong)" }}>
              No matching command.
            </p>
          ) : (
            commands.map((c) => (
              <button
                key={c.label}
                disabled={isPending}
                onClick={() => {
                  startTransition(async () => {
                    await c.run();
                    setOpen(false);
                    setQuery("");
                  });
                }}
                className="flex w-full items-center justify-between px-4 py-2 text-left text-sm hover:bg-[var(--paper-dim)] disabled:opacity-50"
              >
                <span>{c.label}</span>
                <span className="text-xs" style={{ color: "var(--line-strong)" }}>
                  {c.hint}
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
