"use client";

import { Bills as LedgerBills } from "@/components/web/views/Bills";

/** Reuse the scoped ledger workspace so personal/group controls and dialogs
 * cannot drift. Month context is owned by the surrounding shell. */
export function Bills() {
  return (
    <div className="px-4 pb-8">
      <LedgerBills personalMobile />
    </div>
  );
}
