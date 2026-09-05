import type { ReactNode } from "react";
import Link from "next/link";
import type { GrowthConfidence, GrowthPriority } from "@/lib/growth/types";

// Admin-specific primitives for the Growth Command Center — deliberately NOT
// components/ui/Button.tsx or Card.tsx, which are the storefront's
// rounded-full, hover-lift pieces. This brief asked for a "premium
// procurement terminal": rectangular (--radius-xs, "architectural rather
// than app-store" per globals.css), restrained borders, minimal shadow,
// dense tabular layout. Same design tokens as the rest of the site, a
// different shape language for a different surface.

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`border ${className}`}
      style={{ borderColor: "var(--line)", background: "var(--paper)", borderRadius: "var(--radius-xs)" }}
    >
      {children}
    </div>
  );
}

export function PanelHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b px-4 py-3" style={{ borderColor: "var(--line)" }}>
      <h2 className="serif" style={{ fontSize: "var(--fs-h3)" }}>
        {title}
      </h2>
      {action}
    </div>
  );
}

export function GrowthButton({
  children,
  variant = "primary",
  ...props
}: { children: ReactNode; variant?: "primary" | "secondary" } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const base = "px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";
  const style =
    variant === "primary"
      ? { background: "var(--burgundy)", color: "#fff", borderRadius: "var(--radius-xs)" }
      : { border: "1px solid var(--line)", color: "var(--ink)", borderRadius: "var(--radius-xs)", background: "transparent" };
  return (
    <button className={base} style={style} {...props}>
      {children}
    </button>
  );
}

const PRIORITY_COLOR: Record<GrowthPriority, string> = { high: "#9E3B2F", medium: "#B4652F", low: "var(--line-strong)" };

export function PriorityTag({ priority }: { priority: GrowthPriority | null }) {
  if (!priority) return <span style={{ color: "var(--line-strong)" }}>—</span>;
  return (
    <span
      className="text-xs font-semibold uppercase tracking-wide"
      style={{ color: PRIORITY_COLOR[priority], fontFamily: "var(--font-body)" }}
    >
      {priority}
    </span>
  );
}

const CONFIDENCE_LABEL: Record<GrowthConfidence, string> = { observed: "OBSERVED", inferred: "INFERRED", hypothesis: "HYPOTHESIS" };
const CONFIDENCE_STYLE: Record<GrowthConfidence, { bg: string; fg: string }> = {
  observed: { bg: "color-mix(in srgb, var(--burgundy) 10%, transparent)", fg: "var(--burgundy)" },
  inferred: { bg: "var(--paper-dim)", fg: "var(--ink)" },
  hypothesis: { bg: "transparent", fg: "var(--line-strong)" },
};

/** Distinguishes fact from guess wherever intelligence is shown — never decorative. */
export function ConfidenceTag({ confidence }: { confidence: GrowthConfidence | null }) {
  if (!confidence) return null;
  const s = CONFIDENCE_STYLE[confidence];
  return (
    <span
      className="inline-block px-1.5 py-0.5 text-[10px] font-semibold tracking-wider"
      style={{ background: s.bg, color: s.fg, borderRadius: "var(--radius-xs)" }}
    >
      {CONFIDENCE_LABEL[confidence]}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const done = ["done", "published", "won", "completed", "resolved"].includes(status.toLowerCase());
  const dead = ["lost", "failed", "rejected"].includes(status.toLowerCase());
  const color = done ? "#2F6B4B" : dead ? "var(--line-strong)" : "var(--burgundy)";
  return (
    <span className="text-xs font-medium" style={{ color }}>
      ● {status}
    </span>
  );
}

/** Every empty state names the next concrete action — never a bare "No data." */
export function EmptyState({ title, body, actionLabel, actionHref }: { title: string; body: string; actionLabel?: string; actionHref?: string }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="serif" style={{ fontSize: "var(--fs-h3)" }}>
        {title}
      </p>
      <p className="mx-auto mt-2 max-w-md text-sm" style={{ color: "var(--line-strong)" }}>
        {body}
      </p>
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-block px-3.5 py-1.5 text-sm font-medium text-white"
          style={{ background: "var(--burgundy)", borderRadius: "var(--radius-xs)" }}
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function DataSourceCard({ label, status, notes }: { label: string; status: "connected" | "not_connected" | "error"; notes: string | null }) {
  const dot = status === "connected" ? "#2F6B4B" : status === "error" ? "#9E3B2F" : "var(--line-strong)";
  const text = status === "connected" ? "Connected" : status === "error" ? "Error" : "Not connected";
  return (
    <div className="flex flex-col gap-1 border-b px-4 py-3 last:border-b-0" style={{ borderColor: "var(--line)" }}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">{label}</span>
        <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: dot }}>
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: dot }} />
          {text}
        </span>
      </div>
      {notes ? (
        <p className="text-xs" style={{ color: "var(--line-strong)" }}>
          {notes}
        </p>
      ) : null}
    </div>
  );
}

export function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="border-r px-4 py-3 last:border-r-0" style={{ borderColor: "var(--line)" }}>
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--line-strong)" }}>
        {label}
      </div>
      <div className="serif mt-1" style={{ fontSize: "var(--fs-h2)" }}>
        {value}
      </div>
      {sub ? (
        <div className="text-xs" style={{ color: "var(--line-strong)" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

/** "Data source not connected" — used instead of ever fabricating a KPI. */
export function NotConnected({ label }: { label: string }) {
  return (
    <div className="border-r px-4 py-3 last:border-r-0" style={{ borderColor: "var(--line)" }}>
      <div className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--line-strong)" }}>
        {label}
      </div>
      <div className="serif mt-1" style={{ fontSize: "var(--fs-h3)", color: "var(--line-strong)" }}>
        Not connected
      </div>
    </div>
  );
}
