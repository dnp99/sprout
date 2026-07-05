type Variant = "plain" | "income" | "dark" | "primary";

const VARIANTS: Record<Variant, { card: string; label: string; value: string }> = {
  plain: { card: "bg-card", label: "text-muted", value: "text-ink" },
  income: { card: "bg-[#e4ebd6]", label: "text-[#5f7a42]", value: "text-[#4f7a3a]" },
  dark: { card: "bg-surface", label: "text-subtle", value: "text-bg" },
  primary: { card: "bg-primary", label: "text-white/85", value: "text-white" },
};

/** Labeled KPI tile used across the dashboard and mobile stat rows. */
export function StatCard({
  label,
  value,
  variant = "plain",
  valueClassName,
  className,
}: {
  label: string;
  value: string;
  variant?: Variant;
  /** Overrides the value color (e.g. green for Saved / Net). */
  valueClassName?: string;
  className?: string;
}) {
  const v = VARIANTS[variant];
  return (
    <div className={`rounded-2xl p-4 ${v.card} ${className ?? ""}`}>
      <div className={`text-[11px] font-extrabold uppercase tracking-wide ${v.label}`}>{label}</div>
      <div className={`mt-1.5 text-2xl font-extrabold tabular-nums ${valueClassName ?? v.value}`}>
        {value}
      </div>
    </div>
  );
}
