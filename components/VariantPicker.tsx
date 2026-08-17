"use client";

import { Button } from "@/components/ui/Button";
import type { ProductVariants, VariantCore, VariantSize } from "@/lib/pricing";

export function VariantPicker({
  variants,
  coreKey,
  sizeKey,
  thicknessKey,
  onChange,
}: {
  variants: ProductVariants;
  coreKey: string;
  sizeKey: string;
  thicknessKey: string;
  onChange: (next: { coreKey: string; sizeKey: string; thicknessKey: string }) => void;
}) {
  const core = variants.cores.find((c) => c.key === coreKey) ?? variants.cores[0];
  const size = core.sizes.find((s) => s.key === sizeKey) ?? core.sizes[0];

  function selectCore(next: VariantCore) {
    const nextSize = next.sizes[0];
    onChange({ coreKey: next.key, sizeKey: nextSize.key, thicknessKey: nextSize.thicknesses[0].key });
  }

  function selectSize(next: VariantSize) {
    onChange({ coreKey: core.key, sizeKey: next.key, thicknessKey: next.thicknesses[0].key });
  }

  function selectThickness(key: string) {
    onChange({ coreKey: core.key, sizeKey: size.key, thicknessKey: key });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-xs tracked-caps" style={{ color: "var(--line-strong)" }}>
          Core
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {variants.cores.map((c) => (
            <Button
              key={c.key}
              type="button"
              variant="chip"
              size="sm"
              active={c.key === core.key}
              aria-pressed={c.key === core.key}
              className="normal-case tracking-normal"
              onClick={() => selectCore(c)}
            >
              {c.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs tracked-caps" style={{ color: "var(--line-strong)" }}>
          Size
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {core.sizes.map((s) => (
            <Button
              key={s.key}
              type="button"
              variant="chip"
              size="sm"
              active={s.key === size.key}
              aria-pressed={s.key === size.key}
              className="normal-case tracking-normal"
              onClick={() => selectSize(s)}
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs tracked-caps" style={{ color: "var(--line-strong)" }}>
          Thickness
        </p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {size.thicknesses.map((t) => (
            <Button
              key={t.key}
              type="button"
              variant="chip"
              size="sm"
              active={t.key === thicknessKey}
              aria-pressed={t.key === thicknessKey}
              className="normal-case tracking-normal"
              onClick={() => selectThickness(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
