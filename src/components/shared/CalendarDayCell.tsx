"use client";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useFormatters } from "@/i18n/useFormatters";
import { formatMoneySegments } from "@/lib/format";

/** Overview's Week and Month modes share one cell and already-calculated total.
 * Selection and exact accessible amounts never depend on display abbreviation. */
export function CalendarDayCell({
  date,
  label,
  spendingCents,
  hasRecords,
  intensity,
  selected,
  today,
  outside,
  disabled,
  onSelect,
}: {
  date: string;
  label: string;
  spendingCents: number;
  hasRecords: boolean;
  intensity: number;
  selected: boolean;
  today: boolean;
  outside: boolean;
  disabled: boolean;
  onSelect: (date: string) => void;
}) {
  const fmt = useFormatters();
  const exact = fmt.money(spendingCents);
  return (
    <button
      type="button"
      className="calendar-day calendar-spending-day"
      aria-pressed={selected}
      aria-current={today ? "date" : undefined}
      aria-label={`${label}: ${exact}`}
      title={hasRecords ? exact : undefined}
      data-outside={outside}
      data-has-records={hasRecords}
      data-intensity={intensity}
      data-spending-cents={spendingCents}
      disabled={disabled}
      onClick={() => onSelect(date)}
    >
      <span className="calendar-day-number">{Number(date.slice(-2))}</span>
      {hasRecords ? (
        <CalendarAmount cents={spendingCents} />
      ) : (
        <span className="calendar-day-amount calendar-amount-empty">—</span>
      )}
    </button>
  );
}

/** Try exact text and currency-boundary stacks before compact text. Precision
 * is reduced only as a last resort, visibly marked when a rounded small amount
 * has no compact suffix. Hidden probes are non-interactive. */
function CalendarAmount({ cents }: { cents: number }) {
  const { locale } = useFormatters();
  const candidates = useMemo(() => {
    const exact = formatMoneySegments(cents, { locale });
    const compact = formatMoneySegments(cents, { locale, compact: true });
    const rounded = formatMoneySegments(cents, {
      locale,
      compact: true,
      compactSignificantDigits: 2,
    });
    const minimal = formatMoneySegments(cents, {
      locale,
      compact: true,
      compactSignificantDigits: 1,
    });
    const stacked = (parts: typeof exact, rounded = false) => ({
      ...parts,
      stacked: true,
      before: `${rounded && !parts.abbreviated && parts.value !== exact.value ? "≈" : ""}${parts.before}`,
    });
    const last = stacked(minimal, true);
    // Extremely narrow trailing-currency credit labels may need a separate
    // sign line. Never ellipsize a digit or shrink the readable amount font.
    const separated = last.value.startsWith("−")
      ? { ...last, before: `${last.before}−`, value: last.value.slice(1) }
      : last;
    // Some locales express a million as “100万”. Split at the unit boundary
    // only when even the shortest compact number cannot fit the narrow cell.
    const splitUnit = {
      ...separated,
      value: separated.unit
        ? separated.value.slice(0, -separated.unit.length).trim()
        : separated.value,
      after: separated.unit + (separated.after ? ` ${separated.after}` : ""),
    };
    const combinedUnit = { ...splitUnit, before: "", value: splitUnit.before + splitUnit.value };
    return [
      { ...exact, stacked: false },
      stacked(exact),
      { ...compact, stacked: false },
      stacked(compact),
      stacked(rounded, true),
      last,
      separated,
      combinedUnit,
      splitUnit,
    ];
  }, [cents, locale]);
  const ref = useRef<HTMLSpanElement>(null);
  const [choice, setChoice] = useState(0);
  useLayoutEffect(() => {
    const container = ref.current;
    if (!container) return;
    const fit = () => {
      const width = container.clientWidth;
      if (!width) return;
      const probes = [...container.querySelectorAll<HTMLElement>("[data-calendar-fit]")];
      const match = probes.findIndex((probe) => probe.getBoundingClientRect().width <= width);
      setChoice(match < 0 ? candidates.length - 1 : match);
    };
    fit();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(fit);
    observer?.observe(container);
    return () => observer?.disconnect();
  }, [candidates]);
  const render = (candidate: (typeof candidates)[number]) =>
    candidate.stacked ? (
      <span className="calendar-money-parts">
        {candidate.before && <span>{candidate.before}</span>}
        <span>{candidate.value}</span>
        {candidate.after && <span>{candidate.after}</span>}
      </span>
    ) : (
      candidate.text
    );
  return (
    <span ref={ref} className="calendar-day-amount calendar-readable-amount">
      <span className="calendar-money-label" data-calendar-format={choice}>
        {render(candidates[choice] ?? candidates[0])}
      </span>
      <span className="calendar-money-probes" aria-hidden="true">
        {candidates.map((candidate, index) => (
          <span data-calendar-fit key={index}>
            {render(candidate)}
          </span>
        ))}
      </span>
    </span>
  );
}
