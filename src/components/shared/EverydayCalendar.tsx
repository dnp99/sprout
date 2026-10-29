"use client";

import { compareRecordOrder } from "@/lib/record-order";
import { RecordedTime } from "./RecordedTime";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import {
  calendarDays,
  localCalendarDate,
  calendarTotals,
  shiftCalendarDate,
  type CalendarRecord,
} from "@/lib/calendar";
import { EntitySymbol } from "@/components/ui/EntitySymbol";

/** One calendar/agenda interaction for Personal and Group; wrappers own data,
 * domain accounting, permissions and record mutations, never the renderer. */
export function EverydayCalendar({
  month,
  onMonthChange,
  records,
  onAdd,
  onEdit,
  onViewAll,
  loading = false,
  disabled = false,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  records: CalendarRecord[];
  onAdd?: (date: string) => void;
  onEdit?: (id: string) => void;
  onViewAll: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("everydayCalendar");
  const fmt = useFormatters();
  const today = localCalendarDate();
  const [selection, setSelection] = useState({
    month,
    date: today.startsWith(month) ? today : `${month}-01`,
  });
  const selected =
    selection.month === month ? selection.date : today.startsWith(month) ? today : `${month}-01`;
  const [mode, setMode] = useState<"month" | "week">("month");
  const [history, setHistory] = useState(true);
  const [pickedDay, setPickedDay] = useState(false);
  const grid = calendarDays(month);
  const weekStart = shiftCalendarDate(
    selected,
    -((new Date(`${selected}T12:00:00Z`).getUTCDay() + 6) % 7),
  );
  const days =
    mode === "month" ? grid : Array.from({ length: 7 }, (_, i) => shiftCalendarDate(weekStart, i));
  const inPeriod = records.filter((row) =>
    mode === "month" ? row.date.startsWith(month) : days.includes(row.date),
  );
  const selectedRecords = records.filter((row) => row.date === selected);
  const agenda = history ? inPeriod : selectedRecords;
  const totals = calendarTotals(selectedRecords);
  const label = (date: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(fmt.locale, { ...options, timeZone: "UTC" }).format(
      new Date(`${date}T12:00:00Z`),
    );
  function select(date: string) {
    setPickedDay(true);
    setSelection({ month: date.slice(0, 7), date });
    if (!date.startsWith(month)) onMonthChange(date.slice(0, 7));
    setHistory(false);
  }
  function move(direction: number) {
    if (mode === "week") select(shiftCalendarDate(selected, direction * 7));
    else {
      const date = new Date(`${month}-01T12:00:00Z`);
      date.setUTCMonth(date.getUTCMonth() + direction);
      select(date.toISOString().slice(0, 10));
    }
  }
  return (
    <section className="everyday-calendar" aria-label={t("title")} aria-busy={loading}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-ink">{t("title")}</h2>
          <p className="mt-2 text-xs text-muted">{t("hint")}</p>
        </div>
        <div className="calendar-segments" role="group" aria-label={t("view")}>
          {(["month", "week"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={mode === value}
              disabled={disabled || loading}
              onClick={() => setMode(value)}
            >
              {t(value)}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-2 text-xs text-muted">
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="calendar-arrow"
                aria-label={t("previous")}
                disabled={disabled || loading}
                onClick={() => move(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[100px] text-center">{fmt.monthKey(month)}</span>
              <button
                type="button"
                className="calendar-arrow"
                aria-label={t("next")}
                disabled={disabled || loading}
                onClick={() => move(1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <strong className="tabular-nums text-ink">
              {fmt.money(calendarTotals(inPeriod).spendingCents)}
            </strong>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center">
            {grid.slice(0, 7).map((date) => (
              <div key={date} className="pb-2 text-[10px] text-muted">
                {label(date, { weekday: "short" })}
              </div>
            ))}
            {days.map((date) => {
              const dayRecords = records.filter((row) => row.date === date);
              const total = calendarTotals(dayRecords);
              return (
                <button
                  key={date}
                  type="button"
                  className="calendar-day"
                  aria-pressed={date === selected}
                  aria-current={date === today ? "date" : undefined}
                  data-outside={!date.startsWith(month)}
                  data-has-records={dayRecords.length > 0}
                  aria-label={`${label(date, { dateStyle: "full" })}: ${fmt.money(total.spendingCents)}`}
                  disabled={disabled || loading}
                  onClick={() => select(date)}
                >
                  <span className="calendar-day-number">{Number(date.slice(-2))}</span>
                  <span className="max-w-full truncate text-[9px] tabular-nums sm:text-[10px]">
                    {dayRecords.length ? fmt.money(total.spendingCents) : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="calendar-agenda min-w-0">
          <div className="flex items-center justify-between gap-3">
            <div className="calendar-segments" role="group" aria-label={t("records")}>
              <button
                type="button"
                aria-pressed={!history}
                onClick={() => {
                  if (!pickedDay) select(today);
                  else setHistory(false);
                }}
              >
                {pickedDay && selected !== today
                  ? label(selected, { month: "short", day: "numeric" })
                  : t("today")}
              </button>
              <button type="button" aria-pressed={history} onClick={() => setHistory(true)}>
                {t("recentTransactions")}
              </button>
            </div>
            {onAdd && (
              <button
                type="button"
                className="calendar-add"
                aria-label={t("add", { date: selected })}
                disabled={disabled || loading}
                onClick={() => onAdd(selected)}
              >
                <Plus size={20} strokeWidth={2} />
              </button>
            )}
          </div>
          <h3 className="mt-4 text-sm font-semibold text-ink">
            {history
              ? t("recentTransactions")
              : label(selected, { weekday: "short", month: "short", day: "numeric" })}
          </h3>
          <p className="mt-2 text-[11px] text-muted">
            {history
              ? t("recordCount", { count: agenda.length })
              : t("daily", {
                  spending: fmt.money(totals.spendingCents),
                  income: fmt.money(totals.incomeCents),
                })}
          </p>
          <div className="mt-5 max-h-[280px] space-y-2 overflow-y-auto">
            {!loading && !agenda.length && <p className="py-3 text-xs text-muted">{t("empty")}</p>}
            {loading && <p className="py-3 text-xs text-muted">{t("loading")}</p>}
            {!loading &&
              [...agenda].sort(compareRecordOrder).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  disabled={disabled || loading || !onEdit}
                  onClick={() => onEdit?.(row.id)}
                  className="flex min-h-11 w-full items-center gap-2 rounded-[10px] p-2 text-left hover:bg-primary-soft"
                >
                  <EntitySymbol emoji={row.emoji} size={16} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-ink">{row.name}</span>
                    <span className="text-[10px] text-muted">
                      {history ? `${row.date} · ` : ""}
                      {row.category}
                    </span>
                    <RecordedTime value={row.createdAt} />
                  </span>
                  <span className="whitespace-nowrap text-xs font-semibold tabular-nums text-ink">
                    {fmt.money(row.amountCents, { signed: true })}
                  </span>
                </button>
              ))}
          </div>
          {history && (
            <button
              type="button"
              onClick={onViewAll}
              className="mt-4 min-h-11 text-xs font-semibold text-primary"
            >
              {t("viewAll")}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
