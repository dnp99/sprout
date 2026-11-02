/** Legacy built-in accents are presentation defaults, not a fixed chart theme.
 * CSS resolves these at paint time so theme changes need no data rewrite.
 * Unrecognized custom accents remain user data; saved colors are CSS fallbacks. */
const DEFAULT_CHART_SLOTS: Record<string, number> = {
  "#c98a5a": 1,
  "#d97a54": 2,
  "#7e9b6b": 3,
  "#c25b3a": 4,
  "#e7a34a": 5,
  "#9a7b5a": 6,
};

export function categoryChartColor(color: string): string {
  const slot = DEFAULT_CHART_SLOTS[color.trim().toLowerCase()];
  const accent = slot ? `var(--chart-category-${slot}, ${color})` : color;
  return `color-mix(in srgb, ${accent} 82%, var(--card))`;
}

/** Payer colors represent series order, independently of category assignments. */
export function payerChartColor(index: number): string {
  return `var(--chart-category-${(index % 6) + 1}, var(--primary-ink))`;
}
