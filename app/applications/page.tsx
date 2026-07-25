import type { Metadata } from "next";
import { getAllContent } from "@/lib/mdx";
import { buildMetadata } from "@/lib/seo";
import { ContentIndexView } from "@/components/ContentIndexView";

export const metadata: Metadata = buildMetadata({
  title: "Materials for Every Application in Hyderabad",
  description:
    "From modular kitchens to hotel interiors — the plywood, laminate, veneer and hardware combinations EightByFour recommends for each application in Hyderabad.",
  path: "/applications",
});

export default function ApplicationsIndexPage() {
  const entries = getAllContent("applications");
  return (
    <ContentIndexView
      type="applications"
      title="Materials by Application"
      intro="Every project type needs a different material combination. Pick your application to see the products, brands and BOQ we recommend for Hyderabad projects."
      entries={entries}
    />
  );
}
