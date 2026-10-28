"use client";

import { EverydayCalendar } from "@/components/shared/EverydayCalendar";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import { useTranslations } from "next-intl";

/** Calendar rows are returned independently of the 50-row ledger page so day
 * and history totals never silently omit older records in a busy household. */
export function GroupCalendar({
  data,
  month,
  onMonthChange,
  onAdd,
  onEdit,
  onViewAll,
  loading,
  busy,
}: {
  data: GroupSnapshot;
  loading: boolean;
  busy: boolean;
  month: string;
  onMonthChange: (month: string) => void;
  onAdd: (date: string) => void;
  onEdit: (entry: GroupEntry) => void;
  onViewAll: () => void;
}) {
  const t = useTranslations("groups");
  const entries = data.calendarEntries ?? [];
  return (
    <EverydayCalendar
      month={month}
      loading={loading}
      disabled={busy}
      onMonthChange={onMonthChange}
      records={entries.map((row) => {
        const category = data.categories.find((item) => item.id === row.categoryId);
        return {
          id: row.id,
          date: row.occurredOn,
          name: row.merchant || t(row.kind),
          emoji: category?.emoji ?? "🏷️",
          category: category?.name ?? t("uncategorized"),
          amountCents: row.amountCents,
          spendingCents: row.kind === "income" ? 0 : -row.amountCents,
          incomeCents: row.kind === "income" ? row.amountCents : 0,
        };
      })}
      onAdd={data.group.archivedAt ? undefined : onAdd}
      onEdit={
        data.group.archivedAt
          ? undefined
          : (id) => {
              const row = entries.find((item) => item.id === id);
              if (row && !data.group.archivedAt) onEdit(row);
            }
      }
      onViewAll={onViewAll}
    />
  );
}
