"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Keypad } from "@/components/ui/Keypad";
import { SegmentedControl, Toggle } from "@/components/ui/controls";
import { ReimbursementInfo } from "@/components/shared/ReimbursementInfo";
import { Modal } from "@/components/ui/overlays";
import { formatMoney } from "@/lib/format";
import { occurredAtInputValue } from "@/lib/transactions/occurredAt";
import type { AddMode, Frequency } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

const MODE_VALUES: AddMode[] = ["expense", "income", "reimbursement"];

const FREQUENCIES: Frequency[] = ["Weekly", "Monthly", "Yearly"];

/** Shared add-transaction form: mode toggle, amount (cents-style entry — digits
 *  fill from the right so the decimal is automatic), merchant, transaction
 *  date, category picker from the user's real categories, recurring toggle, and
 *  (mobile) a keypad. Save is owned by the parent. */
export function AddForm({
  showKeypad = false,
  showAmount = true,
}: {
  showKeypad?: boolean;
  showAmount?: boolean;
}) {
  const t = useTranslations("addFlow");
  const modeOptions = MODE_VALUES.map((value) => ({ value, label: t(value) }));
  const {
    categories,
    businesses,
    incomeSources,
    addMode,
    addAmountCents,
    addMerchant,
    addOccurredAt,
    addCategoryId,
    addIncomeSourceId,
    addBusinessId,
    addRecurring,
    addFrequency,
    set,
    pressKey,
  } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      businesses: s.businesses,
      incomeSources: s.incomeSources,
      addMode: s.addMode,
      addAmountCents: s.addAmountCents,
      addMerchant: s.addMerchant,
      addOccurredAt: s.addOccurredAt,
      addCategoryId: s.addCategoryId,
      addIncomeSourceId: s.addIncomeSourceId,
      addBusinessId: s.addBusinessId,
      addRecurring: s.addRecurring,
      addFrequency: s.addFrequency,
      set: s.set,
      pressKey: s.pressKey,
    })),
  );

  const isIncome = addMode === "income";
  const isReimbursement = addMode === "reimbursement";
  const categoryLabel = isReimbursement ? t("reimbursementCategory") : t("category");
  const compact = showKeypad;
  const amountStr = formatMoney(addAmountCents, { forceCents: true, signed: isIncome });
  // Keep the state blank until the user chooses another day: a new form then
  // always naturally defaults to today's local calendar date after reset.
  const transactionDate = addOccurredAt || occurredAtInputValue(new Date());
  // Web amount entry hides the native caret (digits fill from the right, so a
  // real caret would land in a meaningless spot). Track focus to show a blinking
  // bar after the number instead — the "you're typing here" cue.
  const [amountFocused, setAmountFocused] = useState(false);
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const selectedCategory = categories.find((category) => category.id === addCategoryId);

  return (
    <div className={`flex flex-1 flex-col ${compact ? "gap-3" : ""}`}>
      {showAmount && (
        <div
          className={`mt-5 flex items-center justify-center text-[46px] font-bold tracking-tight tabular-nums ${
            isIncome ? "text-green" : "text-primary"
          }`}
        >
          {showKeypad ? (
            // Mobile: amount is driven by the keypad below.
            amountStr
          ) : (
            // Web: physical-keyboard entry — digits fill from the right (cents),
            // so "1234" reads $12.34; Backspace removes the last digit. The
            // native caret is hidden; a blinking bar after the number stands in.
            <label className="relative inline-flex cursor-text items-center">
              <span>{amountStr}</span>
              <span
                aria-hidden
                className={`ml-1 w-[3px] self-stretch rounded-full bg-current ${
                  amountFocused ? "animate-caret-blink" : "opacity-0"
                }`}
              />
              <input
                autoFocus
                value={amountStr}
                onChange={() => {}}
                onFocus={() => setAmountFocused(true)}
                onBlur={() => setAmountFocused(false)}
                onKeyDown={(e) => {
                  if (/^[0-9]$/.test(e.key)) {
                    e.preventDefault();
                    pressKey(e.key);
                  } else if (e.key === "Backspace" || e.key === "Delete") {
                    e.preventDefault();
                    pressKey("back");
                  }
                }}
                inputMode="numeric"
                aria-label={t("amount")}
                className="absolute inset-0 cursor-text opacity-0 outline-none"
              />
            </label>
          )}
        </div>
      )}

      <input
        value={addMerchant}
        onChange={(e) => set({ addMerchant: e.target.value })}
        required
        aria-required
        placeholder={isIncome ? t("sourcePlaceholder") : t("merchantPlaceholder")}
        className={`w-full border border-edge bg-card px-4 font-medium text-ink outline-none transition placeholder:text-muted focus:border-primary lg:text-[14px] ${
          compact ? "rounded-[12px] py-2.5 text-[15px]" : "mt-4 rounded-[14px] py-3 text-[16px]"
        }`}
      />

      <SegmentedControl
        options={modeOptions}
        value={addMode}
        onChange={(value) => set({ addMode: value })}
        compact={compact}
      />

      {isReimbursement && <ReimbursementInfo compact={compact} className={compact ? "" : "mt-3"} />}

      {compact ? (
        <div className="grid grid-cols-[.9fr_1.1fr] gap-2">
          <label className="min-w-0">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-subtle">
              Date
            </span>
            <span className="flex items-center gap-2 rounded-[12px] border border-edge bg-card px-3 py-2 text-ink transition focus-within:border-primary">
              <CalendarDays size={15} strokeWidth={2} className="shrink-0 text-muted" />
              <input
                type="date"
                value={transactionDate}
                onChange={(event) => set({ addOccurredAt: event.target.value })}
                aria-label={t("transactionDate")}
                className="min-w-0 flex-1 bg-transparent text-[13px] font-medium text-ink outline-none"
              />
            </span>
          </label>

          {!isIncome && (
            <ExpenseCategoryPicker
              compact
              label={categoryLabel}
              categories={categories}
              selectedCategory={selectedCategory}
              onOpen={() => setCategoryPickerOpen(true)}
            />
          )}
          {isIncome && (
            <label className="min-w-0">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-subtle">
                {t("incomeSource")}
              </span>
              <span className="relative flex items-center rounded-[12px] border border-edge bg-card text-ink transition focus-within:border-primary">
                <select
                  value={addIncomeSourceId}
                  onChange={(event) => set({ addIncomeSourceId: event.target.value })}
                  aria-label={t("incomeSource")}
                  className="h-[38px] w-full appearance-none bg-transparent px-3 pr-8 text-[13px] font-semibold text-ink outline-none"
                >
                  <option value="">{t("unassignedIncome")}</option>
                  {incomeSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.emoji} {source.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  strokeWidth={2}
                  className="pointer-events-none absolute right-3 text-muted"
                />
              </span>
            </label>
          )}
          <BusinessPicker
            compact
            value={addBusinessId}
            onChange={(businessId) => set({ addBusinessId: businessId })}
            businesses={businesses}
            label={t("business")}
            unassignedLabel={t("noBusiness")}
          />
        </div>
      ) : (
        <>
          <label className="mt-3 block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-subtle">
              Transaction date
            </span>
            <span className="flex items-center gap-2 rounded-[14px] border border-edge bg-card px-3 py-2.5 text-ink transition focus-within:border-primary">
              <CalendarDays size={15} strokeWidth={2} className="shrink-0 text-muted" />
              <input
                type="date"
                value={transactionDate}
                onChange={(event) => set({ addOccurredAt: event.target.value })}
                aria-label={t("transactionDate")}
                className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-ink outline-none"
              />
            </span>
          </label>

          {!isIncome && (
            <div className="mt-3">
              <ExpenseCategoryPicker
                label={categoryLabel}
                categories={categories}
                selectedCategory={selectedCategory}
                onOpen={() => setCategoryPickerOpen(true)}
              />
            </div>
          )}
          {isIncome && (
            <label className="mt-3 block">
              <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-subtle">
                {t("incomeSource")}
              </span>
              <span className="relative flex items-center rounded-[14px] border border-edge bg-card text-ink transition focus-within:border-primary">
                <select
                  value={addIncomeSourceId}
                  onChange={(event) => set({ addIncomeSourceId: event.target.value })}
                  aria-label={t("incomeSource")}
                  className="h-[42px] w-full appearance-none bg-transparent px-3 pr-8 text-[14px] font-semibold text-ink outline-none"
                >
                  <option value="">{t("unassignedIncome")}</option>
                  {incomeSources.map((source) => (
                    <option key={source.id} value={source.id}>
                      {source.emoji} {source.name}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={15}
                  strokeWidth={2}
                  className="pointer-events-none absolute right-3 text-muted"
                />
              </span>
            </label>
          )}
          <div className="mt-3">
            <BusinessPicker
              value={addBusinessId}
              onChange={(businessId) => set({ addBusinessId: businessId })}
              businesses={businesses}
              label={t("business")}
              unassignedLabel={t("noBusiness")}
            />
          </div>
        </>
      )}

      <div
        className={`flex items-center justify-between border border-edge bg-card px-4 ${
          compact ? "min-h-[42px] rounded-[12px]" : "mt-4 rounded-[14px] py-3"
        }`}
      >
        <span className="text-[14px] font-semibold text-ink">
          Recurring <span className="font-medium text-muted">· repeat automatically</span>
        </span>
        <Toggle on={addRecurring} onClick={() => set({ addRecurring: !addRecurring })} />
      </div>

      {addRecurring && (
        <div className="mt-2.5 flex gap-2">
          {FREQUENCIES.map((freq) => {
            const active = addFrequency === freq;
            return (
              <button
                key={freq}
                type="button"
                onClick={() => set({ addFrequency: freq })}
                className={`flex-1 rounded-[10px] py-2.5 text-center text-[12.5px] transition ${
                  active
                    ? "bg-primary font-semibold text-onprimary"
                    : "border border-edge font-medium text-muted"
                }`}
              >
                {t(freq.toLowerCase())}
              </button>
            );
          })}
        </div>
      )}

      {showKeypad && (
        <div className="pb-1">
          <Keypad onPress={pressKey} compact />
        </div>
      )}
      {categoryPickerOpen && (
        <Modal title={categoryLabel} onClose={() => setCategoryPickerOpen(false)} width={560}>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  set({ addCategoryId: category.id });
                  setCategoryPickerOpen(false);
                }}
                className={`flex min-h-12 items-center gap-3 rounded-[12px] border px-3 text-left text-[13px] font-semibold transition ${
                  category.id === addCategoryId
                    ? "border-primary bg-primary-soft text-ink"
                    : "border-edge bg-card text-ink hover:bg-track"
                }`}
              >
                <span className="text-[19px] leading-none">{category.emoji}</span>
                <span className="min-w-0 flex-1 truncate">{category.name}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

function ExpenseCategoryPicker({
  label,
  categories,
  selectedCategory,
  onOpen,
  compact = false,
}: {
  label: string;
  categories: { id: string; name: string; emoji: string }[];
  selectedCategory: { id: string; name: string; emoji: string } | undefined;
  onOpen: () => void;
  compact?: boolean;
}) {
  return (
    <div className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-subtle">
        {label}
      </span>
      <button
        type="button"
        onClick={onOpen}
        disabled={categories.length === 0}
        className={`flex w-full items-center justify-between gap-3 border border-edge bg-card px-3 text-left text-ink transition hover:border-primary disabled:text-muted ${
          compact ? "h-[38px] rounded-[12px] text-[13px]" : "h-[42px] rounded-[14px] text-[14px]"
        }`}
      >
        <span className="min-w-0 truncate font-semibold">
          {selectedCategory ? `${selectedCategory.emoji} ${selectedCategory.name}` : "—"}
        </span>
        <ChevronDown size={15} strokeWidth={2} className="flex-none text-muted" />
      </button>
    </div>
  );
}

function BusinessPicker({
  businesses,
  value,
  onChange,
  label,
  unassignedLabel,
  compact = false,
}: {
  businesses: { id: string; name: string; emoji: string }[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  unassignedLabel: string;
  compact?: boolean;
}) {
  return (
    <label className="min-w-0">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[.14em] text-subtle">
        {label}
      </span>
      <span className="relative flex items-center rounded-[12px] border border-edge bg-card text-ink transition focus-within:border-primary">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-label={label}
          className={`w-full appearance-none bg-transparent px-3 pr-8 text-[13px] font-semibold text-ink outline-none ${
            compact ? "h-[38px]" : "h-[42px] text-[14px]"
          }`}
        >
          <option value="">{unassignedLabel}</option>
          {businesses.map((business) => (
            <option key={business.id} value={business.id}>
              {business.emoji} {business.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className="pointer-events-none absolute right-3 text-muted"
        />
      </span>
    </label>
  );
}
