"use client";

import { useState } from "react";
import { useStore } from "@/state/store";

/**
 * Compact bottom-sheet for adding an expense. A lighter take on the prototype's
 * full Add screen — enough to exercise the local-state loop so the Home
 * numbers update live. The full keypad Add screen comes in a later pass.
 */
export function AddExpenseSheet({ onClose }: { onClose: () => void }) {
  const { categories, addExpense } = useStore();
  const spendable = categories.filter((c) => c.id !== "c_bills");

  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [categoryId, setCategoryId] = useState(spendable[0]?.id ?? "");

  const amountCents = Math.round(Number(amount) * 100);
  const canSave = merchant.trim().length > 0 && amountCents > 0 && Boolean(categoryId);

  const handleSave = () => {
    if (!canSave) return;
    addExpense({ merchant: merchant.trim(), amountCents, categoryId });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/30" onClick={onClose}>
      <div
        className="w-full max-w-app rounded-t-[28px] bg-bg p-6 pb-8 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-muted">
            Cancel
          </button>
          <span className="text-[15px] font-extrabold text-ink">New expense ✨</span>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="text-sm font-extrabold text-primary disabled:opacity-40"
          >
            Save
          </button>
        </div>

        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-1 text-5xl font-extrabold text-ink">
            <span className="text-3xl text-muted">$</span>
            <input
              autoFocus
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              className="w-40 bg-transparent text-center outline-none placeholder:text-subtle"
            />
          </div>
          <div className="mt-1 text-xs font-medium text-muted">Amount</div>
        </div>

        <input
          value={merchant}
          onChange={(event) => setMerchant(event.target.value)}
          placeholder="Where did you spend it?"
          className="mt-6 w-full rounded-pill bg-card px-4 py-3.5 text-sm font-semibold text-ink outline-none placeholder:font-medium placeholder:text-subtle"
        />

        <div className="mt-4 flex flex-wrap gap-2">
          {spendable.map((c) => {
            const active = c.id === categoryId;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`rounded-full px-4 py-2 text-[12.5px] font-bold transition ${
                  active ? "bg-primary text-white" : "bg-card text-ink/70"
                }`}
              >
                {c.emoji} {c.name}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="mt-6 w-full rounded-[20px] bg-primary py-4 text-[15px] font-extrabold text-white transition active:scale-[0.99] disabled:opacity-40"
        >
          Add expense 🌱
        </button>
      </div>
    </div>
  );
}
