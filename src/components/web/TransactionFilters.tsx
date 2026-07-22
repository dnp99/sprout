"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useStore } from "@/state/store";

/** Advanced-filter popover for the Transactions toolbar (plan 017 B1): date
 *  range + amount range, on top of the type pills + category rail. State lives in
 *  the store so it's shared and saveable (saved views, B2). */
export function TransactionFilters() {
  const t = useTranslations("txns");
  const { webDateFrom, webDateTo, webAmountMin, webAmountMax, set } = useStore(
    useShallow((s) => ({
      webDateFrom: s.webDateFrom,
      webDateTo: s.webDateTo,
      webAmountMin: s.webAmountMin,
      webAmountMax: s.webAmountMax,
      set: s.set,
    })),
  );
  const [open, setOpen] = useState(false);

  const dateActive = Boolean(webDateFrom || webDateTo);
  const amountActive = Boolean(webAmountMin || webAmountMax);
  const count = (dateActive ? 1 : 0) + (amountActive ? 1 : 0);

  const clear = () => set({ webDateFrom: "", webDateTo: "", webAmountMin: "", webAmountMax: "" });

  const field =
    "w-full rounded-[8px] border border-edge bg-card px-2.5 py-1.5 text-[12.5px] font-medium text-ink outline-none transition focus:border-primary";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-[13px] py-[7px] text-[12px] font-medium transition ${
          count > 0 ? "bg-primary text-onprimary" : "border border-edge text-muted hover:text-ink"
        }`}
      >
        <SlidersHorizontal size={13} strokeWidth={2} />
        {t("filters")}
        {count > 0 && <span className="tabular-nums">· {count}</span>}
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[300px] rounded-[14px] border border-edge bg-card p-3.5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-bold uppercase tracking-[0.05em] text-muted">
                {t("filters")}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-[6px] text-muted transition hover:bg-track hover:text-ink"
                aria-label={t("close")}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            <div className="mt-3">
              <div className="text-[11px] font-semibold text-muted">{t("dateRange")}</div>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={webDateFrom}
                  onChange={(e) => set({ webDateFrom: e.target.value })}
                  className={field}
                  aria-label={t("from")}
                />
                <input
                  type="date"
                  value={webDateTo}
                  onChange={(e) => set({ webDateTo: e.target.value })}
                  className={field}
                  aria-label={t("to")}
                />
              </div>
            </div>

            <div className="mt-3">
              <div className="text-[11px] font-semibold text-muted">{t("amountRange")}</div>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={webAmountMin}
                  onChange={(e) => set({ webAmountMin: e.target.value })}
                  placeholder={t("min")}
                  className={field}
                  aria-label={t("min")}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={webAmountMax}
                  onChange={(e) => set({ webAmountMax: e.target.value })}
                  placeholder={t("max")}
                  className={field}
                  aria-label={t("max")}
                />
              </div>
              <div className="mt-1 text-[11px] font-medium text-subtle">{t("amountHint")}</div>
            </div>

            {count > 0 && (
              <button
                type="button"
                onClick={clear}
                className="mt-3 w-full rounded-[9px] border border-edge py-2 text-[12px] font-semibold text-muted transition hover:text-ink"
              >
                {t("clearFilters")}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

/** Parse a dollar-string amount bound (e.g. "60", "12.50") to a magnitude in
 *  cents, or null when empty/invalid. Exported for the table's filter build. */
export function amountBoundToCents(value: string): number | null {
  const n = Number.parseFloat(value);
  if (!value.trim() || n !== n) return null;
  return Math.round(Math.abs(n) * 100);
}
