"use client";

/** Category and note share one bounded line; the complete text stays available
 * via the title and the existing record editor rather than increasing row height. */
export function RecordSummary({
  category,
  note,
  date,
}: {
  category: string;
  note?: string | null;
  date?: string;
}) {
  const details = [category, note?.trim(), date].filter(Boolean).join(" · ");
  return (
    <span
      className="flex min-w-0 items-baseline gap-1 text-meta font-normal leading-4 text-muted"
      title={details}
    >
      <span className="min-w-0 truncate">
        {[category, note?.trim()].filter(Boolean).join(" · ")}
      </span>
      {date && <span className="shrink-0">· {date}</span>}
    </span>
  );
}
