/** Hover tooltip pill for bar charts. Positioned a fixed gap above its nearest
 *  `relative` ancestor (the bar), centered horizontally. Uses bg-ink + text-bg
 *  so it stays high-contrast in both light and dark mode (see BarChart). */
export function ChartTooltip({ label }: { label: string }) {
  return (
    <div className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-bold text-bg shadow-lg">
      {label}
    </div>
  );
}
