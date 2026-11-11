"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { periodMonthKeys, type TrendPeriod } from "@/lib/reports";
import { Popover } from "@/components/ui/Popover";
import { TrendPeriodToggle } from "./TrendPeriodToggle";
import { ReportPickerSurface } from "./ReportPickerSurface";

/** Period buttons also reopen their month/year picker when already selected.
 * A rolling range is anchored by its ending month, never an invisible day cutoff. */
export function ReportPeriodControl({
  period,
  month,
  onChange,
  disabled = false,
  mobileSheet = false,
}: {
  period: TrendPeriod;
  month: string;
  onChange: (period: TrendPeriod, month: string) => void;
  disabled?: boolean;
  mobileSheet?: boolean;
}) {
  const t = useTranslations("reportPeriod");
  const overview = useTranslations("overview");
  const fmt = useFormatters();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(month);
  const [pickedPeriod, setPickedPeriod] = useState(period);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const yearAnchor = (year: number) => {
    const now = new Date();
    return `${year}-${year === now.getFullYear() ? String(now.getMonth() + 1).padStart(2, "0") : "12"}`;
  };
  const close = useCallback(() => {
    setOpen(false);
    trigger.current?.focus();
  }, []);
  const keys = periodMonthKeys(pickedPeriod, draft);
  return (
    <Popover open={open} onClose={close}>
      <fieldset
        disabled={disabled}
        onClick={(event) => {
          // Labels/icons are shared nested slots; remember their owning trigger
          // so dismissing the picker restores focus after either kind of click.
          const button = event.target instanceof Element ? event.target.closest("button") : null;
          if (button && event.currentTarget.contains(button)) trigger.current = button;
        }}
      >
        <TrendPeriodToggle
          compact
          period={period}
          onChange={(next) => {
            setPickedPeriod(next);
            setDraft(next === "ytd" ? yearAnchor(Number(month.slice(0, 4))) : month);
            setOpen(true);
          }}
        />
      </fieldset>
      {open && (
        <ReportPickerSurface
          mobileSheet={mobileSheet}
          title={t("choosePeriod")}
          onClose={close}
          className="absolute right-0 top-full z-40 mt-1.5 w-[min(280px,calc(100vw-32px))] rounded-[14px] border border-edge bg-card p-3 text-ink shadow-lg"
        >
          <label className="block text-[12px] font-medium">
            {pickedPeriod === "ytd"
              ? overview("chooseYear")
              : pickedPeriod === "month"
                ? overview("chooseMonth")
                : t("endingMonth")}
            {pickedPeriod === "ytd" ? (
              <input
                type="number"
                min={1900}
                max={9999}
                value={draft.slice(0, 4)}
                onChange={(event) => {
                  const year = Number(event.target.value);
                  if (year >= 1900 && year <= 9999) {
                    setDraft(yearAnchor(year));
                  }
                }}
                className="mt-2 min-h-11 w-full rounded-[8px] border border-edge bg-bg px-3 text-base"
              />
            ) : (
              <input
                type="month"
                min="1900-01"
                max="9999-12"
                value={draft}
                onChange={(event) => {
                  if (/^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value))
                    setDraft(event.target.value);
                }}
                className="mt-2 min-h-11 w-full rounded-[8px] border border-edge bg-bg px-3 text-base"
              />
            )}
          </label>
          <p className="my-3 text-[12px] text-muted" aria-live="polite">
            {fmt.monthKey(keys[0])}
            {keys.length > 1 ? ` – ${fmt.monthKey(keys[keys.length - 1])}` : ""}
          </p>
          <button
            type="button"
            className="min-h-11 w-full rounded-[8px] bg-primary px-3 text-[12px] font-semibold text-onprimary"
            onClick={() => {
              onChange(pickedPeriod, draft);
              close();
            }}
          >
            {t("apply")}
          </button>
        </ReportPickerSurface>
      )}
    </Popover>
  );
}
