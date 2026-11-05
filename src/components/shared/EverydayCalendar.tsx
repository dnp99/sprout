"use client";
import { SelectionControl } from "@/components/ui/SelectionControl";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";

import { compareRecordOrder } from "@/lib/record-order";
import { RecordSummary } from "./RecordSummary";
import { ReportDateControl } from "./ReportDateControl";
import { RecordedTime } from "./RecordedTime";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  onEdit,
  onViewAll,
  loading = false,
  disabled = false,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  records: CalendarRecord[];
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
  const [mode, setMode] = useState<"month" | "week">("week");
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
  // Month and week actions stay independent: month arrows always land on the
  // first of the adjacent month; week arrows preserve the selected weekday.
  function moveMonth(direction: number) {
    const date = new Date(`${month}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + direction);
    select(date.toISOString().slice(0, 10));
  }
  function moveWeek(direction: number) {
    select(shiftCalendarDate(selected, direction * 7));
  }
  return (
    <section className="everyday-calendar" aria-label={t("title")} aria-busy={loading}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <SelectionControl
          className="calendar-segments"
          label={t("view")}
          options={[
            { value: "week", label: t("week") },
            { value: "month", label: t("month") },
          ]}
          value={mode}
          onChange={setMode}
          disabled={disabled || loading}
          buttonClassName={() => ""}
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.15fr_1fr]">
        <div className="min-w-0">
          <div className="mb-4 flex items-center justify-between gap-2 text-xs text-muted">
            <div className="lg:hidden">
              <ReportDateControl
                className="calendar-month-control"
                month={month}
                yearly={false}
                directMonthPick
                disabled={disabled || loading}
                onMonthChange={(value) => {
                  select(`${value}-01`);
                }}
                onSelect={(value, date) => {
                  select(date ?? `${value}-01`);
                }}
              />
            </div>
            <div className="hidden items-center gap-1 lg:flex">
              <button
                type="button"
                className="calendar-arrow"
                aria-label={t("previousMonth")}
                disabled={disabled || loading}
                onClick={() => moveMonth(-1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="min-w-[100px] text-center">{fmt.monthKey(month)}</span>
              <button
                type="button"
                className="calendar-arrow"
                aria-label={t("nextMonth")}
                disabled={disabled || loading}
                onClick={() => moveMonth(1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <strong className="tabular-nums text-ink">
              {fmt.money(calendarTotals(inPeriod).spendingCents)}
            </strong>
          </div>
          {mode === "week" && (
            <div className="mb-2 flex items-center justify-between lg:hidden">
              <WeekArrow
                direction="previous"
                label={t("previousWeek")}
                disabled={disabled || loading}
                onClick={() => moveWeek(-1)}
              />
              <span className="text-xs text-muted">
                {label(days[0], { month: "short", day: "numeric" })} –{" "}
                {label(days[6], { month: "short", day: "numeric" })}
              </span>
              <WeekArrow
                direction="next"
                label={t("nextWeek")}
                disabled={disabled || loading}
                onClick={() => moveWeek(1)}
              />
            </div>
          )}
          <div
            className={`grid gap-1 text-center ${mode === "week" ? "calendar-week-grid grid-cols-7 lg:grid-cols-[calc(16px+1mm)_repeat(7,minmax(0,1fr))_calc(16px+1mm)]" : "grid-cols-7"}`}
          >
            {mode === "week" && <span className="hidden lg:block" aria-hidden="true" />}
            {grid.slice(0, 7).map((date) => (
              <div key={date} className="pb-2 text-[10px] text-muted">
                {label(date, { weekday: "short" })}
              </div>
            ))}
            {mode === "week" && (
              <>
                <span className="hidden lg:block" aria-hidden="true" />
                <WeekArrow
                  desktopOnly
                  direction="previous"
                  label={t("previousWeek")}
                  disabled={disabled || loading}
                  onClick={() => moveWeek(-1)}
                />
              </>
            )}
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
                  title={dayRecords.length ? fmt.money(total.spendingCents) : undefined}
                  disabled={disabled || loading}
                  onClick={() => select(date)}
                >
                  <span className="calendar-day-number">{Number(date.slice(-2))}</span>
                  <span className="calendar-day-amount">
                    <span className="max-w-full truncate text-[9px] tabular-nums sm:text-[10px]">
                      {dayRecords.length ? (
                        <>
                          <span className="lg:hidden">
                            {fmt.money(total.spendingCents, { compact: true })}
                          </span>
                          <span className="hidden lg:inline">{fmt.money(total.spendingCents)}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
            {mode === "week" && (
              <WeekArrow
                desktopOnly
                direction="next"
                label={t("nextWeek")}
                disabled={disabled || loading}
                onClick={() => moveWeek(1)}
              />
            )}
          </div>
        </div>
        <div className="calendar-agenda min-w-0">
          <div className="flex items-center justify-between gap-3">
            <SelectionControl
              className="calendar-segments"
              label={t("records")}
              options={[
                {
                  value: "today",
                  label:
                    pickedDay && selected !== today
                      ? label(selected, { month: "short", day: "numeric" })
                      : t("today"),
                },
                { value: "recent", label: t("recentTransactions") },
              ]}
              value={history ? "recent" : "today"}
              onChange={(value) => {
                if (value === "recent") setHistory(true);
                else if (!pickedDay) select(today);
                else setHistory(false);
              }}
              buttonClassName={() => ""}
            />
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
          <div className="record-list mt-3 max-h-[280px] space-y-1 overflow-y-auto">
            {!loading && !agenda.length && <p className="py-3 text-xs text-muted">{t("empty")}</p>}
            {loading && (
              <p role="status" className="flex items-center gap-2 py-3 text-xs text-muted">
                <LoadingIndicator />
                {t("loading")}
              </p>
            )}
            {!loading &&
              [...agenda].sort(compareRecordOrder).map((row) => (
                <button
                  key={row.id}
                  type="button"
                  disabled={disabled || loading || !onEdit}
                  onClick={() => onEdit?.(row.id)}
                  className="record-row flex min-h-11 w-full items-center gap-2 rounded-[10px] px-2 py-1.5 text-left hover:bg-primary-soft"
                >
                  <EntitySymbol emoji={row.emoji} size={16} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium text-ink">{row.name}</span>
                    <RecordSummary
                      category={row.category}
                      note={row.note}
                      date={history ? row.date : undefined}
                    />
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

/** Slim week arrows reserve more horizontal space for the seven date cells. */
function WeekArrow({
  desktopOnly = false,
  direction,
  label,
  disabled,
  onClick,
}: {
  desktopOnly?: boolean;
  direction: "previous" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`calendar-arrow calendar-week-arrow self-center text-primary disabled:opacity-40 ${desktopOnly ? "hidden lg:inline-flex" : ""}`}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}
