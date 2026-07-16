"use client";

import { useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { normalizeMerchant } from "@/lib/import/normalize";
import { occurredAtInputValue } from "@/lib/transactions/occurredAt";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

/** Edit a transaction's merchant, amount, category and note (shared by the web
 *  modal and the mobile detail screen). Amount is edited as a positive dollar
 *  value; the original income/expense sign is preserved. */
export function EditTransactionForm({ txn, onDone }: { txn: Transaction; onDone: () => void }) {
  const t = useTranslations("addFlow");
  const { categories, transactions, updateTransaction, deleteTransaction } = useStore(
    useShallow((s) => ({
      categories: s.categories,
      transactions: s.transactions,
      updateTransaction: s.updateTransaction,
      deleteTransaction: s.deleteTransaction,
    })),
  );

  const [merchant, setMerchant] = useState(txn.merchant);
  const [amount, setAmount] = useState((Math.abs(txn.amountCents) / 100).toFixed(2));
  // Use the user's local calendar day, not the UTC date embedded in the ISO.
  const [date, setDate] = useState(occurredAtInputValue(txn.occurredAt));
  const [categoryId, setCategoryId] = useState(txn.categoryId ?? "");
  const [note, setNote] = useState(txn.note ?? "");
  const [excludeFromBudget, setExcludeFromBudget] = useState(Boolean(txn.excludeFromBudget));
  const [applyToMerchant, setApplyToMerchant] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
  const offerApply = categoryChanged && similarCount > 0;

  async function save() {
    const dollars = Number(amount);
    if (!merchant.trim()) return setError(t("merchantRequired"));
    if (!(dollars > 0)) return setError(t("amountGt0"));

    setBusy(true);
    setError("");
    try {
      const magnitude = Math.round(dollars * 100);
      await updateTransaction(txn.id, {
        merchant: merchant.trim(),
        // Preserve the original income/expense sign.
        amountCents: txn.isIncome ? magnitude : -magnitude,
        categoryId: categoryId || null,
        note: note.trim() || null,
        excludeFromBudget,
        occurredAt: date || undefined,
        applyToMerchant: offerApply && applyToMerchant,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("saveError"));
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await deleteTransaction(txn.id);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("deleteError"));
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label={t("merchant")}>
        <input
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className={inputClass}
          placeholder={t("merchant")}
        />
      </Field>

      <Field label={txn.isIncome ? t("amountIncome") : t("amount")}>
        <div className="flex items-center gap-2">
          <span className="text-[15px] font-extrabold text-muted">$</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className={inputClass}
            placeholder="0.00"
          />
        </div>
      </Field>

      <Field label={t("date")}>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label={t("category")}>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
        >
          <option value="">{t("uncategorized")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.emoji} {c.name}
            </option>
          ))}
        </select>
      </Field>

      {offerApply && (
        <button
          type="button"
          onClick={() => setApplyToMerchant((v) => !v)}
          aria-pressed={applyToMerchant}
          className="flex items-start gap-3 rounded-xl border border-primary/30 bg-peach-soft/50 px-3 py-2.5 text-left"
        >
          <span
            className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 ${
              applyToMerchant ? "border-primary bg-primary text-white" : "border-muted bg-card"
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

      <Field label={t("note")}>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
          placeholder={t("addNote")}
        />
      </Field>

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
          <span className="block text-[13px] font-extrabold text-ink">Exclude from budget</span>
          <span className="block text-[11.5px] font-semibold text-muted">
            For transfers, credit-card & loan payments — kept out of spending totals.
          </span>
        </span>
      </button>

      {error && <div className="text-[13px] font-semibold text-primary-dark">{error}</div>}

      <div className="mt-1 flex gap-2.5">
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          disabled={busy}
          className="rounded-2xl bg-[#f7e4dc] px-4 py-3 text-[14px] font-extrabold text-primary-dark disabled:opacity-50"
        >
          Delete
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="flex-1 rounded-2xl bg-primary py-3 text-[14px] font-extrabold text-white disabled:opacity-50"
        >
          {busy ? t("saving") : t("saveChanges")}
        </button>
      </div>

      {confirmDelete && (
        <ConfirmDialog
          title={t("deleteTxnTitle")}
          message={t("cantUndo")}
          busy={busy}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-track bg-card px-3 py-2.5 text-[14px] font-semibold text-ink outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
