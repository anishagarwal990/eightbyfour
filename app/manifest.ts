import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EightByFour — Procurement Platform for Interior & Construction Materials",
    short_name: "EightByFour",
    description:
      "EightByFour simplifies procurement of plywood, laminates, MDF, veneers, hardware and more directly from trusted manufacturers in Hyderabad.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#6e1f2e",
    icons: [
      {
        src: "/eightbyfour-logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
