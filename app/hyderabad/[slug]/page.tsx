import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSlugs, getContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { ContentDetailView } from "@/components/ContentDetailView";

export function generateStaticParams() {
  return getAllSlugs("hyderabad").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getContent("hyderabad", slug);
  if (!entry) return {};
  return buildMetadata({
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
    path: `/hyderabad/${slug}`,
  });
}

export default async function HyderabadDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getContent("hyderabad", slug);
  if (!entry) notFound();
  return <ContentDetailView type="hyderabad" entry={entry} />;
}
