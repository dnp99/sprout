"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/state/store";
import { Checkbox } from "@/components/ui/Checkbox";
import { Select } from "@/components/ui/Select";
import { monthRange, weekRange, type SplitRange } from "@/lib/groups/split-range";
import { Field, GroupDialog, inputClass, buttonClass, primaryClass } from "./ui";

function SplitPeriodFields({
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
  const [mode, setMode] = useState(() =>
    ranges.length &&
    ranges.every((r) => JSON.stringify(r) === JSON.stringify(monthRange(r.from.slice(0, 7))))
      ? "months"
      : "custom",
  );
  const [week, setWeek] = useState(`${month}-01`);
  const [from, setFrom] = useState(ranges[0]?.from ?? `${month}-01`);
  const [to, setTo] = useState(ranges[0]?.to ?? monthRange(month).to);
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
        <div className="flex flex-wrap gap-2">
          {months.map((value) => {
            const range = monthRange(value),
              checked = ranges.some((r) => r.from === range.from && r.to === range.to);
            return (
              <div
                key={value}
                className={`flex min-h-11 items-center gap-1 rounded-[10px] border border-edge px-2 ${checked ? "bg-primary-soft" : "bg-card"}`}
              >
                <Checkbox
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggle(range)}
                  label={new Date(`${value}-01T12:00:00Z`).toLocaleDateString(locale, {
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                  className="min-h-11 min-w-11 justify-center"
                />
                <span className="pr-2 text-meta">
                  {new Date(`${value}-01T12:00:00Z`).toLocaleDateString(locale, {
                    month: "short",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {mode === "weeks" && (
        <>
          <div className="flex flex-wrap items-end gap-2">
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
              <div
                key={r.from}
                className="flex min-w-0 items-center gap-2 rounded-[10px] border border-edge bg-card pr-2"
              >
                <Checkbox
                  checked
                  disabled={disabled}
                  label={`${r.from} – ${r.to}`}
                  onChange={() => toggle(r)}
                  className="min-h-11 min-w-11 justify-center"
                />
                <span className="break-words text-meta">
                  {r.from} – {r.to}
                </span>
              </div>
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

/** Phones edit a draft period before applying; desktop keeps the same fields
 * inline. Neither presentation remounts the record decision model. */
export function SplitPeriodPicker(props: Parameters<typeof SplitPeriodFields>[0]) {
  const t = useTranslations("groups");
  const [draft, setDraft] = useState<SplitRange[] | null>(null);
  const valid = !!draft?.length && draft.every((r) => r.from && r.to && r.from <= r.to);
  const summary =
    props.ranges.length === 1
      ? `${props.ranges[0].from} – ${props.ranges[0].to}`
      : t("splitPeriodsSelected", { count: props.ranges.length });
  return (
    <>
      <div className="split-period-compact">
        <p className="text-meta font-semibold text-muted">{t("splitPeriod")}</p>
        <button
          type="button"
          data-period-open
          disabled={props.disabled}
          className={`${buttonClass} mt-1 w-full flex-wrap justify-between text-left`}
          onClick={() => setDraft(props.ranges.map((r) => ({ ...r })))}
        >
          <span className="min-w-0 break-words">{summary}</span>
          <span className="text-primary">{t("splitChangePeriod")}</span>
        </button>
      </div>
      <div className="split-period-inline">
        <SplitPeriodFields {...props} />
      </div>
      {draft && (
        <GroupDialog
          title={t("splitPeriod")}
          mobileFullScreen
          width={480}
          onClose={() => setDraft(null)}
        >
          <div className="space-y-4 pt-2">
            <SplitPeriodFields {...props} ranges={draft} onChange={setDraft} />
            {!valid && (
              <p role="alert" className="text-meta text-danger">
                {t("splitChoosePeriod")}
              </p>
            )}
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" className={buttonClass} onClick={() => setDraft(null)}>
                {t("cancel")}
              </button>
              <button
                type="button"
                className={primaryClass}
                disabled={!valid || props.disabled}
                onClick={() => {
                  props.onChange(draft);
                  setDraft(null);
                }}
              >
                {t("splitUseDates")}
              </button>
            </div>
          </div>
        </GroupDialog>
      )}
    </>
  );
}
