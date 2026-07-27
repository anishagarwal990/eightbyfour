import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ProductReview {
  name: string;
  rating: number;
  comment: string;
  created_at: string;
  profession: string | null;
  image_urls: string[] | null;
}

export interface ProductRatingSummary {
  reviews: ProductReview[];
  average: number;
  count: number;
}

export async function getProductReviews(productId: number): Promise<ProductRatingSummary> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("product_comments")
    .select("name, rating, comment, created_at, profession, image_urls")
    .eq("product_id", productId)
    .eq("status", "approved")
    .not("rating", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw error;

  const reviews = (data || []) as ProductReview[];
  const count = reviews.length;
  const average = count > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
  return { reviews, average, count };
}
