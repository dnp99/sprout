/** Compact, accessible count for recurring items that need attention. */
export function NeedsReviewBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = `${count} recurring ${count === 1 ? "occurrence needs" : "occurrences need"} review`;
  return (
    <span
      aria-label={label}
      title={label}
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold leading-none text-onprimary"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
