import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminProduct } from "@/lib/data/adminProducts";
import { productDisplayName } from "@/lib/productDisplay";
import { cashbackFromProduct, discountFromProduct, rateGridFromProduct } from "@/lib/catalogue/rateGrid";
import { ProductFieldsForm } from "@/components/admin/ProductFieldsForm";
import { RateGridEditor } from "@/components/admin/RateGridEditor";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getAdminProduct(slug);
  return { title: product ? productDisplayName(product) : "Product", robots: { index: false, follow: false } };
}

export default async function AdminProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getAdminProduct(slug);
  if (!product) notFound();

  return (
    <main className="px-6 py-6">
      <Link href="/admin" className="text-xs hover:opacity-70" style={{ color: "var(--line-strong)" }}>
        ← All products
      </Link>

      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="serif" style={{ fontSize: "var(--fs-h2)" }}>
          {productDisplayName(product)}
        </h1>
        <Link href={`/products/${product.slug}`} target="_blank" className="text-xs hover:opacity-70" style={{ color: "var(--line-strong)" }}>
          View live page ↗
        </Link>
      </div>
      <p className="mt-1 text-xs" style={{ color: "var(--line-strong)" }}>
        {product.slug} · slug and id are fixed — the slug is this product&apos;s live URL
      </p>

      <section className="mt-8">
        <h2 className="serif" style={{ fontSize: "var(--fs-h3, 1.25rem)" }}>
          Rates, discount &amp; cashback
        </h2>
        <p className="mt-1 max-w-3xl text-xs" style={{ color: "var(--line-strong)", lineHeight: "var(--lh-normal)" }}>
          What the Hyderabad price pages quote at a given thickness. Blank means unpriced — the site shows &ldquo;Request
          current price&rdquo; rather than a guess. Type <code>n/a</code> to drop a thickness the product is not stocked in.
          Rates here are <strong>list prices</strong> — the discount below is what gets cut off them.
        </p>
        <RateGridEditor
          slug={product.slug}
          initialRows={rateGridFromProduct(product)}
          hasVariants={Boolean(product.variants)}
          initialDiscount={discountFromProduct(product)}
          initialCashback={cashbackFromProduct(product)}
          packPricing={Array.isArray(product.price_table)}
        />
      </section>

      <section className="mt-10">
        <h2 className="serif" style={{ fontSize: "var(--fs-h3, 1.25rem)" }}>
          Product fields
        </h2>
        <ProductFieldsForm slug={product.slug} product={product} />
      </section>
    </main>
  );
}
