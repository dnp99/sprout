"use client";

import { Navigation, NavigationItem } from "@/components/ui/Navigation";
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
    <Navigation
      aria-label={t("budgetGoals")}
      layout="segments"
      shape="rounded"
      className="mb-3 w-full"
    >
      {(["budget", "goals"] as const).map((value) => (
        <NavigationItem
          key={value}
          variant="segments"
          active={active === value}
          label={t(value)}
          disabled={disabled}
          onClick={() => onChange(value)}
        />
      ))}
    </Navigation>
  );
}
