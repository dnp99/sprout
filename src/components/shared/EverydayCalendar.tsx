"use client";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useMeasuredContentFloor } from "@/hooks/useMeasuredContentFloor";
import { LoadingIndicator } from "@/components/ui/LoadingIndicator";

import { compareRecordOrder } from "@/lib/record-order";
import { RecordSummary } from "./RecordSummary";
import { ReportDateControl } from "./ReportDateControl";
import { RecordedTime } from "./RecordedTime";
import { useState, type ReactNode } from "react";
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
import { CalendarDayCell } from "./CalendarDayCell";
import { calendarSpendingIntensity } from "@/lib/calendar-intensity";
import { EntitySymbol } from "@/components/ui/EntitySymbol";

/** Optional composition seam: one controller supplies both cards, so layout
 * changes never create independent date/list state or duplicate calendars. */
export type CalendarCardLayout = (cards: { calendar: ReactNode; recent: ReactNode }) => ReactNode;

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
  dashboard = false,
  renderCards,
}: {
  month: string;
  onMonthChange: (month: string) => void;
  records: CalendarRecord[];
  onEdit?: (id: string) => void;
  onViewAll: () => void;
  loading?: boolean;
  disabled?: boolean;
  dashboard?: boolean;
  renderCards?: CalendarCardLayout;
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
  const { contentRef, minHeight } = useMeasuredContentFloor(
    `${month}:${mode}:${inPeriod.map((row) => row.id).join(",")}`,
    `${history}:${selected}:${loading}`,
  );
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
  const dailySpending = new Map(
    (dashboard ? days : []).map((date) => [
      date,
      calendarTotals(records.filter((row) => row.date === date)).spendingCents,
    ]),
  );
  const intensity = calendarSpendingIntensity(
    days
      .filter((date) => mode === "week" || date.startsWith(month))
      .map((date) => dailySpending.get(date) ?? 0),
  );
  const modeControl = (
    <div className="calendar-view-control mb-5 flex flex-wrap items-center justify-between gap-3">
      {dashboard && <h2 className="text-body font-semibold">{t("title")}</h2>}
      <SegmentedControl
        className="calendar-segments"
        appearance="calendar"
        size="compact"
        label={t("view")}
        options={[
          { value: "week", label: t("week") },
          { value: "month", label: t("month") },
        ]}
        value={mode}
        onChange={setMode}
        disabled={disabled || loading}
      />
    </div>
  );
  const datesCard = (
    <div className={dashboard ? "dashboard-card dashboard-dates" : "min-w-0"}>
      {dashboard && modeControl}
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
          <CalendarArrow
            direction="previous"
            label={t("previousMonth")}
            disabled={disabled || loading}
            onClick={() => moveMonth(-1)}
          />
          <span className="min-w-[100px] text-center">{fmt.monthKey(month)}</span>
          <CalendarArrow
            direction="next"
            label={t("nextMonth")}
            disabled={disabled || loading}
            onClick={() => moveMonth(1)}
          />
        </div>
        <strong className="tabular-nums text-ink">
          {fmt.money(calendarTotals(inPeriod).spendingCents)}
        </strong>
      </div>
      {mode === "week" && (
        <div className="mb-2 flex items-center justify-between lg:hidden">
          <CalendarArrow
            week
            direction="previous"
            label={t("previousWeek")}
            disabled={disabled || loading}
            onClick={() => moveWeek(-1)}
          />
          <span className="text-xs text-muted">
            {label(days[0], { month: "short", day: "numeric" })} –{" "}
            {label(days[6], { month: "short", day: "numeric" })}
          </span>
          <CalendarArrow
            week
            direction="next"
            label={t("nextWeek")}
            disabled={disabled || loading}
            onClick={() => moveWeek(1)}
          />
        </div>
      )}
      <div
        className={`grid gap-1 text-center ${dashboard ? "calendar-spending-grid" : ""} ${mode === "week" ? "calendar-week-grid grid-cols-7 lg:grid-cols-[44px_repeat(7,minmax(0,1fr))_44px]" : "grid-cols-7"}`}
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
            <CalendarArrow
              week
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
          if (dashboard)
            return (
              <CalendarDayCell
                key={date}
                date={date}
                label={label(date, { dateStyle: "full" })}
                spendingCents={total.spendingCents}
                hasRecords={dayRecords.length > 0}
                intensity={intensity.get(total.spendingCents) ?? 0}
                selected={date === selected}
                today={date === today}
                outside={!date.startsWith(month)}
                disabled={disabled || loading}
                onSelect={select}
              />
            );
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
          <CalendarArrow
            week
            desktopOnly
            direction="next"
            label={t("nextWeek")}
            disabled={disabled || loading}
            onClick={() => moveWeek(1)}
          />
        )}
      </div>
    </div>
  );
  const recentCard = (
    <div
      aria-busy={loading}
      className={`calendar-agenda min-w-0 ${dashboard ? "dashboard-card dashboard-recent" : ""}`}
    >
      <div className="flex items-center justify-between gap-3">
        <SegmentedControl
          className="calendar-segments"
          appearance="calendar"
          size="compact"
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
        />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-ink">
        {history
          ? t("recentTransactions")
          : label(selected, { weekday: "short", month: "short", day: "numeric" })}
      </h3>
      <p className="mt-2 min-h-8 text-[11px] text-muted">
        {history
          ? t("recordCount", { count: agenda.length })
          : t("daily", {
              spending: fmt.money(totals.spendingCents),
              income: fmt.money(totals.incomeCents),
            })}
      </p>
      {/* Share only the space actually used by these records, not an
      empty fixed-height viewport. The inner wrapper measures content. */}
      <div
        className={dashboard ? "mt-3" : "mt-3 max-h-[280px] overflow-y-auto"}
        style={dashboard ? undefined : { minHeight }}
      >
        <div ref={contentRef} className="record-list space-y-1">
          {!loading && !agenda.length && <p className="py-3 text-xs text-muted">{t("empty")}</p>}
          {loading && (
            <p role="status" className="flex items-center gap-2 py-3 text-xs text-muted">
              <LoadingIndicator />
              {t("loading")}
            </p>
          )}
          {!loading &&
            [...agenda]
              .sort(compareRecordOrder)
              .slice(0, dashboard ? 5 : agenda.length)
              .map((row) => (
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
                    {row.payerLabel && (
                      <span className="block truncate text-meta text-muted">{row.payerLabel}</span>
                    )}
                    <RecordedTime value={row.createdAt} />
                  </span>
                  <span
                    className={`dashboard-record-amount whitespace-nowrap text-xs font-semibold tabular-nums ${row.amountCents > 0 ? "text-green" : "text-ink"}`}
                  >
                    {fmt.money(row.amountCents, { signed: true })}
                  </span>
                </button>
              ))}
        </div>
      </div>
      {/* Dashboard keeps navigation available in either scope; legacy users
      retain the stable hidden footer slot in daily mode. */}
      <button
        type="button"
        onClick={onViewAll}
        disabled={(!dashboard && !history) || loading}
        aria-hidden={!dashboard && !history}
        tabIndex={dashboard || history ? undefined : -1}
        className={`mt-4 min-h-11 text-xs font-semibold text-primary ${dashboard || history ? "" : "invisible"}`}
      >
        {t("viewAll")}
      </button>
    </div>
  );
  if (dashboard && renderCards)
    return renderCards({
      calendar: (
        <section
          className="everyday-calendar dashboard-calendar"
          aria-label={t("title")}
          aria-busy={loading}
        >
          {datesCard}
        </section>
      ),
      recent: recentCard,
    });
  return (
    <section
      className={`everyday-calendar ${dashboard ? "dashboard-calendar" : ""}`}
      aria-label={t("title")}
      aria-busy={loading}
    >
      {!dashboard && modeControl}
      <div
        className={dashboard ? "dashboard-calendar-grid" : "grid gap-5 xl:grid-cols-[1.15fr_1fr]"}
      >
        {datesCard}
        {recentCard}
      </div>
    </section>
  );
}

/** Month/week navigation shares a full-size target and an inset focus boundary. */
function CalendarArrow({
  week = false,
  desktopOnly = false,
  direction,
  label,
  disabled,
  onClick,
}: {
  week?: boolean;
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
      // Palette focus rules may otherwise place the ring over adjacent day cards.
      style={{ outlineOffset: "-2px" }}
      className={`calendar-arrow ${week ? "calendar-week-arrow self-center text-primary" : "text-muted"} disabled:opacity-40 ${desktopOnly ? "hidden lg:inline-flex" : ""}`}
    >
      <Icon size={16} strokeWidth={2} />
    </button>
  );
}
