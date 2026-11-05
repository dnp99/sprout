/** Internal visual vocabulary shared by tabs, filters and navigation. Domain
 * wrappers may choose a preset, but never own selected/focus/radius classes. */
export interface SelectionPresentation {
  shape?: "pill" | "rounded";
  size?: "compact" | "regular";
  appearance?: "standard" | "calendar" | "surface" | "choices";
}

export function selectionPresentation({
  shape,
  size = "regular",
  appearance = "standard",
}: SelectionPresentation = {}) {
  return { "data-shape": shape, "data-size": size, "data-appearance": appearance };
}
