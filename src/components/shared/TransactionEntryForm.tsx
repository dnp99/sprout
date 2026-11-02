"use client";
import { categoryLabel } from "@/lib/categories/labels";

import { createContext, useContext, useId, useRef, useState, type ReactNode } from "react";
import { LoaderCircle, UserRound, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/overlays";
import { Select } from "@/components/ui/Select";
import { SegmentedControl, type SegOption } from "@/components/ui/controls";
import { Keypad } from "@/components/ui/Keypad";
import { AmountEntry } from "./AmountEntry";
import { AmountCalculator } from "./AmountCalculator";
import { transactionRequiredIssues } from "@/lib/transactions/requirements";
import { useFormatters } from "@/i18n/useFormatters";
import { useDesktop } from "@/hooks/useDesktop";

export const transactionInputClass =
  "transaction-entry-field min-h-11 w-full min-w-0 rounded-[10px] border border-edge px-3 py-2 text-[16px] text-ink placeholder:text-muted focus:border-primary focus:outline-none";

const TransactionValidationAttempt = createContext(false);

/** Labels, field boundaries and touch targets are shared across both adapters. */
export function TransactionField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="grid min-w-0 gap-1.5 text-[12px] font-semibold text-muted">
      <span>
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        )}
      </span>
      {children}
    </label>
  );
}

/** A single modal geometry and focus boundary for Personal and Group entry. */
export function TransactionDialog({
  title,
  groupName,
  onClose,
  children,
}: {
  title?: string;
  groupName?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const t = useTranslations("nav");
  const groups = useTranslations("groups");
  const Icon = groupName ? Users : UserRound;
  // Modal subtitles sit outside the scrolling form, so the destination remains visible.
  const destination = (
    <span className="flex min-w-0 items-center gap-1.5">
      <Icon size={14} strokeWidth={2} className="shrink-0" aria-hidden="true" />
      <span className="truncate" title={groupName}>
        {groupName ?? groups("personal")}
      </span>
    </span>
  );
  return (
    <Modal
      title={title ?? t("addTransaction")}
      subtitle={destination}
      width="var(--transaction-dialog-width, 400px)"
      className="transaction-dialog"
      onClose={onClose}
    >
      {children}
    </Modal>
  );
}

/** Shared submit/error placement; adapters retain their independent save logic. */
export function TransactionEntryForm({
  children,
  onSubmit,
  disabled,
  busy,
  error,
  secondaryActions,
  editing = false,
}: {
  children: ReactNode;
  onSubmit: () => void;
  disabled: boolean;
  busy: boolean;
  error?: string | null;
  secondaryActions?: ReactNode;
  editing?: boolean;
}) {
  const t = useTranslations("addFlow");
  const [attempted, setAttempted] = useState(false);
  return (
    <TransactionValidationAttempt.Provider value={attempted}>
      <form
        className="transaction-entry-form mt-4 space-y-4"
        onInvalidCapture={(event) => {
          event.preventDefault();
          setAttempted(true);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          setAttempted(true);
          if (!busy) onSubmit();
        }}
      >
        {children}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <div className="transaction-entry-actions sticky bottom-0 z-10 flex flex-wrap gap-3 border-t border-edge bg-card pt-3">
          {secondaryActions}
          <button
            type="submit"
            disabled={disabled || busy}
            className="transaction-entry-save flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[10px] bg-primary px-4 py-3 text-[14px] font-semibold text-onprimary disabled:opacity-50"
          >
            {busy && <LoaderCircle size={16} className="animate-spin" aria-hidden />}
            {busy ? t("saving") : editing ? t("saveChanges") : t("save")}
          </button>
        </div>
      </form>
    </TransactionValidationAttempt.Provider>
  );
}

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
}: {
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
}) {
  const id = useId();
  const t = useTranslations("addFlow");
  const entry = useTranslations("transactionEntry");
  const fmt = useFormatters();
  const [keypad, setKeypad] = useState(false);
  const desktop = useDesktop(1280);
  const showKeypad = keypad && !desktop;
  const attempted = useContext(TransactionValidationAttempt);
  const requiredText = useTranslations("transactionRequirements");
  const [touched, setTouched] = useState({
    amount: false,
    category: false,
    merchant: false,
    date: false,
  });
  const amountInteracted = useRef(false);
  const issues = transactionRequiredIssues({ amountCents, categoryId });
  const amountError = (attempted || touched.amount) && issues.includes("amountRequired");
  const categoryError =
    categoryRequired && (attempted || touched.category) && issues.includes("categoryRequired");
  const merchantError = merchantRequired && (attempted || touched.merchant) && !merchant.trim();
  const dateError = (attempted || touched.date) && !date;
  const touchAmount = () => setTouched((value) => ({ ...value, amount: true }));
  const amountKey = (key: string) => {
    touchAmount();
    onAmountKey(key);
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
        <div
          data-invalid={amountError || undefined}
          className={`transaction-amount-field flex min-h-16 justify-center rounded-[10px] border border-transparent py-2 text-[42px] font-bold tabular-nums sm:text-[46px] ${income ? "text-green" : "text-primary"}`}
        >
          <AmountEntry
            required
            label={t("amount")}
            invalid={amountError}
            describedBy={amountError ? `${id}-amount-error` : undefined}
            display={fmt.money(amountCents, { forceCents: true, signed: income })}
            onKey={amountKey}
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
        {!desktop && (
          <button
            type="button"
            aria-expanded={keypad}
            aria-controls={`${id}-keypad`}
            onClick={() => setKeypad(!keypad)}
            className="transaction-keypad-toggle flex min-h-11 w-full items-center justify-center rounded-[10px] text-xs font-semibold text-primary hover:bg-track focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {entry(keypad ? "hideKeypad" : "showKeypad")}
          </button>
        )}
        {showKeypad && (
          <div id={`${id}-keypad`} className="transaction-keypad">
            <Keypad onPress={amountKey} compact />
          </div>
        )}
      </div>
      <div>
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
        <input
          id={`${id}-merchant`}
          required={merchantRequired}
          aria-required={merchantRequired}
          aria-invalid={merchantError || undefined}
          aria-describedby={merchantError ? `${id}-merchant-error` : undefined}
          onBlur={() => setTouched((value) => ({ ...value, merchant: true }))}
          maxLength={120}
          value={merchant}
          onChange={(event) => onMerchantChange(event.target.value)}
          placeholder={entry("merchantExample")}
          className={transactionInputClass}
        />
        {merchantError && (
          <p id={`${id}-merchant-error`} role="alert" className="mt-1.5 text-xs text-danger">
            {entry("merchantRequired")}
          </p>
        )}
      </div>
      {modeOptions && onModeChange && (
        <SegmentedControl options={modeOptions} value={mode} onChange={onModeChange} />
      )}
      {notice}
      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2">
        <div>
          <TransactionField label={t("transactionDate")} required>
            <input
              type="date"
              required
              aria-invalid={dateError || undefined}
              aria-describedby={dateError ? `${id}-date-error` : undefined}
              onBlur={() => setTouched((value) => ({ ...value, date: true }))}
              value={date}
              onChange={(event) => onDateChange(event.target.value)}
              className={transactionInputClass}
            />
          </TransactionField>
          {dateError && (
            <p id={`${id}-date-error`} role="alert" className="mt-1.5 text-xs text-danger">
              {entry("dateRequired")}
            </p>
          )}
        </div>
        <div
          onBlurCapture={(event) => {
            const next = event.relatedTarget as HTMLElement | null;
            // Portaled options remain part of this field's editing interaction.
            if (next?.closest('[role="listbox"]')) return;
            if (!event.currentTarget.contains(next))
              setTouched((value) => ({ ...value, category: true }));
          }}
        >
          <TransactionField label={t("category")} required={categoryRequired}>
            <Select
              aria-label={t("category")}
              aria-invalid={categoryError || undefined}
              aria-describedby={categoryError ? `${id}-category-error` : undefined}
              required={categoryRequired}
              aria-required={categoryRequired}
              value={categoryId}
              disabled={categoryDisabled || !categories.length}
              onChange={(event) => onCategoryChange(event.target.value)}
              className={transactionInputClass}
            >
              <option value="" disabled={categoryRequired}>
                {t(categoryRequired ? "chooseCategory" : "uncategorized")}
              </option>
              {categories.map((category) => (
                <option key={category.id} value={category.id} data-icon={category.emoji}>
                  {categoryLabel(categories, category)}
                </option>
              ))}
            </Select>
          </TransactionField>
          {categoryError && (
            <p id={`${id}-category-error`} role="alert" className="mt-1.5 text-xs text-danger">
              {requiredText("categoryRequired")}
            </p>
          )}
        </div>
      </div>
      {children}
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
}
