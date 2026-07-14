"use client";

import { Check, CircleAlert, Clock3, LoaderCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { RecurringCompletionButton } from "@/components/shared/RecurringCompletionButton";
import { RecurringMonthlyProgress } from "@/components/shared/RecurringMonthlyProgress";
import { recurringCalendarGrid } from "@/lib/recurring/calendar";
import type {
  RecurringMonthRow,
  RecurringMonthStatus,
  RecurringMonthSummary,
} from "@/lib/recurring/reconcile";
import { formatMoney } from "@/lib/format";

interface RecurringCalendarViewProps {
  summary: RecurringMonthSummary;
  loading: boolean;
  compact?: boolean;
  onEdit?: (recurringId: string) => void;
  onMarkPaid?: (row: RecurringMonthRow) => void;
  markingOccurrenceId?: string | null;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Calendar renderer for the same reconciled occurrences that power the list.
 *  Selecting a day reveals an agenda below the grid, keeping dense mobile cells
 *  scannable while still giving every occurrence a clear route to editing. */
export function RecurringCalendarView({
  summary,
  loading,
  compact = false,
  onEdit,
  onMarkPaid,
  markingOccurrenceId = null,
}: RecurringCalendarViewProps) {
  const grid = useMemo(() => recurringCalendarGrid(summary.monthKey), [summary.monthKey]);
  const rows = useMemo(
    () => [...summary.upcoming, ...summary.complete, ...summary.unmatched].sort(byDueDate),
    [summary],
  );
  const rowsByDate = useMemo(() => {
    const map = new Map<string, RecurringMonthRow[]>();
    for (const row of rows) map.set(row.dueDate, [...(map.get(row.dueDate) ?? []), row]);
    return map;
  }, [rows]);
  const [selection, setSelection] = useState<{ monthKey: string; dateKey: string | null }>({
    monthKey: summary.monthKey,
    dateKey: null,
  });
  // A new month starts on its first scheduled day without an effect-triggered
  // state update; a user-selected day stays selected while its month is active.
  const selectedDate =
    selection.monthKey === summary.monthKey
      ? (selection.dateKey ?? rows[0]?.dueDate ?? null)
      : (rows[0]?.dueDate ?? null);

  const selectedRows = selectedDate ? (rowsByDate.get(selectedDate) ?? []) : [];
  if (loading) {
    return (
      <div
        className={`flex min-h-[220px] items-center justify-center border border-edge ${
          compact ? "rounded-[10px]" : "rounded-[14px]"
        }`}
      >
        <div className="flex items-center gap-2 text-[12px] font-medium text-muted">
          <LoaderCircle size={15} strokeWidth={2} className="animate-spin" />
          Checking this month&apos;s transactions…
        </div>
      </div>
    );
  }
  return (
    <div>
      <RecurringMonthlyProgress summary={summary} compact={compact} />
      <div
        className={`mt-3 overflow-hidden border border-edge ${compact ? "rounded-[10px]" : "rounded-[14px]"}`}
      >
        <div className="grid grid-cols-7 border-b border-edge bg-track">
          {WEEKDAYS.map((weekday) => (
            <div
              key={weekday}
              className={`py-2 text-center font-semibold uppercase tracking-[.04em] text-muted ${
                compact ? "text-[8px]" : "text-[10px]"
              }`}
            >
              {compact ? weekday.charAt(0) : weekday}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {grid.map((day, index) => {
            const dayRows = day ? (rowsByDate.get(day.dateKey) ?? []) : [];
            const active = day?.dateKey === selectedDate;
            return day ? (
              <button
                key={day.dateKey}
                type="button"
                onClick={() => setSelection({ monthKey: summary.monthKey, dateKey: day.dateKey })}
                className={`min-w-0 border-b border-r border-edge text-left transition hover:bg-track ${
                  compact ? "min-h-[58px] p-1" : "min-h-[94px] p-2"
                } ${active ? "bg-primary-soft" : "bg-card"}`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full font-semibold tabular-nums ${
                    compact ? "text-[9px]" : "text-[11px]"
                  } ${active ? "bg-primary text-onprimary" : "text-muted"}`}
                >
                  {day.dayOfMonth}
                </div>
                {compact ? <CalendarDots rows={dayRows} /> : <CalendarChips rows={dayRows} />}
              </button>
            ) : (
              <div
                key={`empty-${index}`}
                className={`border-b border-r border-edge bg-bg ${compact ? "min-h-[58px]" : "min-h-[94px]"}`}
              />
            );
          })}
        </div>
      </div>

      <DayAgenda
        rows={selectedRows}
        compact={compact}
        onEdit={onEdit}
        onMarkPaid={onMarkPaid}
        markingOccurrenceId={markingOccurrenceId}
      />
    </div>
  );
}

function CalendarDots({ rows }: { rows: RecurringMonthRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-0.5">
      {rows.slice(0, 4).map((row) => (
        <span
          key={row.occurrenceId}
          className={`h-1.5 w-1.5 rounded-full ${statusFill(row.status)}`}
        />
      ))}
      {rows.length > 4 && (
        <span className="text-[8px] font-semibold text-muted">+{rows.length - 4}</span>
      )}
    </div>
  );
}

function CalendarChips({ rows }: { rows: RecurringMonthRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="mt-1.5 space-y-1">
      {rows.slice(0, 2).map((row) => (
        <div
          key={row.occurrenceId}
          className={`flex min-w-0 items-center gap-1 rounded px-1 py-0.5 text-[9px] font-medium ${statusChip(row.status)}`}
        >
          <span>{row.emoji}</span>
          <span className="truncate">{row.name}</span>
        </div>
      ))}
      {rows.length > 2 && (
        <div className="px-1 text-[9px] font-medium text-muted">+{rows.length - 2} more</div>
      )}
    </div>
  );
}

function DayAgenda({
  rows,
  compact,
  onEdit,
  onMarkPaid,
  markingOccurrenceId,
}: {
  rows: RecurringMonthRow[];
  compact: boolean;
  onEdit?: (recurringId: string) => void;
  onMarkPaid?: (row: RecurringMonthRow) => void;
  markingOccurrenceId: string | null;
}) {
  if (rows.length === 0) {
    return (
      <p
        className={`mt-3 text-center font-medium text-muted ${compact ? "text-[10.5px]" : "text-[11.5px]"}`}
      >
        No recurring items due on this day.
      </p>
    );
  }
  return (
    <div
      className={`mt-3 overflow-hidden border border-edge ${compact ? "rounded-[10px]" : "rounded-[14px]"}`}
    >
      {rows.map((row) => {
        const content = (
          <>
            <span className={compact ? "text-[17px]" : "text-[19px]"}>{row.emoji}</span>
            <div className="min-w-0 flex-1">
              <div
                className={`${compact ? "text-[12px]" : "text-[13px]"} truncate font-semibold text-ink`}
              >
                {row.name}
              </div>
              <div
                className={`mt-0.5 flex items-center gap-1 ${compact ? "text-[9.5px]" : "text-[10.5px]"} font-medium ${statusText(row.status)}`}
              >
                <StatusIcon status={row.status} compact={compact} />
                {agendaStatusLabel(row)}
              </div>
            </div>
            <div
              className={`${compact ? "text-[12px]" : "text-[13px]"} font-semibold tabular-nums ${row.isIncome ? "text-green" : "text-ink"}`}
            >
              {formatMoney(row.amountCents, { signed: row.isIncome })}
            </div>
          </>
        );
        const rowClassName = `flex min-w-0 flex-1 items-center gap-3 text-left ${compact ? "px-3 py-2.5" : "px-4 py-3"}`;
        const showCompletionAction = row.status === "unmatched" && onMarkPaid;
        const action = (
          <RecurringCompletionButton
            row={row}
            compact={compact}
            marking={markingOccurrenceId === row.occurrenceId}
            onMarkPaid={onMarkPaid}
          />
        );
        return (
          <div
            key={row.occurrenceId}
            className="flex items-center border-b border-edge last:border-b-0"
          >
            {onEdit ? (
              <button
                type="button"
                onClick={() => onEdit(row.recurringId)}
                className={rowClassName}
              >
                {content}
              </button>
            ) : (
              <div className={rowClassName}>{content}</div>
            )}
            {showCompletionAction && <div className={compact ? "pr-2" : "pr-3"}>{action}</div>}
          </div>
        );
      })}
    </div>
  );
}

function byDueDate(a: RecurringMonthRow, b: RecurringMonthRow): number {
  return a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name);
}

function StatusIcon({ status, compact }: { status: RecurringMonthStatus; compact: boolean }) {
  const size = compact ? 11 : 12;
  if (status === "complete") return <Check size={size} strokeWidth={2.5} />;
  if (status === "unmatched") return <CircleAlert size={size} strokeWidth={2.2} />;
  return <Clock3 size={size} strokeWidth={2.2} />;
}

function agendaStatusLabel(row: RecurringMonthRow): string {
  if (row.status === "complete") return row.isIncome ? "Received" : "Paid";
  if (row.status === "unmatched") return "Needs review";
  return `Due ${row.relativeLabel}`;
}

function statusFill(status: RecurringMonthStatus): string {
  if (status === "complete") return "bg-green";
  if (status === "unmatched") return "bg-primary";
  return "bg-muted";
}

function statusChip(status: RecurringMonthStatus): string {
  if (status === "complete") return "bg-green/10 text-green";
  if (status === "unmatched") return "bg-primary-soft text-primary";
  return "bg-track text-muted";
}

function statusText(status: RecurringMonthStatus): string {
  if (status === "complete") return "text-green";
  if (status === "unmatched") return "text-primary";
  return "text-muted";
}
