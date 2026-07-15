/** Hover/tap tooltip pill for charts. Positioned a fixed gap above (default) or
 *  below its nearest `relative` ancestor (the bar/point), centered horizontally.
 *  Uses bg-ink + text-bg so it stays high-contrast in both light and dark mode.
 *  `placement="bottom"` lets callers flip it down when the anchor sits near the
 *  top of the plot, so the pill never clips out of view. */
export function ChartTooltip({
  label,
  placement = "top",
}: {
  label: string;
  placement?: "top" | "bottom";
}) {
  const positionClass = placement === "bottom" ? "top-[calc(100%+8px)]" : "bottom-[calc(100%+8px)]";
  return (
    <div
      className={`pointer-events-none absolute ${positionClass} left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-bold text-bg shadow-lg`}
    >
      {label}
    </div>
  );
}
