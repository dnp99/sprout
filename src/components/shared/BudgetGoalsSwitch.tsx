"use client";

import { useTranslations } from "next-intl";

/** One navigation destination, two independent workspaces and mutation scopes. */
export function BudgetGoalsSwitch({
  active,
  onChange,
  disabled = false,
}: {
  active: "budget" | "goals";
  onChange: (section: "budget" | "goals") => void;
  disabled?: boolean;
}) {
  const t = useTranslations("nav");
  return (
    <div
      role="group"
      aria-label={t("budgetGoals")}
      className="mb-3 flex gap-1 rounded-[10px] border border-edge bg-card p-1 lg:border-0 lg:bg-track"
    >
      {(["budget", "goals"] as const).map((value) => (
        <button
          key={value}
          type="button"
          disabled={disabled}
          aria-pressed={active === value}
          onClick={() => onChange(value)}
          className={`min-h-11 flex-1 rounded-[7px] px-3 text-[12.5px] font-semibold disabled:opacity-40 ${active === value ? "bg-primary text-onprimary" : "text-muted"}`}
        >
          {t(value)}
        </button>
      ))}
    </div>
  );
}
