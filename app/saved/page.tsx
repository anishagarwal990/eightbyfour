import type { Metadata } from "next";
import { SavedProductsView } from "@/components/SavedProductsView";

export const metadata: Metadata = {
  title: "Your Requirement",
  robots: { index: false, follow: true },
};

export default function SavedPage() {
  return <SavedProductsView />;
}
