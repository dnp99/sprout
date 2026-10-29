"use client";

import { Select as ThemedSelect } from "@/components/ui/Select";

import { FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { ReceiptImport } from "@/components/shared/ReceiptImport";
import { DesktopImportComplete } from "@/components/shared/ImportComplete";
import type { ImportTarget } from "@/components/shared/useImport";
import type { ExportSource } from "@/components/shared/ExportPanel";
import { ExportPanel } from "@/components/shared/ExportPanel";
import { ImportAllRowsDialog } from "@/components/shared/ImportAllRowsDialog";
import { ImportConfirmDialog } from "@/components/shared/ImportConfirmDialog";
import { PortTabs, type PortTab } from "@/components/shared/PortTabs";
import { type AmountMode, PRESET_PICKER, useImport } from "@/components/shared/useImport";
import { DesktopImportLanding, ImportInfoPanel } from "@/components/web/DesktopImportLanding";
import { getPreset } from "@/lib/import/presets";
import { useFormatters } from "@/i18n/useFormatters";
import { useStore } from "@/state/store";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/ui/Toast";

export function Import({
  target,
  exportSource,
  controls,
  confirmation,
  onViewTransactions,
  onBusyChange,
}: {
  target?: ImportTarget;
  exportSource?: ExportSource;
  controls?: React.ReactNode;
  confirmation?: React.ReactNode;
  onViewTransactions?: () => void;
  onBusyChange?: (busy: boolean) => void;
} = {}) {
  const set = useStore((s) => s.set);
  const { showToast } = useToast();
  const t = useTranslations("importer");
  const fmt = useFormatters();
  const [tab, setTab] = useState<PortTab>("import");
  const [allRowsOpen, setAllRowsOpen] = useState(false);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const {
    fileName,
    headers,
    preset,
    setPreset,
    detection,
    custom,
    setCustom,
    aiCategorize,
    setAiCategorize,
    result,
    busy,
    error,
    mapping,
    preview,
    mappedRows,
    validation,
    rowCount,
    onFile,
    doImport,
    reset,
  } = useImport(target);
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  const viewTransactions = onViewTransactions ?? (() => set({ webView: "transactions" }));

  async function confirmImport() {
    if (await doImport()) {
      setImportConfirmOpen(false);
      showToast(
        t("importComplete"),
        "success",
        { label: t("viewTxnsWeb"), onClick: viewTransactions },
        8000,
      );
    }
  }

  return (
    <fieldset disabled={busy} className="mt-4 min-w-0 w-full border-0 p-0">
      <PortTabs tab={tab} onChange={setTab} />
      {tab === "import" && controls}
      {tab === "import" && error && headers.length === 0 && (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      )}
      {tab === "import" && !target?.disabled && <ReceiptImport onFile={onFile} />}

      {tab === "export" ? (
        <div className="mt-4">
          <ExportPanel source={exportSource} />
        </div>
      ) : headers.length === 0 ? (
        <fieldset disabled={target?.disabled}>
          <DesktopImportLanding onFile={onFile} />
        </fieldset>
      ) : result ? (
        <DesktopImportComplete
          group={target?.group}
          result={result}
          onViewTransactions={viewTransactions}
          onImportAnother={reset}
        />
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-[18px] border border-edge bg-card p-4">
              <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-track text-muted">
                <FileText size={20} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-semibold text-ink">{fileName}</div>
                <div className="mt-0.5 text-[12px] font-medium text-muted">
                  {t("rowsDetected", { count: rowCount })}
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="rounded-[10px] border border-edge px-3 py-2 text-[12px] font-semibold text-muted transition hover:border-soft-border hover:text-ink"
              >
                {t("remove")}
              </button>
            </div>

            <div
              data-cozy-surface="peach"
              className="rounded-[18px] border border-edge bg-card p-[18px]"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">
                    {t("mapping")}
                  </div>
                  <div className="mt-1 text-[18px] font-bold tracking-[-.02em] text-ink">
                    {t("mappingTitle")}
                  </div>
                </div>
                <div className="text-[12px] font-medium text-muted">
                  {detection?.confidence === "high"
                    ? t("detected", {
                        source: getPreset(detection.presetId)?.label ?? detection.presetId,
                      })
                    : preview.length > 0
                      ? t("rowsInPreview", { count: preview.length })
                      : t("previewAuto")}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {PRESET_PICKER.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={`rounded-[10px] px-4 py-2 text-[12.5px] font-semibold ${
                      preset === p ? "bg-primary text-onprimary" : "bg-track text-muted"
                    }`}
                  >
                    {p === "custom" ? t("presetCustom") : (getPreset(p)?.label ?? p)}
                  </button>
                ))}
              </div>

              {/* Preflight summary — what will import, what won't, before any write. */}
              {validation && validation.totalRows > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] font-medium">
                  <span className="text-ink">
                    {t("validReady", {
                      valid: validation.validRows,
                      total: validation.totalRows,
                    })}
                  </span>
                  {validation.validRows < validation.totalRows && (
                    <span className="text-primary-dark">
                      {t("willSkip", { count: validation.totalRows - validation.validRows })}
                    </span>
                  )}
                  {validation.unmatchedCategories > 0 && (
                    <span className="text-muted">
                      {t("toCategorize", { count: validation.unmatchedCategories })}
                    </span>
                  )}
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mt-3 rounded-[10px] border border-primary/30 bg-primary-soft px-3 py-2 text-[13px] font-semibold text-primary-dark"
                >
                  {error}
                </div>
              )}

              {target?.group && validation && validation.invalidRows.length > 0 && (
                <details className="mt-3 text-xs text-muted">
                  <summary className="min-h-11 cursor-pointer py-3">
                    {t("willSkip", { count: validation.totalRows - validation.validRows })}
                  </summary>
                  <ul className="space-y-1">
                    {validation.invalidRows.map((row) => (
                      <li key={row.row}>
                        {row.row}: {row.reason}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              {preset === "custom" && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Select
                    label={t("colDate")}
                    headers={headers}
                    value={custom.date}
                    onChange={(v) => setCustom({ ...custom, date: v })}
                  />
                  <Select
                    label={t("colMerchant")}
                    headers={headers}
                    value={custom.merchant}
                    onChange={(v) => setCustom({ ...custom, merchant: v })}
                  />
                  <div className="col-span-2 flex gap-3">
                    <label className="flex-1">
                      <FieldLabel>{t("amountFormat")}</FieldLabel>
                      <ThemedSelect
                        value={custom.amountMode}
                        onChange={(e) =>
                          setCustom({ ...custom, amountMode: e.target.value as AmountMode })
                        }
                        className={selectClass}
                      >
                        <option value="signed">{t("modeSigned")}</option>
                        <option value="debitCredit">{t("modeDebitCredit")}</option>
                        <option value="inflowOutflow">{t("modeInflowOutflow")}</option>
                      </ThemedSelect>
                    </label>
                  </div>
                  {custom.amountMode === "signed" && (
                    <Select
                      label={t("colAmount")}
                      headers={headers}
                      value={custom.amountColumn}
                      onChange={(v) => setCustom({ ...custom, amountColumn: v })}
                    />
                  )}
                  {custom.amountMode === "debitCredit" && (
                    <>
                      <Select
                        label={t("colDebit")}
                        headers={headers}
                        value={custom.debitColumn}
                        onChange={(v) => setCustom({ ...custom, debitColumn: v })}
                      />
                      <Select
                        label={t("colCredit")}
                        headers={headers}
                        value={custom.creditColumn}
                        onChange={(v) => setCustom({ ...custom, creditColumn: v })}
                      />
                    </>
                  )}
                  {custom.amountMode === "inflowOutflow" && (
                    <>
                      <Select
                        label={t("colInflow")}
                        headers={headers}
                        value={custom.inflowColumn}
                        onChange={(v) => setCustom({ ...custom, inflowColumn: v })}
                      />
                      <Select
                        label={t("colOutflow")}
                        headers={headers}
                        value={custom.outflowColumn}
                        onChange={(v) => setCustom({ ...custom, outflowColumn: v })}
                      />
                    </>
                  )}
                  <Select
                    label={t("colCategory")}
                    headers={headers}
                    value={custom.category}
                    onChange={(v) => setCustom({ ...custom, category: v })}
                    optional
                  />
                  <Select
                    label={t("colTransactionType")}
                    headers={headers}
                    value={custom.transactionType}
                    onChange={(v) => setCustom({ ...custom, transactionType: v })}
                    optional
                  />
                  {!target?.group && (
                    <Select
                      label={t("colIncomeSource")}
                      headers={headers}
                      value={custom.incomeSource}
                      onChange={(v) => setCustom({ ...custom, incomeSource: v })}
                      optional
                    />
                  )}
                </div>
              )}

              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-[14px] border border-edge bg-track/30 px-4 py-3 text-[13px] font-medium text-ink">
                <input
                  type="checkbox"
                  checked={aiCategorize}
                  onChange={(e) => setAiCategorize(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-primary"
                />
                <span>
                  {t("aiTitle")}
                  <span className="block text-[12px] leading-relaxed text-muted">
                    {target?.aiDescription ?? t("aiBodyWeb")}
                  </span>
                </span>
              </label>

              <button
                type="button"
                onClick={() => setImportConfirmOpen(true)}
                disabled={
                  busy ||
                  target?.disabled ||
                  !mapping ||
                  preview.length === 0 ||
                  (target?.group && !validation?.validRows)
                }
                className="mt-4 rounded-[12px] bg-primary px-5 py-3 text-[14px] font-semibold text-onprimary disabled:opacity-50"
              >
                {busy ? t("importing") : t("importCta")}
              </button>
            </div>
          </div>

          {preview.length > 0 ? (
            <div className="rounded-[18px] border border-edge bg-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">
                    {t("previewLabel")}
                  </div>
                  <div className="mt-1 text-[17px] font-bold tracking-[-.02em] text-ink">
                    {t("previewTitle")}
                  </div>
                </div>
                <div className="text-[12px] font-medium text-muted">
                  {t("previewShown", { count: preview.length })}
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[16px] border border-edge bg-card">
                {preview.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 border-b border-edge px-4 py-3 text-[13px] last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-ink">{r.merchant || "—"}</div>
                      <div className="mt-0.5 text-[12px] font-medium text-muted">
                        {r.occurredAt}
                      </div>
                      {r.sourceCategory && (
                        <div className="mt-0.5 truncate text-[11.5px] font-medium text-primary-dark">
                          {r.sourceCategory}
                        </div>
                      )}
                    </div>
                    <span
                      className={`shrink-0 font-semibold tabular-nums ${r.amountCents >= 0 ? "text-green" : "text-ink"}`}
                    >
                      {fmt.money(r.amountCents, { signed: true })}
                    </span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setAllRowsOpen(true)}
                className="mt-4 w-full rounded-[10px] border border-primary px-3 py-2 text-[12.5px] font-semibold text-primary transition hover:bg-primary-soft"
              >
                {t("previewAllCta", { count: mappedRows.length })}
              </button>
            </div>
          ) : (
            <ImportInfoPanel title={t("previewLabel")}>
              <div className="rounded-[14px] border border-edge bg-track/30 p-4">
                <div className="text-[13px] font-semibold text-ink">{t("previewEmptyTitle")}</div>
                <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-muted">
                  {t("previewEmptyBody")}
                </p>
              </div>
            </ImportInfoPanel>
          )}
        </div>
      )}
      {allRowsOpen && (
        <ImportAllRowsDialog rows={mappedRows} onClose={() => setAllRowsOpen(false)} />
      )}
      {importConfirmOpen && (
        <ImportConfirmDialog
          rowCount={target?.group ? (validation?.validRows ?? 0) : mappedRows.length}
          details={confirmation}
          busy={busy}
          onCancel={() => setImportConfirmOpen(false)}
          onReview={() => setAllRowsOpen(true)}
          onConfirm={() => void confirmImport()}
        />
      )}
    </fieldset>
  );
}

const selectClass =
  "mt-1 w-full rounded-[10px] border border-edge bg-card px-3 py-2 text-[13px] font-medium text-ink outline-none";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{children}</span>
  );
}

function Select({
  label,
  headers,
  value,
  onChange,
  optional,
}: {
  label: string;
  headers: string[];
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  const t = useTranslations("importer");
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <ThemedSelect
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={selectClass}
      >
        <option value="">{optional ? t("selectNone") : t("selectPick")}</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </ThemedSelect>
    </label>
  );
}
