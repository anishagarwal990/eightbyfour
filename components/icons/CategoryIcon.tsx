interface IconProps {
  className?: string;
}

const STROKE = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function Base({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" className={className} aria-hidden="true" {...STROKE}>
      {children}
    </svg>
  );
}

// Stacked plank layers.
function PlywoodIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 7 L12 4 L21 7 L12 10 Z" />
      <path d="M3 12 L12 9 L21 12" />
      <path d="M3 17 L12 14 L21 17" />
    </Base>
  );
}

// Ring-grain plank.
function BirchIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="5" width="16" height="14" rx="1" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="12" r="1.4" />
    </Base>
  );
}

// Droplet with shield ring — boil/moisture resistance.
function BoilBoardIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 C9 8 6 11 6 14.5 A6 6 0 0 0 18 14.5 C18 11 15 8 12 3 Z" />
    </Base>
  );
}

// Uniform engineered panel.
function MdfIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="1" />
      <path d="M3.5 10.5 H20.5" />
      <path d="M3.5 14 H20.5" />
    </Base>
  );
}

// Laminate swatch stack.
function LaminateIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="6" y="3.5" width="13" height="13" rx="1" />
      <rect x="3.5" y="7.5" width="13" height="13" rx="1" style={{ fill: "var(--paper)" }} />
    </Base>
  );
}

// Countertop wave/edge.
function CorianIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M3 9 H21 V16 A2 2 0 0 1 19 18 H5 A2 2 0 0 1 3 16 Z" />
      <path d="M3 9 C5 6 8 6 10 9 C12 12 15 12 17 9 C18.5 7 20 7 21 9" />
    </Base>
  );
}

// Wood grain sheet.
function VeneerIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M4 8 C8 6 8 10 12 8 S16 10 20 8" />
      <path d="M4 13 C8 11 8 15 12 13 S16 15 20 13" />
      <path d="M4 18 C8 16 8 20 12 18" />
    </Base>
  );
}

// Layered stone slab.
function StoneIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 15 L9 6 L14 12 L17 8 L20 15 Z" />
      <path d="M3.5 18 H20.5" />
    </Base>
  );
}

// Adhesive drop.
function AdhesiveIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3 L15.5 9 A4 4 0 1 1 8.5 9 Z" />
    </Base>
  );
}

const ICONS: Record<string, (props: IconProps) => React.JSX.Element> = {
  plywood: PlywoodIcon,
  "birch-plywood": BirchIcon,
  "boil-boards": BoilBoardIcon,
  "mdf-and-hdhmr": MdfIcon,
  laminates: LaminateIcon,
  "corian-acrylic-solid-surface": CorianIcon,
  veneers: VeneerIcon,
  "stone-panels": StoneIcon,
  adhesive: AdhesiveIcon,
};

export function CategoryIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? PlywoodIcon;
  return <Icon className={className} />;
}
