"use client";

import { useTranslations } from "next-intl";
import { LedgerContextLabel } from "@/components/shared/LedgerContextLabel";
import { Select } from "@/components/ui/Select";
import type { GroupListItem } from "@/lib/groups/dto";

/** Group identity sits above the section title; multiple groups retain the
 * existing route switch without introducing another selected-group state. */
export function GroupHeaderTitle({
  id,
  name,
  groups,
  disabled,
  onChange,
}: {
  id: string;
  name: string;
  groups: GroupListItem[];
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  const t = useTranslations("groups");
  const nav = useTranslations("nav");
  return (
    <div className="flex min-w-0 items-center gap-2">
      <div className="min-w-0 flex-1">
        <LedgerContextLabel group name={name} />
        <h1 className="break-words text-[20px] font-bold leading-tight lg:text-[26px]">
          {nav("overview")}
        </h1>
      </div>
      {groups.length > 1 && (
        <Select
          value={id}
          disabled={disabled}
          aria-label={t("chooseGroup")}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-11 w-11 shrink-0 justify-center rounded-[10px] bg-card text-primary [&>span]:sr-only"
        >
          {!groups.some((group) => group.id === id) && <option value={id}>{name}</option>}
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}

/** Non-Home pages retain their section label and current group context. */
export function GroupSectionTitle({ section, name }: { section: string; name: string }) {
  const nav = useTranslations("nav");
  const t = useTranslations("groups");
  const titles = useTranslations("titles");
  return (
    <>
      <LedgerContextLabel group name={name} />
      <h1 className="break-words text-[20px] font-bold leading-tight lg:text-[26px]">
        <span className="lg:hidden">
          {section === "settlements"
            ? t(section)
            : nav(
                section === "bills" ? "billsShort" : section === "budget" ? "budgetGoals" : section,
              )}
        </span>
        <span className="hidden lg:inline">
          {section === "settlements"
            ? t(section)
            : section === "settings"
              ? nav(section)
              : titles(section === "budget" ? "categories" : section)}
        </span>
      </h1>
    </>
  );
}
