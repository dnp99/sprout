"use client";

import { IconAction } from "@/components/ui/IconAction";
import { formatMoney } from "@/lib/format";

/** Keep editing beside the budget identity, inside its summary card, so the
 * action remains discoverable without scanning past allocation and spending. */
export function MonthlyBudgetHeading({
  amountCents,
  label,
  editLabel,
  onEdit,
}: {
  amountCents: number;
  label: string;
  editLabel: string;
  onEdit: () => void;
}) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_44px] grid-rows-[auto_auto] gap-x-3 gap-y-1">
      <div className="col-start-1 row-start-1 text-[11px] font-semibold uppercase leading-4 tracking-[0.05em] text-muted">
        {label}
      </div>
      {/* Span both rows so the 44px target cannot stretch the label row;
          keep the button inside the heading's top edge. */}
      <IconAction
        action="edit"
        label={editLabel}
        onClick={onEdit}
        className="cozy-budget-edit col-start-2 row-span-2 row-start-1 self-start rounded-[10px] border border-edge bg-card text-ink transition hover:border-primary hover:text-primary"
      />
      <div
        className="col-start-1 row-start-2 min-w-0 break-words text-[28px] font-bold leading-tight tracking-[-0.03em] tabular-nums text-ink lg:text-[36px]"
        title={formatMoney(amountCents)}
      >
        {formatMoney(amountCents)}
      </div>
    </div>
  );
}
