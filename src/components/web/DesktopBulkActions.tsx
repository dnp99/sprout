"use client";

import { Check, ChevronDown, CircleMinus, MoreHorizontal, Search, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Category, IncomeSource, Transaction } from "@/lib/types";

interface Props {
  selectedTransactions: Transaction[];
  categories: Category[];
  incomeSources: IncomeSource[];
  onCategorize: (ids: string[], categoryId: string | null) => Promise<number>;
  onSetIncomeSource: (ids: string[], incomeSourceId: string | null) => Promise<number>;
  onExclude: (ids: string[]) => Promise<number>;
  onInclude: (ids: string[]) => Promise<number>;
  onDelete: (ids: string[]) => Promise<number>;
  onClear: () => void;
}
type Menu = "category" | "source" | "more" | null;

/** Compact contextual toolbar: menu choices apply immediately, preventing a
 * second ambiguous Apply action from acting on a different transaction type. */
export function DesktopBulkActions({
  selectedTransactions,
  categories,
  incomeSources,
  onCategorize,
  onSetIncomeSource,
  onExclude,
  onInclude,
  onDelete,
  onClear,
}: Props) {
  const t = useTranslations("txns");
  const { showToast } = useToast();
  const [menu, setMenu] = useState<Menu>(null);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const expenseIds = selectedTransactions.filter((r) => !r.isIncome).map((r) => r.id);
  const incomeIds = selectedTransactions.filter((r) => r.isIncome).map((r) => r.id);
  const selectedIds = selectedTransactions.map((r) => r.id);
  const excludedIds = selectedTransactions.filter((r) => r.excludeFromBudget).map((r) => r.id);
  const close = () => {
    setMenu(null);
    setQuery("");
    setConfirmDelete(false);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  async function run(
    kind: string,
    action: () => Promise<number>,
    message: (count: number) => string,
  ) {
    setBusy(kind);
    try {
      showToast(message(await action()));
      close();
    } catch {
      showToast(t("bulkUpdateFailed"), "error");
    } finally {
      setBusy(null);
    }
  }
  const trigger =
    "flex h-9 items-center gap-1.5 rounded-[8px] border border-edge bg-card px-3 text-[12.5px] font-semibold text-ink transition hover:bg-track disabled:cursor-not-allowed disabled:opacity-45";
  const categoryItems = categories.filter((x) =>
    x.name.toLowerCase().includes(query.toLowerCase()),
  );
  const sourceItems = incomeSources.filter((x) =>
    x.name.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <section
      aria-label={t("bulkActions")}
      className="relative flex flex-wrap items-center gap-2 rounded-[10px] border border-edge bg-card p-2"
    >
      <span className="flex h-9 items-center gap-1.5 px-2 text-[13px] font-semibold text-ink">
        <Check size={14} className="text-primary" />
        {t("selectedN", { count: selectedTransactions.length })}
      </span>
      <ActionMenu
        open={menu === "category"}
        setOpen={() => setMenu(menu === "category" ? null : "category")}
        label={t("category")}
        disabled={!expenseIds.length || busy !== null}
        trigger={trigger}
      >
        <Picker query={query} setQuery={setQuery} placeholder={t("searchCategories")}>
          {categoryItems.map((x) => (
            <Item
              key={x.id}
              label={`${x.emoji} ${x.name}`}
              onClick={() =>
                void run(
                  "category",
                  () => onCategorize(expenseIds, x.id),
                  (count) => t("bulkCategoryChanged", { count, category: x.name }),
                )
              }
            />
          ))}
        </Picker>
      </ActionMenu>
      <ActionMenu
        open={menu === "source"}
        setOpen={() => setMenu(menu === "source" ? null : "source")}
        label={t("incomeSource")}
        disabled={!incomeIds.length || busy !== null}
        trigger={trigger}
      >
        <Picker
          query={query}
          setQuery={setQuery}
          placeholder={t("searchIncomeSources")}
          hint={t("incomeSourceScope", { income: incomeIds.length, expense: expenseIds.length })}
        >
          <Item
            label={t("unassignedIncome")}
            onClick={() =>
              void run(
                "source",
                () => onSetIncomeSource(incomeIds, null),
                (count) => t("bulkSourceChanged", { count, source: t("unassignedIncome") }),
              )
            }
          />
          {sourceItems.map((x) => (
            <Item
              key={x.id}
              label={`${x.emoji} ${x.name}`}
              onClick={() =>
                void run(
                  "source",
                  () => onSetIncomeSource(incomeIds, x.id),
                  (count) => t("bulkSourceChanged", { count, source: x.name }),
                )
              }
            />
          ))}
        </Picker>
      </ActionMenu>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() =>
          void run(
            "exclude",
            () => onExclude(selectedIds),
            (count) => t("bulkExcluded", { count }),
          )
        }
        className={trigger}
      >
        <CircleMinus size={14} />
        {busy === "exclude" ? t("excluding") : t("exclude")}
      </button>
      <div className="relative">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => setMenu(menu === "more" ? null : "more")}
          aria-expanded={menu === "more"}
          className={trigger}
        >
          <MoreHorizontal size={16} />
          {t("more")}
        </button>
        {menu === "more" && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-52 rounded-[12px] border border-edge bg-card p-1.5 shadow-lg">
            {excludedIds.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  void run(
                    "include",
                    () => onInclude(excludedIds),
                    (count) => t("bulkIncluded", { count }),
                  )
                }
                className="flex w-full rounded-[8px] px-3 py-2 text-left text-[12.5px] font-medium text-ink hover:bg-track"
              >
                {t("includeInBudget")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center gap-2 rounded-[8px] px-3 py-2 text-left text-[12.5px] font-medium text-primary hover:bg-primary-soft"
            >
              <Trash2 size={14} />
              {t("delete")}
            </button>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClear}
        className="ml-auto flex h-9 items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-medium text-muted hover:bg-track hover:text-ink"
      >
        <X size={14} />
        {t("clear")}
      </button>
      {confirmDelete && (
        <ConfirmDialog
          title={t("deleteN", { count: selectedIds.length })}
          message={t("bulkDeleteConfirm")}
          confirmLabel={t("delete")}
          cancelLabel={t("cancel")}
          busy={busy === "delete"}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() =>
            void run(
              "delete",
              () => onDelete(selectedIds),
              (count) => t("bulkDeleted", { count }),
            )
          }
        />
      )}
    </section>
  );
}
function ActionMenu({
  open,
  setOpen,
  label,
  disabled,
  trigger,
  children,
}: {
  open: boolean;
  setOpen: () => void;
  label: string;
  disabled: boolean;
  trigger: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={setOpen}
        aria-expanded={open}
        className={trigger}
      >
        {label}
        <ChevronDown size={14} />
      </button>
      {open && children}
    </div>
  );
}
function Picker({
  query,
  setQuery,
  placeholder,
  hint,
  children,
}: {
  query: string;
  setQuery: (value: string) => void;
  placeholder: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute left-0 top-[calc(100%+8px)] z-40 w-64 rounded-[12px] border border-edge bg-card p-2 shadow-lg">
      <div className="flex items-center gap-2 rounded-[8px] border border-edge px-2">
        <Search size={13} className="text-muted" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="h-8 min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-muted"
        />
      </div>
      {hint && <p className="px-1 pt-2 text-[11px] text-muted">{hint}</p>}
      <div className="mt-1 max-h-52 overflow-y-auto">{children}</div>
    </div>
  );
}
function Item({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full rounded-[8px] px-2.5 py-2 text-left text-[12.5px] font-medium text-ink hover:bg-track"
    >
      {label}
    </button>
  );
}
