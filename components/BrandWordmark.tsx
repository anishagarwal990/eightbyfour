export function BrandWordmark({ size = 28 }: { size?: number }) {
  return (
    <span className="serif inline-flex items-baseline" style={{ fontSize: size, fontWeight: 600, letterSpacing: "-0.02em" }}>
      EIGHT
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          fontWeight: 400,
          fontSize: "1.05em",
          color: "var(--accent)",
          letterSpacing: "normal",
          margin: "0 0.03em",
          transform: "translateY(-0.03em)",
        }}
      >
        ×
      </span>
      FOUR
    </span>
  );
}
