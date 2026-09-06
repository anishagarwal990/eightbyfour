/**
 * Colours for the WebGL scenes.
 *
 * These are hex literals rather than `var(--…)` because three.js materials are
 * uploaded to the GPU and cannot read CSS custom properties — this is the one
 * place in the studio where a raw value is correct rather than a leak.
 *
 * They live here so the value is written once. `BRAND` must stay in step with
 * `--burgundy` in globals.css; a mismatch shows up as a selected panel that is
 * a slightly different red from the button that selected it.
 */
export const SCENE = {
  /** Matches --burgundy. Selection and hover glow. */
  brand: "#6e1f2e",
  /** Selected panel fill — --burgundy lifted so it reads under scene light. */
  brandLift: "#8f3346",
  /** Panel outline. Warm charcoal, not black, so edges sit in the timber. */
  edge: "#3d3630",
  none: "#000000",
  /** Bounce light off the floor. */
  ground: "#d8d2c8",
  /** Room floor in the kitchen scene. */
  floor: "#efece6",
  /** Brushed steel — appliance bodies. */
  appliance: "#b9bec4",
  /** Fittings: hinges, rails, runners. */
  hardware: "#9aa0a6",
} as const;
