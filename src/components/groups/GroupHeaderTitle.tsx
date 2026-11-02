"use client";

import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import type { GroupListItem } from "@/lib/groups/dto";

/** A single group is a plain title; multiple groups expose the same scoped
 * route switch as the rail without introducing a second selected-group state. */
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
  const style =
    "min-h-11 min-w-0 w-full max-w-full rounded-[10px] border border-edge bg-card px-3 py-2 text-center text-[20px] font-bold text-primary lg:w-auto lg:bg-primary-soft lg:text-left lg:text-[26px]";
  return (
    <h1 className="group-header-title min-w-0">
      {groups.length > 1 ? (
        <Select
          variant="group-picker"
          value={id}
          disabled={disabled}
          aria-label={t("chooseGroup")}
          onChange={(event) => onChange(event.target.value)}
          className={style}
        >
          {!groups.some((group) => group.id === id) && <option value={id}>{name}</option>}
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </Select>
      ) : (
        <span
          className={`${style} inline-flex items-center justify-center break-words lg:justify-start`}
        >
          {name}
        </span>
      )}
    </h1>
  );
}

/** Non-Home pages retain their section label and current group context. */
export function GroupSectionTitle({ section, name }: { section: string; name: string }) {
  const nav = useTranslations("nav");
  const t = useTranslations("groups");
  const titles = useTranslations("titles");
  return (
    <>
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
      <p className="mt-1 text-sm text-muted lg:text-xs">{name}</p>
    </>
  );
}
