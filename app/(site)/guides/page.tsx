import type { Metadata } from "next";
import { getAllContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { ContentIndexView } from "@/components/ContentIndexView";

export const metadata: Metadata = buildMetadata({
  title: "Buying Guides for Interior & Construction Materials",
  description:
    "Practical buying guides for plywood, laminates, MDF and HDHMR — written for contractors, architects and homeowners procuring materials in Hyderabad.",
  path: "/guides",
});

export default function GuidesIndexPage() {
  const entries = getAllContent("guides");
  return (
    <ContentIndexView
      type="guides"
      title="Buying Guides"
      intro="Straight answers to the material questions that come up on every Hyderabad project — before you commit to a BOQ."
      entries={entries}
    />
  );
}
