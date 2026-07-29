import { BRAND_LOGOS } from "@/lib/brandLogos";

// Renders the brand's logo image where we have one, falling back to the
// tracked-caps brand name text (existing style) when we don't.
export function BrandLogo({
  brand,
  height = 16,
  textClassName = "tracked-caps text-xs",
  textStyle,
}: {
  brand: string;
  height?: number;
  textClassName?: string;
  textStyle?: React.CSSProperties;
}) {
  const logoUrl = BRAND_LOGOS[brand];
  if (!logoUrl) {
    return (
      <p className={textClassName} style={{ color: "var(--accent)", ...textStyle }}>
        {brand}
      </p>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={`${brand} logo`} className="w-auto object-contain object-left" style={{ height }} />
  );
}
