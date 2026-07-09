"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { allocation } from "@/lib/budget";
import { formatBudgetInput, formatMoney, parseBudgetInput } from "@/lib/format";
import type { Category } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { AddCategoryForm } from "./AddCategoryForm";

/** The one "everything" budget editor — set the monthly total, allocate it
 *  across every category, and add/remove categories, all in one place. Rendered
 *  inside the desktop modal and the mobile budget sheet (see plans/007 → the
 *  Budget-tab redesign). Reads/writes the store directly, so both surfaces stay
 *  in sync. */
export function EditBudgetForm({ onClose }: { onClose: () => void }) {
  const { user, categories, webBudgets, setBudgetPool, setBudget, removeCategory } = useStore(
    useShallow((s) => ({
      user: s.user,
      categories: s.categories,
      webBudgets: s.webBudgets,
      setBudgetPool: s.setBudgetPool,
      setBudget: s.setBudget,
      removeCategory: s.removeCategory,
    })),
  );
  // Swap to the create-category form in place (avoids stacking modals/sheets).
  const [adding, setAdding] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  const { allocated, remaining, over } = allocation(webBudgets, user.budgetPoolCents);

  if (adding) {
    return <AddCategoryForm onDone={() => setAdding(false)} />;
  }

  async function remove() {
    if (!confirmRemove) return;
    setBusy(true);
    try {
      await removeCategory(confirmRemove.id);
      setConfirmRemove(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Monthly total */}
      <div>
        <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">
          Monthly budget
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 rounded-[12px] border border-edge px-3.5 py-3 focus-within:border-primary">
          <span className="text-[22px] font-bold text-muted">$</span>
          <MoneyInput
            cents={user.budgetPoolCents}
            onSet={setBudgetPool}
            className="w-full bg-transparent text-[22px] font-bold tabular-nums text-ink outline-none placeholder:text-subtle"
            placeholder="0"
          />
        </div>
        <div className="mt-2 text-[12px] font-medium text-muted">
          {formatMoney(allocated)} allocated ·{" "}
          <span className={over ? "font-semibold text-primary" : "font-semibold text-green"}>
            {over ? `${formatMoney(-remaining)} over` : `${formatMoney(remaining)} to allocate`}
          </span>
        </div>
      </div>

      {/* Per-category allocation */}
      <div className="flex flex-col gap-2">
        <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">
          Give every dollar a job
        </div>
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-2.5">
            <span className="text-[18px]">{category.emoji}</span>
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
              {category.name}
            </span>
            <div className="flex items-center gap-1 rounded-[10px] border border-edge px-2.5 py-1.5 focus-within:border-primary">
              <span className="text-[13px] font-semibold text-muted">$</span>
              <MoneyInput
                cents={webBudgets[category.id] ?? 0}
                onSet={(cents) => setBudget(category.id, cents)}
                className="w-[64px] bg-transparent text-right text-[13.5px] font-semibold tabular-nums text-ink outline-none"
                placeholder="0"
              />
            </div>
            <button
              type="button"
              onClick={() => setConfirmRemove(category)}
              aria-label={`Remove ${category.name}`}
              className="flex h-10 w-10 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-track/60 hover:text-primary"
            >
              <Trash2 size={15} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex items-center justify-center gap-1.5 rounded-[10px] border border-dashed border-edge py-2.5 text-[12.5px] font-semibold text-muted transition-colors hover:border-muted hover:text-ink"
      >
        <Plus size={14} strokeWidth={2.4} />
        New category
      </button>

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-[12px] bg-primary py-3 text-center text-[14px] font-semibold text-onprimary"
      >
        Done
      </button>

      {confirmRemove && (
        <ConfirmDialog
          title="Remove category?"
          message={`“${confirmRemove.name}” is removed and its transactions become uncategorized.`}
          busy={busy}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

/** Dollar input with a local buffer while typing; shows the live formatted value
 *  when idle (so external updates — e.g. steppers elsewhere — reflect). Blank
 *  when unset, per the money-input convention (see format.ts). */
function MoneyInput({
  cents,
  onSet,
  className,
  placeholder,
}: {
  cents: number;
  onSet: (cents: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  return (
    <input
      value={editing ? text : formatBudgetInput(cents)}
      inputMode="decimal"
      autoCapitalize="none"
      spellCheck={false}
      placeholder={placeholder}
      onFocus={() => {
        setEditing(true);
        setText(formatBudgetInput(cents));
      }}
      onChange={(e) => {
        setText(e.target.value);
        onSet(parseBudgetInput(e.target.value));
      }}
      onBlur={() => setEditing(false)}
      className={className}
    />
  );
}
