import type { ButtonHTMLAttributes, CSSProperties } from "react";

export type ButtonVariant = "primary" | "secondary" | "chip";
export type ButtonSize = "md" | "sm";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-[transform,box-shadow,background-color,border-color,color] duration-150 [transition-timing-function:var(--ease-out-soft)] cursor-pointer select-none active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none disabled:hover:translate-y-0 disabled:hover:shadow-none";

const SIZES: Record<ButtonSize, string> = {
  md: "px-5 py-2.5",
  sm: "px-3.5 py-1.5",
};

const COLORS: Record<ButtonVariant, string> = {
  primary: "text-white bg-[var(--burgundy)] shadow-[var(--shadow-sm)] hover:bg-[var(--burgundy-dark)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-md)]",
  secondary:
    "border border-[var(--line)] text-[var(--ink)] bg-transparent hover:border-[var(--burgundy)] hover:text-[var(--burgundy)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]",
  chip: "border hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)]",
};

/** Shared class builder — use directly on non-<button> elements (e.g. next/link CTAs). */
export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string): string {
  return [BASE, SIZES[size], COLORS[variant], extra].filter(Boolean).join(" ");
}

export function chipStyle(active: boolean): CSSProperties {
  return active
    ? { borderColor: "var(--burgundy)", background: "var(--burgundy)", color: "#fff" }
    : { borderColor: "var(--line)", background: "var(--paper)", color: "var(--ink)" };
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
