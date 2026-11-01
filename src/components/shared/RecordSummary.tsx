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
    <span className="block truncate text-[10px] font-medium leading-4 text-muted" title={details}>
      {details}
    </span>
  );
}
