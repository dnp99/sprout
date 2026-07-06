"use client";

import { Keypad } from "@/components/ui/Keypad";
import { Chip, SegmentedControl, Toggle } from "@/components/ui/controls";
import { formatMoney } from "@/lib/format";
import type { AddMode, Frequency } from "@/lib/types";
import { useStore } from "@/state/store";

const MODE_OPTIONS: { value: AddMode; label: string }[] = [
  { value: "expense", label: "💸 Expense" },
  { value: "income", label: "💰 Income" },
];

const FREQUENCIES: Frequency[] = ["Weekly", "Monthly", "Yearly"];

/** Shared add-transaction form: mode toggle, amount (cents-style entry — digits
 *  fill from the right so the decimal is automatic), merchant, category chips
 *  from the user's real categories, recurring toggle, and (mobile) a keypad.
 *  Save is owned by the parent. */
export function AddForm({ showKeypad = false }: { showKeypad?: boolean }) {
  const {
    categories,
    addMode,
    addAmountCents,
    addMerchant,
    addCategoryId,
    addRecurring,
    addFrequency,
    set,
    pressKey,
  } = useStore();

  const isIncome = addMode === "income";
  const amountStr = formatMoney(addAmountCents, { forceCents: true, signed: isIncome });

  return (
    <div className="flex flex-1 flex-col">
      <SegmentedControl
        options={MODE_OPTIONS}
        value={addMode}
        onChange={(value) => set({ addMode: value })}
      />

      <div
        className="mt-5 flex items-center justify-center text-[46px] font-extrabold tracking-tight tabular-nums"
        style={{ color: isIncome ? "#4f7a3a" : "#d97a54" }}
      >
        {showKeypad ? (
          // Mobile: amount is driven by the keypad below.
          amountStr
        ) : (
          // Web: physical-keyboard entry — digits fill from the right (cents),
          // so "1234" reads $12.34; Backspace removes the last digit.
          <input
            autoFocus
            value={amountStr}
            onChange={() => {}}
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
            aria-label="Amount"
            className="w-full bg-transparent text-center caret-transparent outline-none"
          />
        )}
      </div>

      <input
        value={addMerchant}
        onChange={(e) => set({ addMerchant: e.target.value })}
        placeholder={isIncome ? "Source (e.g. Paycheck)" : "Merchant (e.g. Whole Foods)"}
        className="mt-4 w-full rounded-2xl bg-card px-4 py-3 text-center text-[14px] font-semibold text-ink outline-none placeholder:text-subtle"
      />

      {!isIncome && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {categories.length === 0 ? (
            <span className="text-[12px] font-semibold text-muted">
              No categories yet — add one first.
            </span>
          ) : (
            categories.map((cat) => (
              <Chip
                key={cat.id}
                active={addCategoryId === cat.id}
                onClick={() => set({ addCategoryId: cat.id })}
              >
                {cat.emoji} {cat.name}
              </Chip>
            ))
          )}
        </div>
      )}

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
