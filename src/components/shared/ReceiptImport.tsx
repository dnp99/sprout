"use client";
import { useState } from "react";
import { ScanText, Trash2, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatBudgetInput, formatMoney, parseMoneyInput } from "@/lib/format";
import { calculatorInput } from "@/lib/calculator";
import type { AppLocale } from "@/lib/locale";
import type { ReceiptDraft } from "@/lib/import/receipt";

type Row = { description: string; amount: string };
/** Image extraction produces editable local data, then hands off to the existing
 * CSV preview/deduplication/confirmation path instead of writing transactions. */
export function ReceiptImport({
  onFile,
}: {
  onFile: (file: File | undefined) => void | Promise<void>;
}) {
  const t = useTranslations("receipt");
  const locale = useLocale() as AppLocale;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [merchant, setMerchant] = useState("");
  const [date, setDate] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [reviewed, setReviewed] = useState(false);
  const amounts = rows.map((row) => parseMoneyInput(row.amount, locale));
  const sum = amounts.reduce<number>((a, b) => a + (b ?? 0), 0);
  const valid =
    merchant.trim() &&
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    rows.length > 0 &&
    rows.every((r, i) => r.description.trim() && (amounts[i] ?? 0) > 0);
  function changeRows(next: Row[]) {
    setRows(next);
    setReviewed(false);
  }
  async function scan(file?: File) {
    if (!file) return;
    setError("");
    setRows([]);
    setReviewed(false);
    setBusy(true);
    try {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024
      )
        throw Error(t("fileError"));
      const body = new FormData();
      body.append("image", file);
      const response = await fetch("/api/import/receipt", { method: "POST", body });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || t("failed"));
      const draft = result.draft as ReceiptDraft;
      setMerchant(draft.merchant);
      setDate(draft.date);
      setTotal(draft.totalCents);
      setRows(
        draft.items.map((item) => ({
          description: item.description,
          amount: formatBudgetInput(item.amountCents, locale),
        })),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failed"));
    } finally {
      setBusy(false);
    }
  }
  async function preview() {
    if (!valid || !reviewed) return;
    const quote = (value: string) => '"' + value.replace(/"/g, '""') + '"';
    const csv = [
      "Date,Description,Amount,Source,Transaction Type,Category",
      ...rows.map((row, i) =>
        [
          date,
          quote(`${merchant.trim()} · ${row.description.trim()}`.slice(0, 120)),
          `-${calculatorInput(amounts[i]!)}`,
          "Receipt",
          "Expense",
          "",
        ].join(","),
      ),
    ].join("\n");
    await onFile(new File([csv], "receipt-reviewed.csv", { type: "text/csv" }));
    setOpen(false);
    setRows([]);
    setReviewed(false);
  }
  const inputClass =
    "min-h-11 min-w-0 rounded-[10px] border border-edge bg-bg px-3 text-sm text-ink outline-none focus:border-primary";
  return (
    <section className="my-4 rounded-[14px] border border-edge bg-card p-4 text-ink">
      <button
        type="button"
        aria-expanded={open}
        className="flex min-h-11 items-center gap-2 font-semibold"
        onClick={() => setOpen(!open)}
      >
        <ScanText size={17} strokeWidth={2} />
        {t("title")}
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          <p className="text-sm text-muted">{t("hint")}</p>
          <label className="block text-sm font-medium">
            {t("image")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              onChange={(e) => {
                void scan(e.target.files?.[0]);
                e.target.value = "";
              }}
              className="mt-2 block w-full text-sm"
            />
          </label>
          {busy && <p role="status">{t("scanning")}</p>}
          {error && (
            <p role="alert" className="text-sm text-muted">
              {error}
            </p>
          )}
          {rows.length === 0 && !busy && (
            <button
              type="button"
              className="min-h-11 text-sm font-semibold"
              onClick={() => {
                setMerchant("");
                setDate("");
                setTotal(null);
                changeRows([{ description: "", amount: "" }]);
              }}
            >
              {t("manual")}
            </button>
          )}
          {rows.length > 0 && (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="grid gap-1 text-sm">
                  {t("merchant")}
                  <input
                    className={inputClass}
                    value={merchant}
                    maxLength={60}
                    onChange={(e) => {
                      setMerchant(e.target.value);
                      setReviewed(false);
                    }}
                  />
                </label>
                <label className="grid gap-1 text-sm">
                  {t("date")}
                  <input
                    type="date"
                    className={inputClass}
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setReviewed(false);
                    }}
                  />
                </label>
              </div>
              <p className="text-sm text-muted">{t("currency")}</p>
              <div className="max-h-80 space-y-2 overflow-y-auto">
                {rows.map((row, i) => (
                  <div key={i} className="grid grid-cols-[minmax(0,1fr)_100px_44px] gap-2">
                    <input
                      aria-label={t("item", { number: i + 1 })}
                      maxLength={55}
                      value={row.description}
                      className={inputClass}
                      onChange={(e) =>
                        changeRows(
                          rows.map((r, n) => (n === i ? { ...r, description: e.target.value } : r)),
                        )
                      }
                    />
                    <input
                      aria-label={t("amount", { number: i + 1 })}
                      inputMode="decimal"
                      value={row.amount}
                      className={inputClass}
                      onChange={(e) =>
                        changeRows(
                          rows.map((r, n) => (n === i ? { ...r, amount: e.target.value } : r)),
                        )
                      }
                    />
                    <button
                      type="button"
                      aria-label={t("remove", { number: i + 1 })}
                      className="flex min-h-11 items-center justify-center"
                      onClick={() => changeRows(rows.filter((_, n) => n !== i))}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="flex min-h-11 items-center gap-2 text-sm font-semibold"
                onClick={() => changeRows([...rows, { description: "", amount: "" }])}
              >
                <Plus size={16} />
                {t("add")}
              </button>
              <p className="text-sm font-semibold">
                {t("sum")} {formatMoney(sum)}
                {total !== null && (
                  <>
                    {" "}
                    · {t("total")} {formatMoney(total)}
                  </>
                )}
              </p>
              {total !== null && sum !== total && (
                <p role="status" className="text-sm text-muted">
                  {t("mismatch")}
                </p>
              )}
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                />
                {t("reviewed")}
              </label>
              <button
                type="button"
                disabled={!valid || !reviewed}
                onClick={() => void preview()}
                className="min-h-11 rounded-[10px] bg-primary px-4 font-semibold text-onprimary disabled:opacity-40"
              >
                {t("preview")}
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
