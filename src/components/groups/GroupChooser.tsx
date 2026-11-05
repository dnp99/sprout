"use client";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";

/** One route chooser serves mobile account identity and desktop page headings. */
export function GroupChooser({
  id,
  name,
  groups,
  disabled,
  onChange,
  labeled = false,
}: {
  labeled?: boolean;
  id: string;
  name?: string;
  groups: { id: string; name: string }[];
  disabled: boolean;
  onChange: (id: string) => void;
}) {
  const t = useTranslations("groups");
  if (groups.length <= 1) return null;
  return (
    <Select
      value={id}
      disabled={disabled}
      aria-label={t("chooseGroup")}
      onChange={(event) => onChange(event.target.value)}
      className={
        labeled
          ? "min-h-11 max-w-full rounded-[10px] bg-transparent text-label font-medium text-muted"
          : "min-h-11 w-11 shrink-0 justify-center rounded-[10px] bg-card text-primary [&>span]:sr-only"
      }
    >
      {!groups.some((group) => group.id === id) && <option value={id}>{name ?? t("title")}</option>}
      {groups.map((group) => (
        <option key={group.id} value={group.id}>
          {group.name}
        </option>
      ))}
    </Select>
  );
}
