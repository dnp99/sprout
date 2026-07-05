import type { DonutSegment } from "@/lib/types";

/** Conic-gradient ring with an optional label + value in the hole. */
export function Donut({
  segments,
  size = 90,
  thickness = 15,
  topLabel,
  value,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  topLabel?: string;
  value?: string;
}) {
  const stops = segments
    .map((s, i) => {
      const from = segments.slice(0, i).reduce((sum, x) => sum + x.pct, 0);
      return `${s.color} ${from}% ${from + s.pct}%`;
    })
    .join(",");
  const inner = size - thickness * 2;

  return (
    <div
      className="flex flex-none items-center justify-center rounded-full"
      style={{ width: size, height: size, background: `conic-gradient(${stops})` }}
    >
      <div
        className="flex flex-col items-center justify-center rounded-full bg-card"
        style={{ width: inner, height: inner }}
      >
        {topLabel && <span className="text-[9px] font-bold text-muted">{topLabel}</span>}
        {value && <span className="text-[15px] font-extrabold tabular-nums text-ink">{value}</span>}
      </div>
    </div>
  );
}
