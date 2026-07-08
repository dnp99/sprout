/** A shimmering placeholder block, used while transaction-derived widgets load
 *  (two-phase load: the summary paints the shell, transactions stream in). */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-track ${className}`} />;
}

/** A short stack of skeleton lines, for list-shaped widgets. */
export function SkeletonRows({ rows = 4, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-5 w-full" />
      ))}
    </div>
  );
}
