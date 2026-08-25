/**
 * Category image art direction.
 *
 * The catalogue's imagery is not one thing: laminates, veneers, solid surface
 * and stone are photographed as surfaces (edge-to-edge texture), while
 * plywood, boards and adhesives are packshots and marketing tiles on white —
 * a tin of Fevicol, a branded sheet render. Cropping both the same way is what
 * made one category read as an advertisement and another as a raw database
 * upload. So the crop rule is declared per category and applied everywhere a
 * category image renders.
 */
export type ImageTreatment = "surface" | "packshot";

const SURFACE_CATEGORIES = new Set(["laminates", "veneers", "corian-acrylic-solid-surface", "nfc-boards"]);

export function treatmentForCategory(slug: string): ImageTreatment {
  return SURFACE_CATEGORIES.has(slug) ? "surface" : "packshot";
}

/**
 * Some products carry a brand logo file as their main image because no real
 * product photograph exists yet. That is fine on a dense product grid, where
 * it reads as a placeholder among neighbours — it is not fine as the one photo
 * representing an entire category, where it reads as an advert.
 */
export function isRepresentativeImage(url: string | null | undefined): url is string {
  return Boolean(url) && !url!.includes("/brand-logos/");
}
