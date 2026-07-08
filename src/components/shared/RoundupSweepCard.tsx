"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
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
          💰 {formatMoney(available)} in spare change
        </div>
        <div className="mt-1 text-[12px] font-semibold text-muted">
          Turn on “Round-up destination” when editing a goal to collect it.
        </div>
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
          ? `Added ${formatMoney(r.sweptCents)} to ${target?.name} ✨`
          : "No spare change to round up yet.",
      );
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Couldn’t sweep round-ups.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-2xl bg-card p-4 ${className}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[13px] font-extrabold text-ink">Round up spare change</div>
          <div className="mt-0.5 truncate text-[12px] font-semibold text-muted">
            {formatMoney(available)} available → {target.emoji} {target.name}
          </div>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={busy || available <= 0}
          className="whitespace-nowrap rounded-xl bg-primary px-3.5 py-2 text-[12.5px] font-extrabold text-white disabled:opacity-50"
        >
          {busy ? "Rounding…" : "Round up"}
        </button>
      </div>
      {msg && <div className="mt-2 text-[12px] font-semibold text-muted">{msg}</div>}
    </div>
  );
}
