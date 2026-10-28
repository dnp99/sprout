"use client";

import { useCallback, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { calendarDays } from "@/lib/calendar";
import { shiftMonthKey } from "@/lib/trends";
import { Popover } from "@/components/ui/Popover";
import { MonthSelector } from "./MonthSelector";

/** Month/year modes share a small calendar. Picking a day is an explicit
 * reporting cutoff, while month selection keeps the existing full-period rules. */
export function ReportDateControl({
  month,
  date,
  yearly,
  onMonthChange,
  onSelect,
}: {
  month: string;
  date?: string;
  yearly: boolean;
  onMonthChange: (month: string) => void;
  onSelect: (month: string, date?: string) => void;
}) {
  const t = useTranslations("overview");
  const fmt = useFormatters();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);
  const [view, setView] = useState(month);
  const [stage, setStage] = useState<"days" | "months" | "years">("days");
  const [position, setPosition] = useState({ above: false, left: 0, width: 340, maxHeight: 420 });
  const year = Number(view.slice(0, 4));
  const days = calendarDays(view);
  const today = new Date().toISOString().slice(0, 10);
  const dateLabel = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(fmt.locale, { ...options, timeZone: "UTC" }).format(
      new Date(value + "T12:00:00Z"),
    );
  function choose(value: string, exact?: string) {
    onSelect(value, exact);
    close();
  }
  function shift(direction: number) {
    setView(
      stage === "days"
        ? shiftMonthKey(view, direction)
        : `${year + direction * (stage === "years" ? 12 : 1)}-${view.slice(5, 7)}`,
    );
  }
  return (
    <Popover open={open} onClose={close} className="relative">
      <MonthSelector
        compact
        label={
          date && !yearly
            ? dateLabel(date, { year: "numeric", month: "short", day: "numeric" })
            : fmt.monthKey(month)
        }
        ariaLabel={t("categoryPeriod")}
        onPrevious={() => {
          setOpen(false);
          onMonthChange(shiftMonthKey(month, -1));
        }}
        onNext={() => {
          setOpen(false);
          onMonthChange(shiftMonthKey(month, 1));
        }}
        trailing={
          <button
            ref={trigger}
            type="button"
            aria-label={t("chooseDate")}
            aria-expanded={open}
            aria-haspopup="dialog"
            className="flex min-h-11 w-10 items-center justify-center rounded-[9px] text-ink hover:bg-track"
            onClick={(event) => {
              const rect = event.currentTarget.parentElement!.getBoundingClientRect();
              const width = Math.min(340, window.innerWidth - 24);
              const above = rect.top > window.innerHeight - rect.bottom;
              setPosition({
                above,
                width,
                left: Math.max(
                  12 - rect.left,
                  Math.min(0, window.innerWidth - 12 - rect.left - width),
                ),
                maxHeight: Math.max(
                  160,
                  Math.min(440, (above ? rect.top : window.innerHeight - rect.bottom) - 16),
                ),
              });
              setView(month);
              setStage(yearly ? "months" : "days");
              setOpen(!open);
            }}
          >
            <CalendarDays size={16} strokeWidth={2} />
          </button>
        }
      />
      {open && (
        <div
          role="dialog"
          aria-label={t("chooseDate")}
          className="report-date-popover absolute z-40 overflow-auto rounded-[14px] border border-edge p-3 text-ink shadow-lg"
          style={{
            width: position.width,
            left: position.left,
            maxHeight: position.maxHeight,
            ...(position.above ? { bottom: "calc(100% + 6px)" } : { top: "calc(100% + 6px)" }),
          }}
        >
          <div className="flex items-center justify-between gap-1">
            <button
              type="button"
              aria-label={t("previousDateRange")}
              onClick={() => shift(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-[8px] hover:bg-track"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label={t("chooseMonth")}
                onClick={() => setStage("months")}
                className="min-h-11 rounded-[8px] px-2 text-[13px] font-semibold hover:bg-track"
              >
                {fmt.shortMonthKey(view)}
              </button>
              <button
                type="button"
                aria-label={t("chooseYear")}
                onClick={() => setStage("years")}
                className="min-h-11 rounded-[8px] px-2 text-[13px] font-semibold hover:bg-track"
              >
                {year}
              </button>
            </div>
            <button
              type="button"
              aria-label={t("nextDateRange")}
              onClick={() => shift(1)}
              className="flex h-11 w-11 items-center justify-center rounded-[8px] hover:bg-track"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          {stage === "years" ? (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 12 }, (_, i) => year - 5 + i).map((value) => (
                <button
                  key={value}
                  type="button"
                  className="report-date-cell min-h-11 rounded-[8px] text-[13px]"
                  onClick={() => {
                    setView(`${value}-${view.slice(5, 7)}`);
                    setStage("months");
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          ) : stage === "months" ? (
            <div className="grid grid-cols-3 gap-1">
              {Array.from(
                { length: 12 },
                (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`,
              ).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={fmt.monthKey(value)}
                  aria-pressed={value === month}
                  className="report-date-cell min-h-11 rounded-[8px] text-[13px]"
                  onClick={() => {
                    if (yearly) choose(value);
                    else {
                      setView(value);
                      setStage("days");
                    }
                  }}
                >
                  {fmt.shortMonthKey(value)}
                </button>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-0.5">
              {days.slice(0, 7).map((value) => (
                <span key={value} className="py-2 text-center text-[10px] text-muted">
                  {dateLabel(value, { weekday: "short" })}
                </span>
              ))}
              {days.map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={dateLabel(value, { dateStyle: "full" })}
                  aria-pressed={date === value}
                  aria-current={value === today ? "date" : undefined}
                  disabled={!value.startsWith(view)}
                  onClick={() => choose(view, value)}
                  className="report-date-cell min-h-11 rounded-[8px] text-[12px] tabular-nums disabled:opacity-25"
                >
                  {Number(value.slice(-2))}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-edge pt-2">
            <button
              type="button"
              onClick={() => choose(today.slice(0, 7), yearly ? undefined : today)}
              className="min-h-11 rounded-[8px] px-2 text-[12px] font-semibold hover:bg-track"
            >
              {t("dateToday")}
            </button>
            {!yearly && (
              <button
                type="button"
                onClick={() => choose(view)}
                className="min-h-11 rounded-[8px] px-2 text-[12px] font-semibold hover:bg-track"
              >
                {t("fullMonth")}
              </button>
            )}
          </div>
        </div>
      )}
    </Popover>
  );
}
