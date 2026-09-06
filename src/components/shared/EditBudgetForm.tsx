"use client";

import { BriefcaseBusiness, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { allocation } from "@/lib/budget";
import { formatBudgetInput, formatMoney, parseBudgetInput } from "@/lib/format";
import type { Category, IncomeSource } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { AddCategoryForm } from "./AddCategoryForm";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";

/** The one "everything" budget editor — set the monthly total, allocate it
 *  across every category, and add/remove categories, all in one place. Rendered
 *  inside the desktop modal and the mobile budget sheet (see plans/007 → the
 *  Budget-tab redesign). Reads/writes the store directly, so both surfaces stay
 *  in sync. */
export function EditBudgetForm({ onClose }: { onClose: () => void }) {
  const t = useTranslations("addFlow");
  const tBudget = useTranslations("budget");
  const { showToast } = useToast();
  const {
    user,
    categories,
    incomeSources,
    webBudgets,
    setBudgetPool,
    setBudget,
    removeCategory,
    removeIncomeSource,
    saveIncomeSource,
  } = useStore(
    useShallow((s) => ({
      user: s.user,
      categories: s.categories,
      incomeSources: s.incomeSources,
      webBudgets: s.webBudgets,
      setBudgetPool: s.setBudgetPool,
      setBudget: s.setBudget,
      removeCategory: s.removeCategory,
      removeIncomeSource: s.removeIncomeSource,
      saveIncomeSource: s.saveIncomeSource,
    })),
  );
  // Swap to the create-category form in place (avoids stacking modals/sheets).
  const [adding, setAdding] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState<Category | null>(null);
  const [confirmIncomeRemove, setConfirmIncomeRemove] = useState<IncomeSource | null>(null);
  const [busy, setBusy] = useState(false);
  const [addingIncome, setAddingIncome] = useState(false);
  const [incomeName, setIncomeName] = useState("");
  const [incomeExpected, setIncomeExpected] = useState<Record<string, number>>({});

  const { allocated, remaining, over } = allocation(webBudgets, user.budgetPoolCents);
  const expectedIncome = incomeSources.reduce(
    (sum, source) => sum + (incomeExpected[source.id] ?? source.expectedMonthlyCents),
    0,
  );
  const plannedSavings = expectedIncome - user.budgetPoolCents;

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

  async function removeIncome() {
    if (!confirmIncomeRemove) return;
    setBusy(true);
    try {
      // Deleting a source intentionally retains its historical transactions;
      // the repository clears their source so received income still reconciles.
      await removeIncomeSource(confirmIncomeRemove.id);
      setConfirmIncomeRemove(null);
    } finally {
      setBusy(false);
    }
  }

  async function saveChanges() {
    if (over) return;
    setBusy(true);
    try {
      await Promise.all(
        incomeSources.map((source) =>
          saveIncomeSource(
            {
              name: source.name,
              emoji: source.emoji,
              expectedMonthlyCents: incomeExpected[source.id] ?? source.expectedMonthlyCents,
            },
            source.id,
          ),
        ),
      );
      if (incomeName.trim())
        await saveIncomeSource({ name: incomeName.trim(), emoji: "💼", expectedMonthlyCents: 0 });
      showToast("Monthly plan saved");
      onClose();
    } catch {
      showToast("Couldn’t save your monthly plan. Try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="border-b border-edge pb-4">
        <div className="flex items-center justify-between">
          <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">
            Expected income
          </div>
          <button
            type="button"
            onClick={() => setAddingIncome(true)}
            className="text-[12px] font-semibold text-primary"
          >
            + Add income source
          </button>
        </div>
        <p className="mt-1 text-[12px] text-muted">
          Received income is calculated from categorized transactions.
        </p>
        <div className="mt-3 space-y-2">
          {incomeSources.map((source) => (
            <div key={source.id} className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-track text-primary">
                <BriefcaseBusiness size={15} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
                {source.name}
              </span>
              <div className="flex items-center gap-1 rounded-[10px] border border-edge px-2.5 py-1.5 focus-within:border-primary">
                <span className="text-[13px] font-semibold text-muted">$</span>
                <MoneyInput
                  cents={incomeExpected[source.id] ?? source.expectedMonthlyCents}
                  onSet={(cents) => setIncomeExpected((prev) => ({ ...prev, [source.id]: cents }))}
                  className="w-[72px] bg-transparent text-right text-[13.5px] font-semibold tabular-nums text-ink outline-none"
                  placeholder="0"
                />
              </div>
              <button
                type="button"
                onClick={() => setConfirmIncomeRemove(source)}
                aria-label={`${tBudget("delete")} ${source.name}`}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-lg text-muted transition-colors hover:bg-track/60 hover:text-primary"
              >
                <Trash2 size={15} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
        {addingIncome && (
          <div className="mt-3 flex gap-2">
            <input
              value={incomeName}
              onChange={(e) => setIncomeName(e.target.value)}
              placeholder="Income source name"
              className="h-10 min-w-0 flex-1 rounded-[9px] border border-edge bg-card px-3 text-[13px] outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => setAddingIncome(false)}
              className="px-2 text-[12px] font-semibold text-muted"
            >
              Cancel
            </button>
          </div>
        )}
        <div className="mt-3 text-[12px] font-semibold text-green">
          Total expected income: {formatMoney(expectedIncome)}
        </div>
      </section>
      {/* Monthly total */}
      <div>
        <div className="text-[10.5px] font-bold uppercase tracking-[.05em] text-muted">
          Monthly spending limit
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
          Expense allocations
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
              aria-label={t("remove") + " " + category.name}
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
        <Plus size={14} strokeWidth={2.4} />+ Add expense category
      </button>

      <div className="grid grid-cols-2 gap-2 rounded-[10px] bg-track p-3 text-[12px] font-medium text-muted">
        <div>
          Expected income{" "}
          <span className="float-right font-semibold text-ink">{formatMoney(expectedIncome)}</span>
        </div>
        <div>
          Spending limit{" "}
          <span className="float-right font-semibold text-ink">
            {formatMoney(user.budgetPoolCents)}
          </span>
        </div>
        <div>
          Allocated to expenses{" "}
          <span className="float-right font-semibold text-ink">{formatMoney(allocated)}</span>
        </div>
        <div>
          Unallocated spending budget{" "}
          <span className={`float-right font-semibold ${over ? "text-danger" : "text-green"}`}>
            {formatMoney(Math.abs(remaining))}
          </span>
        </div>
      </div>
      {over ? (
        <p className="text-[12px] font-semibold text-danger">
          Overallocated by {formatMoney(-remaining)}
        </p>
      ) : plannedSavings > 0 ? (
        <p className="text-[12px] font-semibold text-green">
          Planned savings: {formatMoney(plannedSavings)}
        </p>
      ) : user.budgetPoolCents > expectedIncome ? (
        <p className="text-[12px] font-medium text-warning">
          Your spending limit is {formatMoney(user.budgetPoolCents - expectedIncome)} higher than
          your expected income.
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => void saveChanges()}
        disabled={over || busy}
        className="w-full rounded-[12px] bg-primary py-3 text-center text-[14px] font-semibold text-onprimary disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save changes"}
      </button>

      {confirmRemove && (
        <ConfirmDialog
          title={t("removeCategory")}
          message={t("removeCategoryMsg", { name: confirmRemove.name })}
          busy={busy}
          onCancel={() => setConfirmRemove(null)}
          onConfirm={remove}
        />
      )}
      {confirmIncomeRemove && (
        <ConfirmDialog
          title={tBudget("deleteSource")}
          message={tBudget("deleteSourceBody", { name: confirmIncomeRemove.name })}
          confirmLabel={tBudget("delete")}
          cancelLabel={tBudget("keep")}
          busyLabel={tBudget("deleting")}
          busy={busy}
          onCancel={() => setConfirmIncomeRemove(null)}
          onConfirm={removeIncome}
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
