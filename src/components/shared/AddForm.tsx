"use client";

import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/controls";
import { ReimbursementInfo } from "./ReimbursementInfo";
import {
  TransactionEntryFields,
  TransactionField,
  transactionInputClass,
} from "./TransactionEntryForm";
import { occurredAtInputValue } from "@/lib/transactions/occurredAt";
import type { AddMode, Frequency } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

const MODES: AddMode[] = ["expense", "income", "reimbursement"];
const FREQUENCIES: Frequency[] = ["Weekly", "Monthly", "Yearly"];

/** Personal adapter: only account-specific choices live here. Common entry
 * fields and keypad are rendered by the same component as Group records. */
export function AddForm() {
  const t = useTranslations("addFlow");
  const entry = useTranslations("transactionEntry");
  const state = useStore(
    useShallow((s) => ({
      categories: s.categories,
      businesses: s.businesses,
      incomeSources: s.incomeSources,
      mode: s.addMode,
      cents: s.addAmountCents,
      merchant: s.addMerchant,
      date: s.addOccurredAt,
      categoryId: s.addCategoryId,
      note: s.addNote,
      incomeSourceId: s.addIncomeSourceId,
      businessId: s.addBusinessId,
      recurring: s.addRecurring,
      frequency: s.addFrequency,
      set: s.set,
      pressKey: s.pressKey,
    })),
  );
  return (
    <TransactionEntryFields
      amountCents={state.cents}
      income={state.mode === "income"}
      onAmountKey={state.pressKey}
      onAmountChange={(addAmountCents) => state.set({ addAmountCents })}
      merchant={state.merchant}
      merchantRequired
      onMerchantChange={(addMerchant) => state.set({ addMerchant })}
      date={state.date || occurredAtInputValue(new Date())}
      onDateChange={(addOccurredAt) => state.set({ addOccurredAt })}
      categoryId={state.categoryId}
      categories={state.categories}
      onCategoryChange={(addCategoryId) => state.set({ addCategoryId })}
      note={state.note}
      onNoteChange={(addNote) => state.set({ addNote })}
      mode={state.mode}
      modeOptions={MODES.map((value) => ({ value, label: t(value) }))}
      onModeChange={(value) => state.set({ addMode: value as AddMode })}
      notice={state.mode === "reimbursement" ? <ReimbursementInfo /> : undefined}
      afterFields={
        <>
          <div className="flex min-h-11 items-center justify-between rounded-[10px] border border-edge bg-track px-3">
            <span className="text-sm font-semibold text-ink">{entry("recurring")}</span>
            <Toggle
              on={state.recurring}
              onClick={() => state.set({ addRecurring: !state.recurring })}
            />
          </div>
          {state.recurring && (
            <div className="flex gap-2">
              {FREQUENCIES.map((frequency) => (
                <button
                  key={frequency}
                  type="button"
                  aria-pressed={state.frequency === frequency}
                  onClick={() => state.set({ addFrequency: frequency })}
                  className={`min-h-11 flex-1 rounded-[10px] text-xs font-semibold ${state.frequency === frequency ? "bg-primary text-onprimary" : "bg-track text-muted"}`}
                >
                  {t(frequency.toLowerCase())}
                </button>
              ))}
            </div>
          )}
        </>
      }
    >
      {state.mode === "income" && (
        <TransactionField label={t("incomeSource")}>
          <Select
            aria-label={t("incomeSource")}
            value={state.incomeSourceId}
            onChange={(event) => state.set({ addIncomeSourceId: event.target.value })}
            className={transactionInputClass}
          >
            <option value="">{t("unassignedIncome")}</option>
            {state.incomeSources.map((source) => (
              <option data-icon={source.emoji} key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </Select>
        </TransactionField>
      )}
      <TransactionField label={t("business")}>
        <Select
          aria-label={t("business")}
          value={state.businessId}
          onChange={(event) => state.set({ addBusinessId: event.target.value })}
          className={transactionInputClass}
        >
          <option value="">{t("noBusiness")}</option>
          {state.businesses.map((business) => (
            <option data-icon={business.emoji} key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </Select>
      </TransactionField>
    </TransactionEntryFields>
  );
}
