import type { ButtonHTMLAttributes, CSSProperties } from "react";

export type ButtonVariant = "primary" | "secondary" | "secondary-inverse" | "chip";
export type ButtonSize = "md" | "sm";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-xs)] text-sm font-medium whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color] duration-150 [transition-timing-function:var(--ease-out-soft)] cursor-pointer select-none active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:shadow-none";

const SIZES: Record<ButtonSize, string> = {
  md: "px-5 py-3",
  sm: "px-3.5 py-1.5",
};

// No lift-on-hover: a button that jumps a half-pixel under the cursor is UI
// decoration. State reads through colour and border weight instead, which
// survives reduced-motion and reads as deliberate rather than springy.
const COLORS: Record<ButtonVariant, string> = {
  primary:
    "text-[var(--brand-on-primary)] bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)]",
  secondary:
    "border border-[var(--border-strong)] text-[var(--text-primary)] bg-transparent hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]",
  // For the dark sections — the same button, inverted, rather than a
  // one-off inline style at the two places that need it.
  "secondary-inverse":
    "border border-white/35 text-[var(--text-on-inverse)] bg-transparent hover:border-white hover:bg-white/10",
  chip: "",
};

/** Shared class builder — use directly on non-<button> elements (e.g. next/link CTAs). */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string): string {
  return [BASE, SIZES[size], COLORS[variant], extra].filter(Boolean).join(" ");
}

export function chipStyle(active: boolean): CSSProperties {
  return active
    ? {
        background: "color-mix(in srgb, var(--burgundy) 12%, var(--paper))",
        color: "var(--burgundy)",
        fontWeight: 600,
        boxShadow: "inset 0 0 0 1.5px var(--brand-primary)",
      }
    : { background: "var(--surface-secondary)", color: "var(--text-primary)" };
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Only meaningful for variant="chip" — toggled selection state. */
  active?: boolean;
}

export function Button({ variant = "primary", size = "md", active, className, style, ...props }: ButtonProps) {
  return (
    <button
      className={[buttonClasses(variant, size), className].filter(Boolean).join(" ")}
      style={variant === "chip" ? { ...chipStyle(!!active), ...style } : style}
      {...props}
    />
  );
}
