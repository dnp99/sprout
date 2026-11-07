"use client";
import { TransactionCategoryPicker } from "./TransactionCategoryPicker";

import { useContext, useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { SelectionOption as SegOption } from "@/components/ui/SegmentedControl";
import { Keypad } from "@/components/ui/Keypad";
import { AmountEntry } from "./AmountEntry";
import { AmountCalculator } from "./AmountCalculator";
import { transactionRequiredIssues } from "@/lib/transactions/requirements";
import { useFormatters } from "@/i18n/useFormatters";
import { useDesktop } from "@/hooks/useDesktop";
import { revealTransactionField } from "@/hooks/useTransactionFieldVisibility";

export const transactionInputClass =
  "transaction-entry-field min-h-11 w-full min-w-0 rounded-[10px] border border-edge px-3 py-2 text-control text-ink placeholder:text-muted focus:border-primary focus:outline-none";

export { TransactionDialog, TransactionEntryForm, TransactionField } from "./TransactionEntryShell";
import { TransactionValidationAttempt, TransactionField } from "./TransactionEntryShell";

export type TransactionCategoryOption = {
  id: string;
  name: string;
  emoji?: string;
  parentId?: string | null;
};

/** Layout is independent of store/domain. Only ledger-specific extras are slots;
 * cents-style typing and the numbered keypad feed the same amount callback. */
export function TransactionEntryFields({
  context,
  amountCents,
  income,
  onAmountKey,
  onAmountChange,
  merchant,
  onMerchantChange,
  merchantRequired = false,
  date,
  onDateChange,
  categoryId,
  onCategoryChange,
  categories,
  categoryRequired = true,
  categoryFieldLabel,
  categoryDisabled = false,
  note,
  onNoteChange,
  noteMaxLength = 280,
  mode,
  modeOptions,
  onModeChange,
  notice,
  children,
  afterFields,
  dateCompanion,
  extrasInDetails = false,
}: {
  extrasInDetails?: boolean;
  context?: ReactNode;
  amountCents: number;
  income: boolean;
  onAmountKey: (key: string) => void;
  onAmountChange: (cents: number) => void;
  merchant: string;
  onMerchantChange: (value: string) => void;
  merchantRequired?: boolean;
  date: string;
  onDateChange: (value: string) => void;
  categoryId: string;
  onCategoryChange: (id: string) => void;
  categories: TransactionCategoryOption[];
  categoryRequired?: boolean;
  categoryFieldLabel?: string;
  categoryDisabled?: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  noteMaxLength?: number;
  mode: string;
  modeOptions?: SegOption<string>[];
  onModeChange?: (value: string) => void;
  notice?: ReactNode;
  children?: ReactNode;
  afterFields?: ReactNode;
  dateCompanion?: ReactNode;
}) {
  const id = useId();
  const t = useTranslations("addFlow");
  const entry = useTranslations("transactionEntry");
  const fmt = useFormatters();
  const [keypad, setKeypad] = useState(false);
  const desktop = useDesktop(1280);
  const mobile = !useDesktop();
  const showKeypad = keypad && !desktop && !mobile;
  const compactLayout = mobile || desktop;
  const attempted = useContext(TransactionValidationAttempt);
  const requiredText = useTranslations("transactionRequirements");
  const [touched, setTouched] = useState({
    amount: false,
    category: false,
    merchant: false,
    date: false,
  });
  const amountInteracted = useRef(false);
  const merchantRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const focusField = (field: HTMLElement | null) => {
    if (!field) return;
    field.focus({ preventScroll: true });
    const region = field.closest<HTMLElement>(".transaction-entry-scroll");
    if (region) revealTransactionField(region, field);
  };
  const nextCategory = () => {
    if (categoryDisabled || !categories.length) return;
    const field =
      categoryRef.current?.querySelector<HTMLButtonElement>('button[role="combobox"]') ??
      categoryRef.current?.querySelector<HTMLSelectElement>("select");
    if (!field || field.disabled) return;
    focusField(field);
    field.click();
  };
  const issues = transactionRequiredIssues({ amountCents, categoryId });
  // Entering an amount starts the draft: guide users to missing required
  // fields immediately, even while Save is disabled. Autofocus alone is quiet.
  const revealRequired = attempted || amountCents > 0;
  const amountError = (attempted || touched.amount) && issues.includes("amountRequired");
  const categoryError =
    categoryRequired && (revealRequired || touched.category) && issues.includes("categoryRequired");
  const merchantError =
    merchantRequired && (revealRequired || touched.merchant) && !merchant.trim();
  const dateError = (revealRequired || touched.date) && !date;
  const touchAmount = () => setTouched((value) => ({ ...value, amount: true }));
  const amountKey = (key: string) => {
    touchAmount();
    onAmountKey(key);
  };
  const nextMerchant = () => {
    touchAmount();
    if (amountCents <= 0) return;
    setKeypad(false);
    // Synchronous focus inside the user's key/tap gesture preserves iOS's
    // keyboard handoff; delayed focus would require another tap to type.
    focusField(merchantRef.current);
  };
  // Initial autofocus/focus trapping must not paint an untouched draft red.
  // Mark amount blur only after pointer/keyboard interaction with its controls.
  const leaveAmount = (event: React.FocusEvent<HTMLDivElement>) => {
    if (
      amountInteracted.current &&
      !event.currentTarget.contains(event.relatedTarget as Node | null)
    )
      touchAmount();
  };
  const extraFields = (
    <>
      {extrasInDetails && children}
      <TransactionField label={t("note")}>
        <textarea
          rows={2}
          maxLength={noteMaxLength}
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          className={transactionInputClass}
        />
      </TransactionField>
      {afterFields}
    </>
  );
  return (
    <>
      {context}
      <div
        className="transaction-amount-section space-y-2"
        onPointerDownCapture={() => {
          amountInteracted.current = true;
        }}
        onKeyDownCapture={() => {
          amountInteracted.current = true;
        }}
        onBlurCapture={leaveAmount}
      >
        {compactLayout && (
          <AmountCalculator
            cents={amountCents}
            onApply={(cents) => {
              touchAmount();
              onAmountChange(cents);
            }}
          >
            <span className="text-label font-semibold text-muted">
              {t("amount")} <span className="text-danger">*</span>
            </span>
          </AmountCalculator>
        )}
        <div
          data-invalid={amountError || undefined}
          className={`transaction-amount-field flex rounded-[10px] border tabular-nums ${compactLayout ? "min-h-11 justify-start border-edge bg-bg px-3 py-1 text-[20px] font-semibold" : "min-h-16 justify-center border-transparent py-2 text-[42px] font-bold sm:text-[46px]"} ${income ? "text-green" : "text-primary"}`}
        >
          <AmountEntry
            required
            compact={compactLayout}
            label={t("amount")}
            invalid={amountError}
            describedBy={amountError ? `${id}-amount-error` : undefined}
            display={fmt.money(amountCents, { forceCents: true, signed: income })}
            onKey={amountKey}
            onNext={nextMerchant}
            inputMode={showKeypad ? "none" : "numeric"}
          />
        </div>
        {amountError && (
          <p
            id={`${id}-amount-error`}
            role="alert"
            className="transaction-amount-error text-xs text-danger"
          >
            {requiredText("amountRequired")}
          </p>
        )}
        {!desktop && !mobile && (
          <div className="transaction-keypad-toggle flex gap-2">
            <button
              type="button"
              aria-expanded={keypad}
              aria-controls={`${id}-keypad`}
              onClick={() => setKeypad(!keypad)}
              className="flex min-h-11 flex-1 items-center justify-center rounded-[10px] text-xs font-semibold text-primary hover:bg-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {entry(keypad ? "hideKeypad" : "showKeypad")}
            </button>
            {mobile && (
              <button
                type="button"
                onClick={nextMerchant}
                disabled={amountCents <= 0}
                className="min-h-11 flex-1 rounded-[10px] text-xs font-semibold text-primary hover:bg-track disabled:opacity-50"
              >
                {entry("nextMerchant")}
              </button>
            )}
          </div>
        )}
        {showKeypad && (
          <div id={`${id}-keypad`} className="transaction-keypad">
            <Keypad onPress={amountKey} compact />
          </div>
        )}
      </div>
      <div
        ref={categoryRef}
        onBlurCapture={(event) => {
          const next = event.relatedTarget as HTMLElement | null;
          // Portaled options remain part of this field's editing interaction.
          if (next?.closest('[role="listbox"], [data-transaction-category-picker]')) return;
          if (!event.currentTarget.contains(next))
            setTouched((value) => ({ ...value, category: true }));
        }}
      >
        <TransactionField label={categoryFieldLabel ?? t("category")} required={categoryRequired}>
          <TransactionCategoryPicker
            categories={categories}
            label={categoryFieldLabel ?? t("category")}
            invalid={categoryError}
            describedBy={categoryError ? `${id}-category-error` : undefined}
            required={categoryRequired}
            value={categoryId}
            disabled={categoryDisabled || !categories.length}
            onChange={onCategoryChange}
            placeholder={t(categoryRequired ? "chooseCategory" : "uncategorized")}
            className={transactionInputClass}
          />
        </TransactionField>
        {categoryError && (
          <p id={`${id}-category-error`} role="alert" className="mt-1.5 text-xs text-danger">
            {requiredText("categoryRequired")}
          </p>
        )}
      </div>
      <div>
        {compactLayout ? (
          <label htmlFor={`${id}-merchant`} className="text-[12px] font-semibold text-muted">
            {entry("merchant")}
            {merchantRequired && (
              <span aria-hidden="true" className="text-danger">
                {" "}
                *
              </span>
            )}
          </label>
        ) : (
          <AmountCalculator
            cents={amountCents}
            onApply={(cents) => {
              touchAmount();
              onAmountChange(cents);
            }}
          >
            <label htmlFor={`${id}-merchant`} className="text-[12px] font-semibold text-muted">
              {entry("merchant")}
              {merchantRequired && (
                <span aria-hidden="true" className="text-danger">
                  {" "}
                  *
                </span>
              )}
            </label>
          </AmountCalculator>
        )}
        <input
          ref={merchantRef}
          id={`${id}-merchant`}
          required={merchantRequired}
          aria-required={merchantRequired}
          aria-invalid={merchantError || undefined}
          aria-describedby={merchantError ? `${id}-merchant-error` : undefined}
          onBlur={() => setTouched((value) => ({ ...value, merchant: true }))}
          maxLength={120}
          value={merchant}
          onChange={(event) => onMerchantChange(event.target.value)}
          enterKeyHint="next"
          onKeyDown={(event) => {
            if (event.key !== "Enter" || event.nativeEvent.isComposing) return;
            event.preventDefault();
            setTouched((value) => ({ ...value, merchant: true }));
            if (merchantRequired && !merchant.trim()) return;
            if (!date) focusField(dateRef.current);
            else nextCategory();
          }}
          placeholder={entry("merchantExample")}
          className={transactionInputClass}
        />
        {merchantError && (
          <p id={`${id}-merchant-error`} role="alert" className="mt-1.5 text-xs text-danger">
            {entry("merchantRequired")}
          </p>
        )}
      </div>
      {notice}
      <div
        className={`transaction-date-details grid gap-3 ${dateCompanion ? "grid-cols-2" : "grid-cols-1"}`}
      >
        <div className="min-w-0">
          <TransactionField label={t("transactionDate")} required>
            <input
              type="date"
              ref={dateRef}
              enterKeyHint="next"
              required
              aria-invalid={dateError || undefined}
              aria-describedby={dateError ? `${id}-date-error` : undefined}
              onBlur={() => setTouched((value) => ({ ...value, date: true }))}
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter") return;
                event.preventDefault();
                setTouched((value) => ({ ...value, date: true }));
                if (date) nextCategory();
              }}
              className={transactionInputClass}
            />
          </TransactionField>
          {dateError && (
            <p id={`${id}-date-error`} role="alert" className="mt-1.5 text-xs text-danger">
              {entry("dateRequired")}
            </p>
          )}
        </div>
        {dateCompanion}
      </div>
      {!extrasInDetails && children}
      {modeOptions && onModeChange && (
        <div className="transaction-mode-control">
          <SegmentedControl
            appearance="surface"
            shape="rounded"
            label={modeOptions.map((option) => option.label).join(" / ")}
            options={modeOptions}
            value={mode}
            onChange={onModeChange}
          />
        </div>
      )}
      {
        <details className="transaction-more-details rounded-[10px] border border-edge">
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-3 text-control font-semibold text-ink [&::-webkit-details-marker]:hidden">
            {entry("moreDetails")} <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div className="space-y-3 px-3 pb-3">{extraFields}</div>
        </details>
      }
    </>
  );
}
