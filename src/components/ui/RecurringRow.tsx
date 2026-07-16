"use client";

import { useTranslations } from "next-intl";
import { useRecurringFrequencyLabel } from "@/components/shared/useRecurringLabels";
import { useFormatters } from "@/i18n/useFormatters";
import type { RecurringItem } from "@/lib/types";
import { Toggle } from "./controls";

/** A recurring item row with a pause toggle. `divider` renders it inside a card
 *  with a bottom border (web); otherwise it's a standalone card (mobile). When
 *  `onEdit` is passed, the row body is tappable to edit. */
export function RecurringRow({
  item,
  onToggle,
  onEdit,
  divider = false,
}: {
  item: RecurringItem;
  onToggle: () => void;
  onEdit?: () => void;
  divider?: boolean;
}) {
  const t = useTranslations("bills");
  const fmt = useFormatters();
  const frequencyLabel = useRecurringFrequencyLabel();
  const active = !item.paused;

  const body = (
    <>
      <span className="text-xl">{item.emoji}</span>
      <div className="flex-1">
        <div className="text-sm font-extrabold text-ink">{item.name}</div>
        <div className="text-[11px] font-bold text-muted">
          {active ? frequencyLabel(item) : t("paused")}
        </div>
      </div>
      <span
        className={`text-sm font-extrabold tabular-nums ${item.isIncome ? "text-[#4f7a3a]" : "text-ink"}`}
      >
        {fmt.money(item.amountCents, { signed: true })}
      </span>
    </>
  );

  return (
    <div
      className={`flex items-center gap-3 ${
        divider ? "border-b border-[#f7efe3] py-3 last:border-0" : "rounded-2xl bg-card px-4 py-3"
      }`}
      style={{ opacity: active ? 1 : 0.5 }}
    >
      {onEdit ? (
        <button type="button" onClick={onEdit} className="flex flex-1 items-center gap-3 text-left">
          {body}
        </button>
      ) : (
        <div className="flex flex-1 items-center gap-3">{body}</div>
      )}
      <Toggle on={active} onClick={onToggle} />
    </div>
  );
}
