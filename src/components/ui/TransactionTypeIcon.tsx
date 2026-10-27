import { ArrowDownLeft, ArrowUpRight, CornerDownLeft, Tag, Ban } from "lucide-react";
import type { TxnFilter } from "@/lib/types";

/** Shared filter symbols keep desktop and phone controls in the same icon language. */
export function TransactionTypeIcon({ type }: { type: TxnFilter }) {
  const Icon = {
    all: null,
    expense: ArrowUpRight,
    income: ArrowDownLeft,
    reimbursement: CornerDownLeft,
    uncategorized: Tag,
    excluded: Ban,
  }[type];
  return Icon ? (
    <Icon size={14} strokeWidth={2} aria-hidden="true" className="mr-1 inline-block align-middle" />
  ) : null;
}
