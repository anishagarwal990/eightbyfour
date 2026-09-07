import type { Metadata } from "next";
import { getAllContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { ContentIndexView } from "@/components/ContentIndexView";

export const metadata: Metadata = buildMetadata({
  title: "Material Comparisons — Make the Right Call Before You Order",
  description:
    "Side-by-side comparisons of the material decisions Hyderabad projects face most often — MDF vs HDHMR, laminate vs veneer and more.",
  path: "/comparisons",
});

export default function ComparisonsIndexPage() {
  const entries = getAllContent("comparisons");
  return (
    <ContentIndexView
      type="comparisons"
      title="Comparisons"
      intro="Two materials, side by side — so you can spec with confidence instead of guessing."
      entries={entries}
    />
  );
}
