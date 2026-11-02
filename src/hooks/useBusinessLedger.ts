"use client";
import { useEffect } from "react";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

/** Business scopes load complete server pages; ordinary browsing keeps its current working set. */
export function useBusinessLedger() {
  const { id, userId, transactions, ledger, load } = useStore(
    useShallow((s) => ({
      id: s.txnBusinessId ?? "all",
      userId: s.user.id,
      transactions: s.transactions,
      ledger: s.businessLedger,
      load: s.loadBusinessLedger,
    })),
  );
  useEffect(() => {
    if (id !== "all") void load(id);
  }, [id, userId, transactions, load]);
  return id === "all"
    ? transactions
    : ledger?.id === id && ledger.userId === userId
      ? ledger.rows
      : [];
}
