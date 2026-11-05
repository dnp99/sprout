"use client";

import { SelectionControl } from "@/components/ui/SelectionControl";
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
    <SelectionControl
      label={t("budgetGoals")}
      value={active}
      onChange={onChange}
      disabled={disabled}
      options={(["budget", "goals"] as const).map((value) => ({ value, label: t(value) }))}
      className="mb-3 flex gap-1 rounded-[10px] border border-edge bg-card p-1 lg:border-0 lg:bg-track"
      buttonClassName={(selected) =>
        `flex-1 rounded-[7px] px-3 text-[12.5px] font-semibold disabled:opacity-40 ${selected ? "bg-primary text-onprimary" : "text-muted"}`
      }
    />
  );
}
