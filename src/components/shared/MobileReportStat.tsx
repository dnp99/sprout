/** A shared compact summary tile keeps cash flow and spending equally dense. */
export function MobileReportStat({
  label,
  value,
  tone,
  filled,
}: {
  label: string;
  value: string;
  tone?: "pos" | "primary";
  filled?: boolean;
}) {
  return (
    <div
      className={`rounded-[10px] p-[10px_11px] ${filled ? "bg-green/[.13]" : "border border-edge"}`}
    >
      <div className="text-[9px] font-semibold uppercase tracking-[.04em] text-muted">{label}</div>
      <div
        className={`mt-0.5 text-[15px] font-bold tracking-[-.02em] tabular-nums ${tone === "pos" ? "text-green" : tone === "primary" ? "text-primary" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
