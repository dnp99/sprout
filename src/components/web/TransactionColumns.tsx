"use client";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/Checkbox";
import { useTranslations } from "next-intl";
import { TRANSACTION_GRID } from "./DesktopTransactionRow";
import type { SortKey, SortDir } from "@/lib/search";
const COLUMNS: { key: SortKey; label: string; align?: string }[] = [
  { key: "merchant", label: "colMerchant" },
  { key: "category", label: "colCategory" },
  { key: "date", label: "colDate" },
  { key: "amount", label: "colAmount", align: "justify-end pr-2 text-right" },
];

export function TransactionColumns({
  allSelected,
  toggleAll,
  webSortKey,
  webSortDir,
  webTxnType,
  categoryFiltered,
  sortBy,
}: {
  allSelected: boolean;
  toggleAll: () => void;
  webSortKey: SortKey;
  webSortDir: SortDir;
  webTxnType: string;
  categoryFiltered: boolean;
  sortBy: (key: SortKey) => void;
}) {
  const t = useTranslations("txns");
  return (
    <div
      className={`${TRANSACTION_GRID} h-full select-none px-3 text-[11px] font-semibold uppercase tracking-[.03em] text-muted`}
    >
      <Checkbox checked={allSelected} onChange={toggleAll} label={t("selectAll")} />
      {COLUMNS.map((col) => {
        const active = webSortKey === col.key;
        const labelKey =
          col.key === "category" && webTxnType === "income" ? "colIncomeSource" : col.label;
        const filtered = col.key === "category" && categoryFiltered;
        return (
          <button
            key={col.key}
            type="button"
            onClick={() => sortBy(col.key)}
            title={t("sortBy", { column: t(labelKey).toLowerCase() })}
            className={`flex items-center gap-1 ${col.align ?? ""} ${
              filtered ? "text-primary" : active ? "text-ink" : ""
            }`}
          >
            {t(labelKey).toUpperCase()}
            {active ? (
              webSortDir === "asc" ? (
                <ChevronUp size={11} strokeWidth={2.5} />
              ) : (
                <ChevronDown size={11} strokeWidth={2.5} />
              )
            ) : (
              <ChevronsUpDown size={11} strokeWidth={2.5} className="opacity-70" />
            )}
          </button>
        );
      })}
    </div>
  );
}
