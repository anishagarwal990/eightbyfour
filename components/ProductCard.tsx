import Link from "next/link";
import Image from "next/image";
import type { ProductRow } from "@/lib/supabase/types";
import { BrandLogo } from "@/components/BrandLogo";

export function ProductCard({ product }: { product: ProductRow }) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative block overflow-hidden rounded-md transition-[transform,box-shadow] duration-300 [transition-timing-function:var(--ease-out-soft)] hover:-translate-y-1 hover:shadow-[var(--shadow-lg)]"
      style={{ background: "var(--card)" }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden" style={{ background: "var(--card)" }}>
        {product.main_img_url ? (
          <Image
            src={product.main_img_url}
            alt={`${product.brand} ${product.name}`}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 [transition-timing-function:var(--ease-out-soft)] group-hover:scale-[1.06]"
          />
        ) : (
          <div className="flex h-full items-center justify-center serif text-sm" style={{ color: "var(--line-strong)" }}>
            {product.brand}
          </div>
        )}
      </div>
      <div className="p-3">
        <BrandLogo brand={product.brand} height={16} />
        <h3 className="serif mt-1 text-base leading-snug">{product.name}</h3>
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
        <p
          className="mt-2 translate-y-1 text-xs font-medium opacity-0 transition-[transform,opacity] duration-300 [transition-timing-function:var(--ease-out-soft)] group-hover:translate-y-0 group-hover:opacity-100"
          style={{ color: "var(--burgundy)" }}
        >
          View details →
        </p>
      </div>
    </Link>
  );
}
