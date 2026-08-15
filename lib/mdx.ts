import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import matter from "gray-matter";

const CONTENT_ROOT = join(process.cwd(), "content");

export type ContentType = "applications" | "guides" | "comparisons" | "hyderabad";

export interface ContentFaq {
  question: string;
  answer: string;
}

export interface ContentFrontmatter {
  title: string;
  description: string;
  heroTagline?: string;
  relatedCategorySlugs?: string[];
  relatedBrandSlugs?: string[];
  relatedApplicationSlugs?: string[];
  relatedGuideSlugs?: string[];
  relatedComparisonSlugs?: string[];
  faqs?: ContentFaq[];
}

export interface ContentEntry {
  slug: string;
  frontmatter: ContentFrontmatter;
  body: string;
}

function dirFor(type: ContentType) {
  return join(CONTENT_ROOT, type);
}

export function getAllSlugs(type: ContentType): string[] {
  return readdirSync(dirFor(type))
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}

export function getContent(type: ContentType, slug: string): ContentEntry | null {
  try {
    const raw = readFileSync(join(dirFor(type), `${slug}.mdx`), "utf8");
    const { data, content } = matter(raw);
    return { slug, frontmatter: data as ContentFrontmatter, body: content };
  } catch {
    return null;
  }
}

/** File mtime for sitemap.ts's lastModified — a real, per-page signal instead of build-time "now". */
export function getContentMtime(type: ContentType, slug: string): Date {
  return statSync(join(dirFor(type), `${slug}.mdx`)).mtime;
}

export function getAllContent(type: ContentType): ContentEntry[] {
  return getAllSlugs(type)
    .map((slug) => getContent(type, slug))
    .filter((entry): entry is ContentEntry => entry !== null);
}

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  applications: "Application",
  guides: "Guide",
  comparisons: "Comparison",
  hyderabad: "Hyderabad",
};

// Breadcrumb/nav section label for each content type's index page. Not just
// CONTENT_TYPE_LABEL + "s" — "Hyderabad" is a place name, not a countable
// noun, so naive pluralization renders it as "Hyderabads".
export const CONTENT_TYPE_NAV_LABEL: Record<ContentType, string> = {
  applications: "Applications",
  guides: "Guides",
  comparisons: "Comparisons",
  hyderabad: "Hyderabad",
};

export const CONTENT_TYPE_PATH: Record<ContentType, string> = {
  applications: "/applications",
  guides: "/guides",
  comparisons: "/comparisons",
  hyderabad: "/hyderabad",
};
