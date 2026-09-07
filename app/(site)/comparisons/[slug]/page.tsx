import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSlugs, getContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { ContentDetailView } from "@/components/ContentDetailView";

export function generateStaticParams() {
  return getAllSlugs("comparisons").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getContent("comparisons", slug);
  if (!entry) return {};
  return buildMetadata({
    title: entry.frontmatter.title,
    description: entry.frontmatter.description,
    path: `/comparisons/${slug}`,
  });
}

export default async function ComparisonDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getContent("comparisons", slug);
  if (!entry) notFound();
  return <ContentDetailView type="comparisons" entry={entry} />;
}
