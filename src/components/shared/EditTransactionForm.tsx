"use client";

import { useMemo, useState } from "react";
import { normalizeMerchant } from "@/lib/import/normalize";
import type { Transaction } from "@/lib/types";
import { useStore } from "@/state/store";

/** Edit a transaction's merchant, amount, category and note (shared by the web
 *  modal and the mobile detail screen). Amount is edited as a positive dollar
 *  value; the original income/expense sign is preserved. */
export function EditTransactionForm({ txn, onDone }: { txn: Transaction; onDone: () => void }) {
  const { categories, transactions, updateTransaction, deleteTransaction } = useStore();

  const [merchant, setMerchant] = useState(txn.merchant);
  const [amount, setAmount] = useState((Math.abs(txn.amountCents) / 100).toFixed(2));
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
    const pattern = normalizeMerchant(txn.merchant);
    if (!pattern) return 0;
    return transactions.filter(
      (t) =>
        t.id !== txn.id &&
        (t.categoryId ?? "") !== categoryId &&
        normalizeMerchant(t.merchant) === pattern,
    ).length;
  }, [transactions, txn.id, txn.merchant, categoryId]);

  // Only offer "apply to all" when the category actually changed and there are
  // other rows to update.
  const categoryChanged = categoryId !== (txn.categoryId ?? "");
  const offerApply = categoryChanged && similarCount > 0;

  async function save() {
    const dollars = Number(amount);
    if (!merchant.trim()) return setError("Merchant is required.");
    if (!(dollars > 0)) return setError("Enter an amount greater than 0.");

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
        applyToMerchant: offerApply && applyToMerchant,
      });
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save changes.");
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
      setError(e instanceof Error ? e.message : "Couldn't delete.");
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field label="Merchant">
        <input
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className={inputClass}
          placeholder="Merchant"
        />
      </Field>

      <Field label={txn.isIncome ? "Amount (income)" : "Amount"}>
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

      <Field label="Category">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={inputClass}
        >
          <option value="">Uncategorized</option>
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
            Also apply to the {similarCount} other “{txn.merchant}”{" "}
            {similarCount === 1 ? "transaction" : "transactions"} and future ones.
          </span>
        </button>
      )}

      <Field label="Note">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={inputClass}
          placeholder="Add a note"
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

      {confirmDelete ? (
        <div className="mt-1 flex flex-col gap-2 rounded-2xl bg-track p-3">
          <span className="text-[13px] font-bold text-ink">
            Delete this transaction? This can’t be undone.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={busy}
              className="flex-1 rounded-xl bg-card py-2.5 text-[13px] font-extrabold text-muted disabled:opacity-50"
            >
              Keep it
            </button>
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="flex-1 rounded-xl bg-primary-dark py-2.5 text-[13px] font-extrabold text-white disabled:opacity-50"
            >
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      ) : (
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
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
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
