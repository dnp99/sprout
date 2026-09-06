"use client";

import { BriefcaseBusiness, Info, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { Modal } from "@/components/ui/overlays";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Popover } from "@/components/ui/Popover";
import { formatBudgetInput, formatMoney, parseBudgetInput } from "@/lib/format";
import type { IncomeSource } from "@/lib/types";
import { useStore } from "@/state/store";
import { useShallow } from "zustand/react/shallow";
import { useTranslations } from "next-intl";

export type IncomeSourcesBudgetPanelHandle = {
  openAdd: () => void;
};

/** Month-scoped source plans and received income; sources stay distinct from expense envelopes. */
export const IncomeSourcesBudgetPanel = forwardRef<
  IncomeSourcesBudgetPanelHandle,
  {
    monthKey: string;
    compact?: boolean;
    showAddButton?: boolean;
  }
>(function IncomeSourcesBudgetPanel({ monthKey, compact = false, showAddButton = true }, ref) {
  const t = useTranslations("budget");
  const { incomeSources, transactions } = useStore(
    useShallow((s) => ({ incomeSources: s.incomeSources, transactions: s.transactions })),
  );
  const [editing, setEditing] = useState<IncomeSource | null | "new">(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<IncomeSource | null>(null);
  useImperativeHandle(ref, () => ({ openAdd: () => setEditing("new") }), []);
  const remove = useStore((s) => s.removeIncomeSource);
  const received = useMemo(() => {
    const totals = new Map<string, number>();
    transactions.forEach((txn) => {
      if (txn.isIncome && !txn.excludeFromBudget && txn.occurredAt.slice(0, 7) === monthKey) {
        const id = txn.incomeSourceId ?? "unassigned";
        totals.set(id, (totals.get(id) ?? 0) + txn.amountCents);
      }
    });
    return totals;
  }, [monthKey, transactions]);
  const expected = incomeSources.reduce((sum, source) => sum + source.expectedMonthlyCents, 0);
  const receivedTotal = [...received.values()].reduce((sum, amount) => sum + amount, 0);
  const unassigned = received.get("unassigned") ?? 0;
  const remaining = Math.max(0, expected - receivedTotal);
  return (
    <section className={compact ? "" : "rounded-[14px] border border-edge bg-card p-5"}>
      {editing && (
        <Modal
          title={editing === "new" ? t("addIncomeSource") : t("editIncomeSource")}
          onClose={() => setEditing(null)}
          width={440}
        >
          <div className="mt-4">
            <IncomeSourceForm
              source={editing === "new" ? undefined : editing}
              onDone={() => setEditing(null)}
            />
          </div>
        </Modal>
      )}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-ink">{t("incomeSources")}</h2>
          <p className="mt-1 text-[12px] font-medium text-muted">{t("incomeIntro")}</p>
        </div>
        {showAddButton && (
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex h-10 items-center gap-1.5 rounded-[9px] bg-primary px-3 text-[12px] font-semibold text-onprimary"
          >
            <Plus size={15} />
            {t("addIncomeSource")}
          </button>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 border-y border-edge py-3">
        <IncomeStat label={t("expected")} value={expected} />
        <IncomeStat label={t("received")} value={receivedTotal} />
        <IncomeStat label={t("remaining")} value={remaining} />
      </div>
      <div className="mt-3 space-y-2">
        {incomeSources.map((source) => {
          const amount = received.get(source.id) ?? 0;
          const status =
            source.expectedMonthlyCents === 0
              ? t("notPlanned")
              : amount >= source.expectedMonthlyCents
                ? t("received")
                : amount > 0
                  ? t("partial")
                  : t("pending");
          return (
            <div
              key={source.id}
              className="relative flex min-h-14 items-center gap-3 rounded-[10px] border border-edge px-3"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-track text-primary">
                <BriefcaseBusiness size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-ink">{source.name}</div>
                <div className="mt-0.5 text-[11px] font-medium text-muted">
                  {formatMoney(source.expectedMonthlyCents)} {t("expected").toLowerCase()} ·{" "}
                  {formatMoney(amount)} {t("received").toLowerCase()}
                </div>
              </div>
              <span
                className={
                  status === t("received")
                    ? "text-[11px] font-semibold text-green"
                    : "text-[11px] font-semibold text-muted"
                }
              >
                {status}
              </span>
              <Popover
                open={menuId === source.id}
                onClose={() => setMenuId(null)}
                className="relative"
              >
                <button
                  type="button"
                  aria-label={t("actionsFor", { name: source.name })}
                  onClick={() => setMenuId(menuId === source.id ? null : source.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-[8px] text-muted hover:bg-track"
                >
                  <MoreHorizontal size={17} />
                </button>
                {menuId === source.id && (
                  <div className="absolute right-0 top-[calc(100%+4px)] z-20 w-36 rounded-[10px] border border-edge bg-card p-1 shadow-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(source);
                        setMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-[7px] px-2 py-2 text-[12px] font-medium text-ink hover:bg-track"
                    >
                      <Pencil size={13} />
                      {t("edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleting(source);
                        setMenuId(null);
                      }}
                      className="flex w-full items-center gap-2 rounded-[7px] px-2 py-2 text-[12px] font-medium text-primary hover:bg-primary-soft"
                    >
                      <Trash2 size={13} />
                      {t("delete")}
                    </button>
                  </div>
                )}
              </Popover>
            </div>
          );
        })}
        {unassigned > 0 && (
          <IncomeRow
            label={t("unassignedIncome")}
            amount={unassigned}
            tooltip={t("unassignedIncomeInfo")}
            tooltipLabel={t("unassignedIncomeHelp")}
          />
        )}
        {incomeSources.length === 0 && (
          <p className="rounded-[10px] border border-dashed border-edge px-3 py-5 text-center text-[12px] font-medium text-muted">
            {t("emptyIncome")}
          </p>
        )}
      </div>
      {deleting && (
        <ConfirmDialog
          title={t("deleteSource")}
          message={t("deleteSourceBody", { name: deleting.name })}
          cancelLabel={t("keep")}
          confirmLabel={t("delete")}
          busyLabel={t("deleting")}
          onCancel={() => setDeleting(null)}
          onConfirm={() => void remove(deleting.id).then(() => setDeleting(null))}
        />
      )}
    </section>
  );
});
function IncomeStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[.05em] text-muted">{label}</div>
      <div className="mt-1 text-[16px] font-bold tabular-nums text-ink">{formatMoney(value)}</div>
    </div>
  );
}
function IncomeRow({
  label,
  amount,
  tooltip,
  tooltipLabel,
}: {
  label: string;
  amount: number;
  tooltip?: string;
  tooltipLabel?: string;
}) {
  return (
    <div className="flex min-h-14 items-center gap-3 rounded-[10px] border border-dashed border-edge px-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-track text-muted">
        <BriefcaseBusiness size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <div className="truncate text-[13px] font-semibold text-ink">{label}</div>
          {tooltip && tooltipLabel && (
            <span className="group relative flex flex-none">
              <button
                type="button"
                aria-label={tooltipLabel}
                aria-describedby="unassigned-income-help"
                className="flex h-6 w-6 items-center justify-center rounded-full text-muted transition hover:bg-track hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Info size={14} strokeWidth={2} />
              </button>
              <span
                id="unassigned-income-help"
                role="tooltip"
                className="pointer-events-none absolute bottom-[calc(100%+6px)] left-1/2 z-20 w-60 -translate-x-1/2 rounded-[8px] bg-ink px-2.5 py-2 text-center text-[11px] font-medium leading-snug text-bg opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
              >
                {tooltip}
              </span>
            </span>
          )}
        </div>
      </div>
      <span className="text-[12px] font-semibold tabular-nums text-ink">{formatMoney(amount)}</span>
    </div>
  );
}
function IncomeSourceForm({ source, onDone }: { source?: IncomeSource; onDone: () => void }) {
  const t = useTranslations("budget");
  const save = useStore((s) => s.saveIncomeSource);
  const [name, setName] = useState(source?.name ?? "");
  const [amount, setAmount] = useState(formatBudgetInput(source?.expectedMonthlyCents ?? 0));
  const [busy, setBusy] = useState(false);
  const cents = parseBudgetInput(amount);
  // A source can be useful purely as a label for variable or imported income;
  // $0 therefore remains valid while the name is the only required field.
  const valid = Boolean(name.trim());
  async function submit() {
    if (!valid) return;
    setBusy(true);
    try {
      await save(
        { name: name.trim(), emoji: source?.emoji ?? "💼", expectedMonthlyCents: cents },
        source?.id,
      );
      onDone();
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-3"
    >
      <label className="block text-[12px] font-semibold text-ink">
        {t("name")}
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          className="mt-1.5 h-11 w-full rounded-[9px] border border-edge bg-card px-3 text-[13px] outline-none focus:border-primary"
        />
      </label>
      <label className="block text-[12px] font-semibold text-ink">
        {t("expectedMonthlyIncome")}
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          className="mt-1.5 h-11 w-full rounded-[9px] border border-edge bg-card px-3 text-[13px] outline-none focus:border-primary"
        />
      </label>
      <button
        disabled={!valid || busy}
        className="h-11 w-full rounded-[9px] bg-primary text-[13px] font-semibold text-onprimary disabled:opacity-50"
      >
        {busy ? t("saving") : source ? t("saveChanges") : t("addIncomeSource")}
      </button>
    </form>
  );
}
