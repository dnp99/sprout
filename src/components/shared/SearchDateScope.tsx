"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Select } from "@/components/ui/Select";
import { monthSearchBounds } from "@/lib/search-dates";
import { localCalendarDate } from "@/lib/calendar";

/** All dates is explicit. Month/day choices become the same inclusive bounds
 * used by both ledger filters, avoiding a second hidden month restriction. */
export function SearchDateScope({
  from = "",
  to = "",
  month,
  onChange,
}: {
  from?: string;
  to?: string;
  month: string;
  onChange: (from: string, to: string) => void;
}) {
  const t = useTranslations("groups");
  const overview = useTranslations("overview");
  const txns = useTranslations("txns");
  const bounds = from ? monthSearchBounds(from.slice(0, 7)) : null;
  const [mode, setMode] = useState(
    !from && !to
      ? "all"
      : from === to
        ? "day"
        : from === bounds?.from && to === bounds.to
          ? "month"
          : "range",
  );
  const field = "min-h-11 w-full rounded-[10px] border border-edge bg-card px-3 text-base text-ink";
  return (
    <div className="space-y-2">
      <Select
        aria-label={t("searchScope")}
        value={mode}
        className={field}
        onChange={(event) => {
          const next = event.target.value;
          setMode(next);
          if (next === "all") onChange("", "");
          else if (next === "month") {
            const bounds = monthSearchBounds(from.slice(0, 7) || month);
            onChange(bounds.from, bounds.to);
          } else if (next === "day") {
            const day = from || localCalendarDate();
            onChange(day, day);
          } else onChange(from || `${month}-01`, to || `${month}-01`);
        }}
      >
        <option value="all">{t("allDates")}</option>
        <option value="month">{overview("chooseMonth")}</option>
        <option value="day">{overview("chooseDate")}</option>
        <option value="range">{txns("dateRange")}</option>
      </Select>
      {mode === "month" && (
        <input
          type="month"
          aria-label={overview("chooseMonth")}
          value={from.slice(0, 7) || month}
          className={field}
          onChange={(event) => {
            if (event.target.value) {
              const bounds = monthSearchBounds(event.target.value);
              onChange(bounds.from, bounds.to);
            }
          }}
        />
      )}
      {mode === "day" && (
        <input
          type="date"
          aria-label={overview("chooseDate")}
          value={from}
          className={field}
          onChange={(event) => onChange(event.target.value, event.target.value)}
        />
      )}
      {mode === "range" && (
        <div className="grid grid-cols-2 gap-2">
          <input
            type="date"
            aria-label={txns("from")}
            value={from}
            max={to || undefined}
            className={field}
            onChange={(event) => onChange(event.target.value, to)}
          />
          <input
            type="date"
            aria-label={txns("to")}
            value={to}
            min={from || undefined}
            className={field}
            onChange={(event) => onChange(from, event.target.value)}
          />
        </div>
      )}
    </div>
  );
}
