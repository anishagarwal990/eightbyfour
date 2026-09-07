import { statusLabel, statusTone } from "@/lib/enquiry";

const TONE_STYLE: Record<ReturnType<typeof statusTone>, { background: string; color: string }> = {
  open: { background: "color-mix(in srgb, var(--burgundy) 12%, var(--paper))", color: "var(--burgundy)" },
  won: { background: "color-mix(in srgb, #1a7f4b 14%, var(--paper))", color: "#136138" },
  lost: { background: "var(--card)", color: "var(--line-strong)" },
  idle: { background: "var(--card)", color: "var(--line-strong)" },
};

export function StatusPill({ status }: { status: string | null | undefined }) {
  return (
    <span
      className="inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={TONE_STYLE[statusTone(status)]}
    >
      {statusLabel(status)}
    </span>
  );
}
