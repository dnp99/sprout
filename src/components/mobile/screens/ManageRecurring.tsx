"use client";

import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { EditRecurringForm } from "@/components/shared/EditRecurringForm";
import { RecurringRow } from "@/components/ui/RecurringRow";
import { BackButton, ScreenHeader } from "@/components/ui/headers";
import { useTranslations } from "next-intl";
import { useFormatters } from "@/i18n/useFormatters";
import { recurringTotals } from "@/lib/budget";
import type { RecurringItem } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";

export function ManageRecurring() {
  const { recurring, goMobile, toggleRecurring } = useStore(
    useShallow((s) => ({
      recurring: s.recurring,
      goMobile: s.goMobile,
      toggleRecurring: s.toggleRecurring,
    })),
  );
  const t = useTranslations("bills");
  const fmt = useFormatters();
  const { incomeCents, outCents, activeCount } = recurringTotals(recurring);
  const [editing, setEditing] = useState<RecurringItem | "new" | null>(null);

  if (editing) {
    return (
      <div className="px-[22px] pt-3">
        <ScreenHeader
          title={editing === "new" ? t("newRecurring") : t("editRecurring")}
          onBack={() => setEditing(null)}
        />
        <div className="mt-5">
          <EditRecurringForm
            item={editing === "new" ? undefined : editing}
            onDone={() => setEditing(null)}
          />
        </div>
      </div>
    );
  }

  const isEmpty = recurring.length === 0;

  return (
    <div className="flex flex-1 flex-col px-4 pt-1">
      <div className="flex items-center gap-1">
        <BackButton onClick={() => goMobile("bills")} />
        <span className="text-[20px] font-bold tracking-[-.02em] text-ink">
          {t("recurringTitle")}
        </span>
      </div>

      <div className="mt-3 flex gap-2.5">
        <div className="flex-1 rounded-[10px] bg-green/10 px-3 py-2.5">
          <div className="text-[9.5px] font-semibold uppercase tracking-[.04em] text-muted">
            {t("incomePerMonth")}
          </div>
          <div className="mt-0.5 whitespace-nowrap text-[16px] font-bold tracking-[-.02em] tabular-nums text-green">
            {fmt.money(incomeCents, { signed: true })}
          </div>
        </div>
        <div className="flex-1 rounded-[10px] border border-edge px-3 py-2.5">
          <div className="text-[9.5px] font-semibold uppercase tracking-[.04em] text-muted">
            {t("outPerMonth")}
          </div>
          <div className="mt-0.5 whitespace-nowrap text-[16px] font-bold tracking-[-.02em] tabular-nums text-ink">
            {fmt.money(-outCents, { signed: true })}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-[13.5px] font-semibold text-ink">{t("tabAll")}</span>
        <span className="text-[11.5px] font-medium text-muted">
          {t("activeCount", { count: activeCount })}
        </span>
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-[16px] bg-track">
            <RefreshCw size={26} strokeWidth={1.8} className="text-muted" />
          </span>
          <div className="mt-4 text-[15px] font-semibold text-ink">{t("emptyTitle")}</div>
          <div className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
            {t("emptyBodyWeb")}
          </div>
        </div>
      ) : (
        <div className="mt-2.5 overflow-hidden rounded-[10px] border border-edge">
          {recurring.map((item) => (
            <div key={item.id} className="px-3">
              <RecurringRow
                item={item}
                divider
                onToggle={() => toggleRecurring(item.id)}
                onEdit={() => setEditing(item)}
              />
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setEditing("new")}
        className={`w-full rounded-[10px] border border-dashed border-edge py-3 text-center text-[12.5px] font-semibold text-primary ${
          isEmpty ? "mt-0" : "mt-3"
        }`}
      >
        {t("addItem")}
      </button>
    </div>
  );
}
