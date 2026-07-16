import type { Transaction } from "@/lib/types";

/** Small badges that mark a transaction as excluded from budget (internal move)
 *  or as having had its spare change swept into a goal. Renders nothing for an
 *  ordinary transaction. Shared by the web table + mobile card. */
export function TxnTags({ txn, className = "" }: { txn: Transaction; className?: string }) {
  if (!txn.excludeFromBudget && !txn.roundupSwept) return null;
  return (
    <span className={`inline-flex flex-none items-center gap-1 ${className}`}>
      {txn.excludeFromBudget && (
        <span className="rounded-full border border-primary bg-transparent px-1.5 py-px text-[9.5px] font-extrabold uppercase tracking-wide text-primary-dark">
          Excluded
        </span>
      )}
      {txn.roundupSwept && (
        // Common after a sweep — keep it to a subtle coin, not a text pill.
        <span title="Spare change swept to a goal" className="text-[11px] leading-none opacity-70">
          🪙
        </span>
      )}
    </span>
  );
}
