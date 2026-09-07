import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllSlugs, getContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { ContentDetailView } from "@/components/ContentDetailView";

export function generateStaticParams() {
  return getAllSlugs("applications").map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = getContent("applications", slug);
  if (!entry) return {};
  return buildMetadata({
    title: `${entry.frontmatter.title} — Materials & BOQ in Hyderabad`,
    description: entry.frontmatter.description,
    path: `/applications/${slug}`,
  });
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = getContent("applications", slug);
  if (!entry) notFound();
  return <ContentDetailView type="applications" entry={entry} />;
}
