"use client";

import { EverydayCalendar, type CalendarCardLayout } from "@/components/shared/EverydayCalendar";
import type { GroupEntry, GroupSnapshot } from "@/lib/groups/dto";
import { useTranslations } from "next-intl";

/** Calendar rows are returned independently of the 50-row ledger page so day
 * and history totals never silently omit older records in a busy household. */
export function GroupCalendar({
  data,
  month,
  onMonthChange,
  onEdit,
  onViewAll,
  loading,
  busy,
  dashboard = false,
  renderCards,
}: {
  data: GroupSnapshot;
  loading: boolean;
  busy: boolean;
  dashboard?: boolean;
  renderCards?: CalendarCardLayout;
  month: string;
  onMonthChange: (month: string) => void;
  onEdit: (entry: GroupEntry) => void;
  onViewAll: () => void;
}) {
  const t = useTranslations("groups");
  const entries = data.calendarEntries ?? [];
  return (
    <EverydayCalendar
      dashboard={dashboard}
      renderCards={renderCards}
      month={month}
      loading={loading}
      disabled={busy}
      onMonthChange={onMonthChange}
      records={entries.map((row) => {
        const category = data.categories.find((item) => item.id === row.categoryId);
        return {
          id: row.id,
          createdAt: row.createdAt,
          note: row.note,
          date: row.occurredOn,
          name: row.merchant || t(row.kind),
          emoji: category?.emoji ?? "🏷️",
          category: category?.name ?? t("uncategorized"),
          payerLabel: `${t("paidBy")}: ${data.members.find((member) => member.id === row.payerId)?.name ?? t("sharedFunds")}`,
          amountCents: row.amountCents,
          spendingCents: row.kind === "income" ? 0 : -row.amountCents,
          incomeCents: row.kind === "income" ? row.amountCents : 0,
        };
      })}
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
