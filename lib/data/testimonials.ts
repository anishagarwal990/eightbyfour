import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface Testimonial {
  name: string;
  role: string | null;
  comment: string;
  rating: number;
  created_at: string;
}

export async function getTestimonials(limit = 12): Promise<Testimonial[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("name, role, comment, rating, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as Testimonial[];
}
