import { CATEGORIES } from "@/lib/categories";
import { getAllBrandsWithCounts } from "@/lib/data/brands";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CONTENT_TYPE_LABEL, CONTENT_TYPE_PATH, getAllContent, type ContentType } from "@/lib/mdx";

export interface SearchEntry {
  title: string;
  subtitle: string;
  url: string;
  type: string;
}

const CONTENT_TYPES: ContentType[] = ["applications", "guides", "comparisons", "hyderabad"];

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const supabase = createServerSupabaseClient();

  const [{ data: products }, brands] = await Promise.all([
    supabase.from("products").select("brand,name,slug,category"),
    getAllBrandsWithCounts(),
  ]);

  const productEntries: SearchEntry[] = (products || []).map((p) => ({
    title: `${p.brand} ${p.name}`,
    subtitle: p.category,
    url: `/products/${p.slug}`,
    type: "Product",
  }));

  const brandEntries: SearchEntry[] = brands.map((b) => ({
    title: b.name,
    subtitle: `${b.productCount} products`,
    url: `/brands/${b.slug}`,
    type: "Brand",
  }));

  const categoryEntries: SearchEntry[] = CATEGORIES.map((c) => ({
    title: c.name,
    subtitle: "Category",
    url: `/products/${c.slug}`,
    type: "Category",
  }));

  const contentEntries: SearchEntry[] = CONTENT_TYPES.flatMap((type) =>
    getAllContent(type).map((entry) => ({
      title: entry.frontmatter.title,
      subtitle: CONTENT_TYPE_LABEL[type],
      url: `${CONTENT_TYPE_PATH[type]}/${entry.slug}`,
      type: CONTENT_TYPE_LABEL[type],
    }))
  );

  return [...productEntries, ...brandEntries, ...categoryEntries, ...contentEntries];
}
