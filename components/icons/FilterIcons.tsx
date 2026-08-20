import type { CSSProperties } from "react";

export type IconProps = { className?: string; style?: CSSProperties };

function iconProps({ className, style }: IconProps) {
  return {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className,
    style,
  };
}

// Grade — structural rating, represented as a shield.
export function GradeIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M12 3 4.5 6v6c0 4.4 3.2 7.6 7.5 9 4.3-1.4 7.5-4.6 7.5-9V6L12 3Z" />
    </svg>
  );
}

// Warranty — coverage duration, represented as a clock.
export function WarrantyIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

// Certification — official compliance, represented as a seal/badge.
export function CertificationIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx="12" cy="9.5" r="6" />
      <path d="m8.5 14.5-1.3 6 4.8-2.3 4.8 2.3-1.3-6" />
    </svg>
  );
}

export function FunnelIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} width={12} height={12} strokeWidth={2.75}>
      <path d="M4 12.5 9 17.5 20 6.5" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} width={12} height={12} strokeWidth={2.5}>
      <path d="M6 6 18 18" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

// Empty state — open crate, keeps the "no stock matches" message on-theme
// for a building-materials catalogue instead of a generic search icon.
export function EmptyCrateIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} width={32} height={32} strokeWidth={1.5}>
      <path d="M3 9.5 12 5l9 4.5-9 4.5-9-4.5Z" />
      <path d="M3 9.5V17l9 4.5 9-4.5V9.5" />
      <path d="M12 14v7.5" />
    </svg>
  );
}
