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

async function getAllProductsForSearch() {
  const supabase = createServerSupabaseClient();
  // Page past PostgREST's 1000-row cap — unbounded select silently drops
  // half the catalogue (2,004 products) from search.
  const PAGE = 1000;
  const all: { brand: string; name: string; slug: string; category: string; sd_code: string | null; finish: string | null }[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from("products")
      .select("brand,name,slug,category,sd_code,finish")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    all.push(...data);
    if (data.length < PAGE) break;
  }
  return all;
}

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const [products, brands] = await Promise.all([getAllProductsForSearch(), getAllBrandsWithCounts()]);

  // sd_code/finish folded into the title (not just subtitle) so typing a bare
  // shade code or finish code — e.g. "591" or "SF" — surfaces the product;
  // Fuse only searches the `keys` it's given (title, subtitle), and subtitle
  // is already used for the category.
  const productEntries: SearchEntry[] = products.map((p) => ({
    title: [p.brand, p.name, p.sd_code, p.finish].filter(Boolean).join(" "),
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
