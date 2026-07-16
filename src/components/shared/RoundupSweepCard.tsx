"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { availableRoundupsCents } from "@/lib/roundups";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** "Round up spare change" sweep, shown on the Goals screens. Totals the
 *  unswept spare change on the user's expenses and, on tap, adds it to the
 *  designated round-up goal. Nudges the user to pick a destination if none is
 *  set. Hides entirely when there's nothing to collect and no goals. */
export function RoundupSweepCard({ className = "" }: { className?: string }) {
  const { transactions, goals, sweepRoundups } = useStore(
    useShallow((s) => ({
      transactions: s.transactions,
      goals: s.goals,
      sweepRoundups: s.sweepRoundups,
    })),
  );
  const t = useTranslations("goals.roundup");
  const fmt = useFormatters();
  const target = goals.find((g) => g.isRoundupTarget);
  const available = availableRoundupsCents(transactions);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // No destination yet: nudge only when there's change worth collecting.
  if (!target) {
    if (available <= 0 || goals.length === 0) return null;
    return (
      <div className={`rounded-2xl bg-card p-4 ${className}`}>
        <div className="text-[13px] font-extrabold text-ink">
          {t("spareChange", { amount: fmt.money(available) })}
        </div>
        <div className="mt-1 text-[12px] font-semibold text-muted">{t("spareChangeHint")}</div>
      </div>
    );
  }

  async function run() {
    setBusy(true);
    setMsg(null);
    try {
      const r = await sweepRoundups();
      setMsg(
        r.sweptCents > 0
          ? t("added", { amount: fmt.money(r.sweptCents), name: target?.name ?? "" })
          : t("nothingYet"),
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : t("sweepError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-2xl bg-card p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold text-ink">{t("title")}</div>
          <div className="mt-0.5 truncate text-[12px] font-semibold text-muted">
            {t("available", {
              amount: fmt.money(available),
              emoji: target.emoji,
              name: target.name,
            })}
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy || available <= 0}
          className="whitespace-nowrap rounded-xl bg-primary px-3.5 py-2 text-[12.5px] font-extrabold text-white disabled:opacity-50"
        >
          {busy ? t("rounding") : t("roundUp")}
        </button>
      </div>
      {msg && <div className="mt-2 text-[12px] font-semibold text-muted">{msg}</div>}
    </div>
  );
}
