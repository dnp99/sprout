interface ProgressBarProps {
  percent: number;
  color: string;
  /** Track height in px. */
  height?: number;
  className?: string;
}

/** A rounded progress bar matching the Sprout style (cream track + accent fill). */
export function ProgressBar({ percent, color, height = 6, className }: ProgressBarProps) {
  return (
    <div className={`overflow-hidden rounded-full bg-track ${className ?? ""}`} style={{ height }}>
      <div
        className="progress-fill h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          background: `color-mix(in srgb, ${color} var(--progress-color-weight, 72%), var(--card))`,
        }}
      />
    </div>
  );
}
