"use client";
import { appendAmountKey } from "@/lib/amount-entry";
import { TransactionEntryForm, TransactionEntryFields } from "./TransactionEntryForm";
import { RecordedTime } from "@/components/shared/RecordedTime";
import { categoryLabel } from "@/lib/categories/labels";

import { formatBudgetInput, parseMoneyInput } from "@/lib/format";
import { Select } from "@/components/ui/Select";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { normalizeMerchant } from "@/lib/import/normalize";
import { occurredAtInputValue } from "@/lib/transactions/occurredAt";
import type { TxnKind } from "@/lib/import/types";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

/** Edit a transaction's merchant, amount, category and note (shared by the web
 *  modal and the mobile detail screen). Amount is edited as a positive dollar
 *  value; the original income/expense sign is preserved. */
export function EditTransactionForm({
  txn,
  onDone,
  sharedLayout = false,
  onBusyChange,
}: {
  txn: Transaction;
  onDone: () => void;
  sharedLayout?: boolean;
  onBusyChange?: (busy: boolean) => void;
}) {
  const t = useTranslations("addFlow");
  const tTxns = useTranslations("txns");
  const { showToast } = useToast();
  const {
    categories,
    businesses,
    incomeSources,
    transactions,
    updateTransaction,
    deleteTransaction,
  } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      businesses: s.businesses,
      incomeSources: s.incomeSources,
      transactions: s.transactions,
      updateTransaction: s.updateTransaction,
      deleteTransaction: s.deleteTransaction,
    })),
  );

  const locale = useStore((s) => s.locale);
  const [merchant, setMerchant] = useState(txn.merchant);
  const [amount, setAmount] = useState(formatBudgetInput(Math.abs(txn.amountCents), locale));
  // Use the user's local calendar day, not the UTC date embedded in the ISO.
  const [date, setDate] = useState(occurredAtInputValue(txn.occurredAt));
  const [categoryId, setCategoryId] = useState(txn.categoryId ?? "");
  const [incomeSourceId, setIncomeSourceId] = useState(txn.incomeSourceId ?? "");
  const [businessId, setBusinessId] = useState(txn.businessId ?? "");
  const [kind, setKind] = useState<TxnKind>(
    txn.kind === "reimbursement" ? "reimbursement" : txn.isIncome ? "income" : "expense",
  );
  const [note, setNote] = useState(txn.note ?? "");
  const [excludeFromBudget, setExcludeFromBudget] = useState(Boolean(txn.excludeFromBudget));
  const [applyToMerchant, setApplyToMerchant] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    onBusyChange?.(busy);
  }, [busy, onBusyChange]);

  // How many *other* transactions from this same merchant would change if we
  // applied the chosen category to all of them. Matched on the normalized
  // merchant so store numbers / formatting don't split the group.
  const similarCount = useMemo(() => {
    if (!categoryId) return 0;
    const pattern = normalizeMerchant(merchant);
    if (!pattern) return 0;
    return transactions.filter(
      (t) =>
        t.id !== txn.id &&
        (t.categoryId ?? "") !== categoryId &&
        normalizeMerchant(t.merchant) === pattern,
    ).length;
  }, [transactions, txn.id, merchant, categoryId]);

  // Only offer "apply to all" when the category actually changed and there are
  // other rows to update.
  const categoryChanged = categoryId !== (txn.categoryId ?? "");
  // Reimbursements are individual repayments, never a merchant-wide category rule.
  const offerApply = kind === "expense" && categoryChanged && similarCount > 0;

  async function save() {
    const magnitude = parseMoneyInput(amount, locale) ?? 0;
    if (!merchant.trim()) return setError(t("merchantRequired"));
    if (!(magnitude > 0)) return setError(t("amountGt0"));

    setBusy(true);
    setError("");
    try {
      await updateTransaction(txn.id, {
        merchant: merchant.trim(),
        amountCents: kind === "expense" ? -magnitude : magnitude,
        categoryId: kind === "income" ? null : categoryId || null,
        incomeSourceId: kind === "income" ? incomeSourceId || null : null,
        businessId: businessId || null,
        kind,
        note: note.trim() || null,
        excludeFromBudget,
        occurredAt: date || undefined,
        applyToMerchant: offerApply && applyToMerchant,
      });
      showToast(tTxns("transactionSaved"));
      onDone();
    } catch (e) {
      showToast(tTxns("transactionUpdateFailed"), "error");
      setError(e instanceof Error ? e.message : t("saveError"));
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await deleteTransaction(txn.id);
      showToast(tTxns("bulkDeleted", { count: 1 }));
      onDone();
    } catch (e) {
      showToast(tTxns("transactionDeleteFailed"), "error");
      setError(e instanceof Error ? e.message : t("deleteError"));
      setBusy(false);
    }
  }

  const supportingFields = (
    <>
      {!sharedLayout && kind === "income" && (
        <Field label={t("incomeSource")}>
          <Select
            aria-label={t("incomeSource")}
            value={incomeSourceId}
            onChange={(e) => setIncomeSourceId(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("unassignedIncome")}</option>
            {incomeSources.map((source) => (
              <option data-icon={source.emoji} key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field label={t("business")}>
        <Select
          aria-label={t("business")}
          value={businessId}
          onChange={(e) => setBusinessId(e.target.value)}
          className={inputClass}
        >
          <option value="">{t("noBusiness")}</option>
          {businesses.map((business) => (
            <option data-icon={business.emoji} key={business.id} value={business.id}>
              {business.name}
            </option>
          ))}
        </Select>
      </Field>

      {!txn.isIncome && offerApply && (
        <button
          type="button"
          onClick={() => setApplyToMerchant((v) => !v)}
          aria-pressed={applyToMerchant}
          className="flex items-start gap-3 rounded-xl border border-primary/30 bg-peach-soft/50 px-3 py-2.5 text-left"
        >
          <span
            className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 ${
              applyToMerchant ? "border-primary bg-primary text-onprimary" : "border-muted bg-card"
            }`}
          >
            {applyToMerchant ? "✓" : ""}
          </span>
          <span className="min-w-0 text-[12.5px] font-semibold text-ink">
            Also apply to the {similarCount} other “{merchant.trim()}”{" "}
            {similarCount === 1 ? "transaction" : "transactions"} and future ones.
          </span>
        </button>
      )}
    </>
  );
  const budgetControl = (
    <button
      type="button"
      onClick={() => setExcludeFromBudget((v) => !v)}
      aria-pressed={excludeFromBudget}
      className="flex items-center gap-3 rounded-xl border border-track bg-card px-3 py-2.5 text-left"
    >
      <span
        className={`flex h-6 w-10 flex-none items-center rounded-full p-0.5 transition-colors ${
          excludeFromBudget ? "bg-primary" : "bg-track"
        }`}
      >
        <span
          className={`h-5 w-5 rounded-full bg-white transition-transform ${
            excludeFromBudget ? "translate-x-4" : ""
          }`}
        />
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold text-ink">Exclude from budget</span>
        <span className="block text-[11.5px] font-semibold text-muted">
          For transfers, credit-card & loan payments — kept out of spending totals.
        </span>
      </span>
    </button>
  );
  const magnitude = parseMoneyInput(amount, locale) ?? 0;
  const changeAmount = (cents: number) => setAmount(formatBudgetInput(cents, locale));
  if (sharedLayout)
    return (
      <TransactionEntryForm
        editing
        onSubmit={() => void save()}
        disabled={!merchant.trim() || magnitude <= 0}
        busy={busy}
        error={error}
        secondaryActions={
          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            className="min-h-12 rounded-[10px] border border-danger px-4 text-sm font-semibold text-danger disabled:opacity-50"
          >
            {tTxns("delete")}
          </button>
        }
      >
        <TransactionEntryFields
          amountCents={magnitude}
          income={kind !== "expense"}
          onAmountKey={(key) => changeAmount(appendAmountKey(magnitude, key))}
          onAmountChange={changeAmount}
          merchant={merchant}
          onMerchantChange={setMerchant}
          merchantRequired
          date={date}
          onDateChange={setDate}
          categoryId={kind === "income" ? incomeSourceId : categoryId}
          onCategoryChange={kind === "income" ? setIncomeSourceId : setCategoryId}
          categories={kind === "income" ? incomeSources : categories}
          categoryRequired={false}
          categoryFieldLabel={kind === "income" ? t("incomeSource") : undefined}
          note={note}
          onNoteChange={setNote}
          mode={kind}
          modeOptions={[
            { value: "expense", label: t("expense") },
            { value: "income", label: t("income") },
            { value: "reimbursement", label: t("reimbursement") },
          ]}
          onModeChange={(value) => setKind(value as TxnKind)}
          afterFields={<RecordedTime value={txn.createdAt} />}
        >
          {supportingFields}
          {budgetControl}
        </TransactionEntryFields>
      </TransactionEntryForm>
    );
  return (
    <div className="transaction-required-fields flex flex-col gap-3">
      <div className="lg:hidden">
        <RecordedTime value={txn.createdAt} />
      </div>
      <Field label={t("date")} required>
        <input
          type="date"
          required
          aria-invalid={(magnitude > 0 && !date) || undefined}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${inputClass} transaction-required-field`}
        />
      </Field>

      <Field label={t("merchant")} required>
        <input
          required
          aria-invalid={(magnitude > 0 && !merchant.trim()) || undefined}
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className={`${inputClass} transaction-required-field`}
          placeholder={t("merchant")}
        />
      </Field>

      <Field label={txn.isIncome ? t("amountIncome") : t("amount")} required>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-muted">$</span>
          <input
            required
            aria-invalid={magnitude <= 0 || undefined}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className={`${inputClass} transaction-required-field`}
            placeholder="0.00"
          />
        </div>
      </Field>

      <Field label={t("transactionType")}>
        <Select
          aria-label={t("transactionType")}
          value={kind}
          onChange={(e) => setKind(e.target.value as TxnKind)}
          className={inputClass}
        >
          <option value="expense">{t("expense")}</option>
          <option value="income">{t("income")}</option>
          <option value="reimbursement">{t("reimbursement")}</option>
        </Select>
      </Field>

      {kind !== "income" && (
        <Field label={t("category")}>
          <Select
            aria-label={t("category")}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={inputClass}
          >
            <option value="">{t("uncategorized")}</option>
            {categories.map((c) => (
              <option data-icon={c.emoji} key={c.id} value={c.id}>
                {categoryLabel(categories, c)}
              </option>
            ))}
          </Select>
        </Field>
      )}

      {supportingFields}

      <Field label={t("note")}>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
          placeholder={t("addNote")}
        />
      </Field>

      {budgetControl}
      {error && <div className="text-[13px] font-semibold text-primary-dark">{error}</div>}

      <div className="mt-1 flex gap-2.5">
        <button
          type="button"
          onClick={() => void remove()}
          disabled={busy}
          className="rounded-2xl border border-danger bg-card px-4 py-3 text-[14px] font-semibold text-danger disabled:opacity-50"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-2xl bg-primary py-3 text-[14px] font-semibold text-onprimary disabled:opacity-50"
        >
          {busy ? t("saving") : t("saveChanges")}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-track bg-card px-3 py-2.5 text-[14px] font-semibold text-ink outline-none";

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
        {required && (
          <span aria-hidden="true" className="text-danger">
            {" "}
            *
          </span>
        )}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
