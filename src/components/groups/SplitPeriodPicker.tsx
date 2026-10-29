"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { Select } from "@/components/ui/Select";
import { monthRange, weekRange, type SplitRange } from "@/lib/groups/split-range";
import { Field, inputClass, buttonClass } from "./ui";

export function SplitPeriodPicker({
  month,
  months,
  ranges,
  onChange,
  disabled,
}: {
  month: string;
  months: string[];
  ranges: SplitRange[];
  onChange: (ranges: SplitRange[]) => void;
  disabled: boolean;
}) {
  const t = useTranslations("groups");
  const locale = useStore((s) => s.locale);
  const [mode, setMode] = useState("months");
  const [week, setWeek] = useState(`${month}-01`);
  const [from, setFrom] = useState(`${month}-01`);
  const [to, setTo] = useState(monthRange(month).to);
  const toggle = (range: SplitRange) =>
    onChange(
      ranges.some((r) => r.from === range.from && r.to === range.to)
        ? ranges.filter((r) => r.from !== range.from || r.to !== range.to)
        : [...ranges, range],
    );
  return (
    <fieldset disabled={disabled} className="space-y-3">
      <Field label={t("splitPeriod")}>
        <Select
          aria-label={t("splitPeriod")}
          value={mode}
          className={inputClass}
          onChange={(e) => {
            setMode(e.target.value);
            onChange(
              e.target.value === "months"
                ? [monthRange(month)]
                : e.target.value === "weeks"
                  ? [weekRange(week)]
                  : [{ from, to }],
            );
          }}
        >
          <option value="months">{t("splitByMonth")}</option>
          <option value="weeks">{t("splitByWeek")}</option>
          <option value="custom">{t("splitCustom")}</option>
        </Select>
      </Field>
      {mode === "months" && (
        <div className="flex max-h-44 flex-wrap gap-2 overflow-y-auto">
          {months.map((value) => {
            const range = monthRange(value),
              checked = ranges.some((r) => r.from === range.from && r.to === range.to);
            return (
              <label key={value} className={`${buttonClass} ${checked ? "bg-primary-soft" : ""}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(range)} />
                {new Date(`${value}-01T12:00:00Z`).toLocaleDateString(locale, {
                  month: "short",
                  year: "numeric",
                  timeZone: "UTC",
                })}
              </label>
            );
          })}
        </div>
      )}
      {mode === "weeks" && (
        <>
          <div className="flex items-end gap-2">
            <Field label={t("weekContaining")}>
              <input
                type="date"
                required
                className={inputClass}
                value={week}
                onChange={(e) => setWeek(e.target.value)}
              />
            </Field>
            <button
              type="button"
              className={buttonClass}
              disabled={!week}
              onClick={() => {
                const range = weekRange(week);
                if (!ranges.some((r) => r.from === range.from)) onChange([...ranges, range]);
              }}
            >
              {t("addWeek")}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {ranges.map((r) => (
              <label key={r.from} className={buttonClass}>
                <input type="checkbox" checked onChange={() => toggle(r)} />
                {r.from} – {r.to}
              </label>
            ))}
          </div>
        </>
      )}
      {mode === "custom" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("splitFrom")}>
            <input
              type="date"
              className={inputClass}
              value={from}
              max={to}
              onChange={(e) => {
                setFrom(e.target.value);
                onChange([{ from: e.target.value, to }]);
              }}
            />
          </Field>
          <Field label={t("splitTo")}>
            <input
              type="date"
              className={inputClass}
              value={to}
              min={from}
              onChange={(e) => {
                setTo(e.target.value);
                onChange([{ from, to: e.target.value }]);
              }}
            />
          </Field>
        </div>
      )}
    </fieldset>
  );
}
