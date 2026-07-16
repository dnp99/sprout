/** Hover/tap tooltip pill for charts. Positioned a fixed gap above (default) or
 *  below its nearest `relative` ancestor (the bar/point), centered horizontally.
 *  Uses bg-ink + text-bg so it stays high-contrast in both light and dark mode.
 *  `placement="bottom"` lets callers flip it down when the anchor sits near the
 *  top of the plot, so the pill never clips out of view. */
export function ChartTooltip({
  label,
  placement = "top",
  align = "center",
}: {
  label: string;
  placement?: "top" | "bottom";
  align?: "start" | "center" | "end";
}) {
  const positionClass = placement === "bottom" ? "top-[calc(100%+8px)]" : "bottom-[calc(100%+8px)]";
  const alignClass =
    align === "start"
      ? "left-0 translate-x-0"
      : align === "end"
        ? "right-0 translate-x-0"
        : "left-1/2 -translate-x-1/2";
  return (
    <div
      className={`pointer-events-none absolute ${positionClass} ${alignClass} z-20 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-[11px] font-bold text-bg shadow-lg`}
    >
      {label}
    </div>
  );
}
