import type { TrendPoint } from "@/lib/types";

/** Vertical bar chart for the 6-month spending trend. The `current` bar uses
 *  the brand color; the rest use a soft peach. */
export function BarChart({
  points,
  height = 118,
  showLabels = true,
}: {
  points: TrendPoint[];
  height?: number;
  showLabels?: boolean;
}) {
  return (
    <div className="flex items-end gap-2.5" style={{ height }}>
      {points.map((point) => (
        <div
          key={point.label}
          className="flex h-full flex-1 flex-col items-center justify-end gap-2"
        >
          <div
            className="w-full rounded-lg"
            style={{
              height: `${point.heightPercent}%`,
              background: point.current ? "#d97a54" : "#f2c89a",
            }}
          />
          {showLabels && <span className="text-[11px] font-bold text-muted">{point.label}</span>}
        </div>
      ))}
    </div>
  );
}
