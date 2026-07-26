import type { Metadata } from "next";
import { getAllContent, type ContentEntry } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { ContentIndexView } from "@/components/ContentIndexView";

export const metadata: Metadata = buildMetadata({
  title: "Material Procurement in Hyderabad",
  description:
    "EightByFour is Hyderabad's procurement platform for interior and construction materials — plywood, laminates, veneers and hardware sourced directly from trusted manufacturers, city-wide.",
  path: "/hyderabad",
});

// These three have bespoke page templates (app/hyderabad/<slug>/page.tsx) instead
// of MDX content, so they're listed here by hand alongside the MDX-driven entries.
const PERSONA_ENTRIES: ContentEntry[] = [
  {
    slug: "contractor-procurement",
    frontmatter: {
      title: "Contractor Procurement in Hyderabad",
      description: "Every stocked category in one view, with live SKU counts and trade pricing — built for contractors running multiple sites.",
    },
    body: "",
  },
  {
    slug: "architect-material-sourcing",
    frontmatter: {
      title: "Architect Material Sourcing in Hyderabad",
      description: "Real photography from our veneer, stone and solid-surface catalogue — for specifying, not browsing.",
    },
    body: "",
  },
  {
    slug: "homeowner-materials",
    frontmatter: {
      title: "Materials for Your Home in Hyderabad",
      description: "Plain-language guidance by room — kitchen, wardrobe, TV unit — instead of a raw materials catalogue.",
    },
    body: "",
  },
];

export default function HyderabadIndexPage() {
  const entries = [...PERSONA_ENTRIES, ...getAllContent("hyderabad")];
  return (
    <ContentIndexView
      type="hyderabad"
      title="Hyderabad"
      intro="EightByFour operates only in Hyderabad — every material we stock, and every process below, is built around this city's sites and delivery routes."
      entries={entries}
    />
  );
}
