import Link from "next/link";
import Image from "next/image";
import type { ProductRow } from "@/lib/supabase/types";
import { BrandLogo } from "@/components/BrandLogo";
import { CategoryTile, categoryMarkForDbCategory } from "@/components/CategoryMark";
import { resolvePrice, unitLabel } from "@/lib/pricing";
import { productDisplayName } from "@/lib/productDisplay";
import { AddToRequirementButton } from "@/components/AddToRequirementButton";

export function ProductCard({ product }: { product: ProductRow }) {
  const price = resolvePrice(product);
  const categoryMarkSlug = categoryMarkForDbCategory(product.category);
  return (
    // A stretched link rather than a wrapping <a>: the requirement toggle is a
    // real button, and a button nested inside an anchor is invalid markup that
    // browsers and screen readers both handle badly.
    <div
      className="group relative overflow-hidden transition-shadow duration-300 [transition-timing-function:var(--ease-out-soft)] hover:shadow-[var(--shadow-md)]"
      style={{ background: "var(--surface-secondary)", borderRadius: "var(--radius-xs)" }}
    >
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0 z-10"
        aria-label={productDisplayName(product)}
      />
      <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: "var(--card)" }}>
        {product.main_img_url ? (
          <Image
            src={product.main_img_url}
            alt={productDisplayName(product)}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-sm" style={{ color: "var(--line-strong)" }}>
            {product.brand}
          </div>
        )}
        {product.warranty ? (
          <div className="absolute left-2 top-2">
            <span
              className="px-2 py-0.5 text-right text-[10px] font-medium leading-tight"
              style={{ background: "rgba(255,255,255,0.92)", color: "var(--brand-primary)", borderRadius: "var(--radius-xs)" }}
            >
              {product.warranty}
            </span>
          </div>
        ) : null}
        <div className="absolute right-2 top-2 z-20">
          <AddToRequirementButton productId={product.id} productName={productDisplayName(product)} />
        </div>
      </div>
      <div className="p-3">
        {product.brand === "EightByFour" && categoryMarkSlug ? (
          <CategoryTile slug={categoryMarkSlug} size={24} />
        ) : (
          <BrandLogo brand={product.brand} height={16} />
        )}
        <h3 className="font-display mt-1 text-base leading-snug">{product.name}</h3>
        {product.sd_code ? (
          <p className="mt-0.5 text-xs font-medium" style={{ color: "var(--burgundy)" }}>
            Code: {product.sd_code}
          </p>
        ) : null}
        {product.size ? (
          <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
            {product.size}
          </p>
        ) : null}
        {price ? (
          <p className="mt-1 text-xs font-medium" style={{ color: "var(--burgundy)" }}>
            {price.kind === "range" ? (
              <>
                From ₹{price.min} – ₹{price.max}/{unitLabel(price.unit)}
              </>
            ) : (
              <>
                From ₹{price.amount}/{unitLabel(price.unit)}
              </>
            )}
          </p>
        ) : null}
      </div>
    </div>
  );
}
