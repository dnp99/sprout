"use client";

import { Keypad } from "@/components/ui/Keypad";
import { Chip, SegmentedControl, Toggle } from "@/components/ui/controls";
import { formatMoney } from "@/lib/format";
import type { AddMode, Frequency } from "@/lib/types";
import { useStore } from "@/state/store";

const EXPENSE_CATS: { id: string; label: string }[] = [
  { id: "groceries", label: "🛒 Groceries" },
  { id: "dining", label: "🍽️ Dining" },
  { id: "transport", label: "🚗 Transport" },
  { id: "shopping", label: "🛍️ Shopping" },
];

const INCOME_CATS = ["💰 Salary", "💻 Freelance", "🎁 Gift", "➕ Other"];

const MODE_OPTIONS: { value: AddMode; label: string }[] = [
  { value: "expense", label: "💸 Expense" },
  { value: "income", label: "💰 Income" },
];

const FREQUENCIES: Frequency[] = ["Weekly", "Monthly", "Yearly"];

/** Shared add-transaction form: mode toggle, amount, category chips, recurring
 *  toggle + frequency, and (mobile only) a keypad. Save is owned by the parent. */
export function AddForm({ showKeypad = false }: { showKeypad?: boolean }) {
  const { addMode, addAmountCents, addCategoryId, addRecurring, addFrequency, set, pressKey } =
    useStore();
  const isIncome = addMode === "income";
  const amountStr = isIncome
    ? formatMoney(addAmountCents, { forceCents: true, signed: true })
    : formatMoney(addAmountCents, { forceCents: true });

  return (
    <div className="flex flex-1 flex-col">
      <SegmentedControl
        options={MODE_OPTIONS}
        value={addMode}
        onChange={(value) => set({ addMode: value })}
      />

      <div className="mt-5 text-center">
        <div
          className="text-[46px] font-extrabold tracking-tight tabular-nums"
          style={{ color: isIncome ? "#4f7a3a" : "#d97a54" }}
        >
          {amountStr}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {isIncome
          ? INCOME_CATS.map((label, i) => (
              <Chip key={label} active={i === 0}>
                {label}
              </Chip>
            ))
          : EXPENSE_CATS.map((cat) => (
              <Chip
                key={cat.id}
                active={addCategoryId === cat.id}
                onClick={() => set({ addCategoryId: cat.id })}
              >
                {cat.label}
              </Chip>
            ))}
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl bg-card px-4 py-3">
        <span className="text-xl">🔄</span>
        <div className="flex-1">
          <div className="text-sm font-extrabold text-ink">Recurring</div>
          <div className="text-[11px] font-semibold text-muted">Repeat automatically</div>
        </div>
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
                className={`flex-1 rounded-[14px] py-2.5 text-center text-[12.5px] transition ${
                  active ? "bg-green font-extrabold text-white" : "bg-card font-bold text-muted"
                }`}
              >
                {freq}
              </button>
            );
          })}
        </div>
      )}

      {showKeypad && (
        <div className="mt-auto pt-5">
          <Keypad onPress={pressKey} />
        </div>
      )}
    </div>
  );
}
