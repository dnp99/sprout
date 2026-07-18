"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { filterTransactions } from "@/lib/search";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** One-click "clear the backlog": runs AI categorization over the user's
 *  uncategorized expenses (cached rules first, then Haiku) and refreshes. Shown
 *  wherever the backlog is visible (web Transactions, mobile Search). Hides
 *  itself when there's nothing uncategorized and no result to report. */
export function CategorizeBacklogButton({ className = "" }: { className?: string }) {
  const { transactions, categorizeBacklog } = useStore(
    useShallow((s) => ({ transactions: s.transactions, categorizeBacklog: s.categorizeBacklog })),
  );
  const count = filterTransactions(transactions, { type: "uncategorized" }).length;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState(false);

  if (count === 0 && !msg) return null;

  async function run() {
    setBusy(true);
    setMsg(null);
    setError(false);
    try {
      const r = await categorizeBacklog();
      setError(false);
      setMsg(
        r.applied > 0
          ? `Categorized ${r.applied} transaction${r.applied === 1 ? "" : "s"} ✨`
          : "Nothing new — the rest need a manual pass.",
      );
    } catch (e) {
      setError(true);
      setMsg(e instanceof Error ? e.message : "Couldn’t categorize right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={run}
        disabled={busy || count === 0}
        // Secondary "soft" treatment: the branded AI nudge sits one level below
        // the solid-primary Add-transaction CTA, so the toolbar has a single
        // clear primary instead of two competing orange buttons.
        className="flex items-center gap-[7px] whitespace-nowrap rounded-[10px] border border-soft-border bg-primary-soft px-[15px] py-[9px] text-[12.5px] font-semibold text-primary transition hover:border-primary disabled:opacity-50"
      >
        <Sparkles size={15} strokeWidth={2} />
        {busy ? "Categorizing…" : `Categorize ${count} with AI`}
      </button>
      {msg && (
        <div
          className={`mt-1.5 text-[12px] font-semibold ${error ? "text-primary-dark" : "text-muted"}`}
        >
          {msg}
        </div>
      )}
    </div>
  );
}
