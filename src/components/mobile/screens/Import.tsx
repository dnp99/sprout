"use client";

import {
  CheckCircle2,
  Download,
  FileText,
  FileUp,
  ShieldCheck,
  Sparkles,
  Tags,
} from "lucide-react";
import { useState } from "react";
import { ExportPanel } from "@/components/shared/ExportPanel";
import { ImportAllRowsDialog } from "@/components/shared/ImportAllRowsDialog";
import { PortTabs, type PortTab } from "@/components/shared/PortTabs";
import { type AmountMode, PRESET_PICKER, useImport } from "@/components/shared/useImport";
import { getPreset } from "@/lib/import/presets";
import { SPROUT_TEMPLATE_CSV, SPROUT_TEMPLATE_FILENAME } from "@/lib/import/template";
import { downloadTextFile } from "@/lib/download";
import { ScreenHeader } from "@/components/ui/headers";
import { useFormatters } from "@/i18n/useFormatters";
import { useStore } from "@/state/store";
import { useTranslations } from "next-intl";

/** Mobile Import / Export: CSV export + import wizard (upload → map → done).
 *  Shares all import logic with the web screen via useImport. */
export function Import() {
  const goMobile = useStore((s) => s.goMobile);
  const t = useTranslations("importer");
  const fmt = useFormatters();
  const [tab, setTab] = useState<PortTab>("import");
  const [allRowsOpen, setAllRowsOpen] = useState(false);
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
  } = useImport();

  return (
    <div className="px-[22px] pb-4 pt-3">
      <ScreenHeader title={t("title")} onBack={() => goMobile("settings")} />

      <div className="mt-3 flex justify-center">
        <PortTabs tab={tab} onChange={setTab} />
      </div>

      {tab === "export" ? (
        <div className="mt-4">
          <ExportPanel />
        </div>
      ) : result ? (
        <div className="mt-4 rounded-[22px] border border-soft-border bg-primary-soft p-5 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-card text-primary">
            <CheckCircle2 size={28} strokeWidth={2.2} />
          </span>
          <div className="mt-3.5 text-[20px] font-bold tracking-[-.02em] text-ink">
            {t("importComplete")}
          </div>
          <div className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-muted">
            {[
              t("resAddedM", { count: result.imported }),
              t("resExcluded", { count: result.excluded }),
              ...(result.aiCategorized > 0 ? [t("resAi", { count: result.aiCategorized })] : []),
              ...(result.reconciled > 0 ? [t("resReconciledM", { count: result.reconciled })] : []),
              t("resUncatM", { count: result.uncategorized }),
            ].join(" · ")}
          </div>
          <button
            type="button"
            onClick={() => goMobile("history")}
            className="mt-5 w-full rounded-[14px] bg-primary py-3 text-[14px] font-semibold text-onprimary"
          >
            {t("viewTransactions")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="mt-1 flex min-h-11 w-full items-center justify-center text-[13px] font-semibold text-primary-dark"
          >
            {t("importAnother")}
          </button>
        </div>
      ) : !fileName ? (
        <>
          <label className="mt-4 flex cursor-pointer flex-col rounded-[22px] border border-edge bg-card p-5 text-center">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-primary-soft px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[.05em] text-primary-dark">
                {t("csvImport")}
              </span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[.08em] text-subtle">
                {t("bankOrMonarch")}
              </span>
            </div>

            <div className="mt-8 flex flex-col items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-track text-muted">
                <FileUp size={28} strokeWidth={1.8} />
              </span>
              <div className="mt-4 text-[22px] font-bold tracking-[-.03em] text-ink">
                {t("uploadTitleMobile")}
              </div>
              <div className="mt-2 text-[13px] font-medium leading-relaxed text-muted">
                {t("uploadBodyMobile")}
              </div>
              <span className="mt-5 rounded-[14px] bg-primary px-5 py-3 text-[13px] font-semibold text-onprimary">
                {t("chooseFile")}
              </span>
            </div>

            <div className="mt-5 space-y-2 text-left">
              <SupportRow title={t("supPreviewTitle")} body={t("supPreviewBody")} />
              <SupportRow title={t("supAnyTitle")} body={t("supAnyBody")} />
              <SupportRow title={t("supDupTitle")} body={t("supDupBody")} />
            </div>

            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>

          <button
            type="button"
            onClick={() => downloadTextFile(SPROUT_TEMPLATE_FILENAME, SPROUT_TEMPLATE_CSV)}
            className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-[12px] border border-edge bg-card px-4 text-[13px] font-semibold text-primary"
          >
            <Download size={16} strokeWidth={2} /> {t("downloadTemplate")}
          </button>

          <div className="mt-3 rounded-[16px] border border-edge bg-track/30 p-4">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
              <Sparkles size={15} strokeWidth={2} className="text-primary" />
              {t("smartImport")}
            </div>
            <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
              {t("smartBodyMobile")}
            </p>
          </div>

          <div className="mt-3 rounded-[16px] border border-soft-border bg-primary-soft p-4">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-primary-dark">
              <Tags size={15} strokeWidth={2} />
              {t("rulesTitle")}
            </div>
            <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-primary-dark">
              {t("rulesBody")}
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="mt-4 flex items-center gap-3 rounded-[18px] border border-edge bg-card px-4 py-3.5">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-[12px] bg-track text-muted">
              <FileText size={19} strokeWidth={2} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[14px] font-semibold text-ink">{fileName}</div>
              <div className="mt-0.5 text-[11.5px] font-medium text-muted">
                {t("rowsDetected", { count: rowCount })}
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="-mr-2 flex min-h-11 flex-none items-center px-2 text-[12px] font-semibold text-muted"
            >
              {t("remove")}
            </button>
          </div>

          <SectionCard title={t("mapping")} subtitle={t("mappingSubtitleMobile")} className="mt-4">
            <div className="flex flex-wrap gap-2">
              {PRESET_PICKER.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={`rounded-full px-4 py-2 text-[12.5px] font-semibold ${
                    preset === p ? "bg-primary text-onprimary" : "bg-track text-muted"
                  }`}
                >
                  {p === "custom" ? t("presetCustom") : (getPreset(p)?.label ?? p)}
                </button>
              ))}
            </div>

            {detection?.confidence === "high" && (
              <div className="mt-2 text-[12px] font-semibold text-primary">
                {t("detected", {
                  source: getPreset(detection.presetId)?.label ?? detection.presetId,
                })}
              </div>
            )}
            {validation && validation.totalRows > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium">
                <span className="text-ink">
                  {t("validReady", { valid: validation.validRows, total: validation.totalRows })}
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

            {preset === "custom" && (
              <div className="mt-4 flex flex-col gap-3">
                <Field label={t("colDate")}>
                  <Select
                    headers={headers}
                    value={custom.date}
                    onChange={(v) => setCustom({ ...custom, date: v })}
                  />
                </Field>
                <Field label={t("colMerchant")}>
                  <Select
                    headers={headers}
                    value={custom.merchant}
                    onChange={(v) => setCustom({ ...custom, merchant: v })}
                  />
                </Field>
                <Field label={t("amountFormat")}>
                  <select
                    value={custom.amountMode}
                    onChange={(e) =>
                      setCustom({ ...custom, amountMode: e.target.value as AmountMode })
                    }
                    className={selectClass}
                  >
                    <option value="signed">{t("modeSigned")}</option>
                    <option value="debitCredit">{t("modeDebitCredit")}</option>
                    <option value="inflowOutflow">{t("modeInflowOutflow")}</option>
                  </select>
                </Field>
                {custom.amountMode === "signed" && (
                  <Field label={t("colAmount")}>
                    <Select
                      headers={headers}
                      value={custom.amountColumn}
                      onChange={(v) => setCustom({ ...custom, amountColumn: v })}
                    />
                  </Field>
                )}
                {custom.amountMode === "debitCredit" && (
                  <>
                    <Field label={t("colDebit")}>
                      <Select
                        headers={headers}
                        value={custom.debitColumn}
                        onChange={(v) => setCustom({ ...custom, debitColumn: v })}
                      />
                    </Field>
                    <Field label={t("colCredit")}>
                      <Select
                        headers={headers}
                        value={custom.creditColumn}
                        onChange={(v) => setCustom({ ...custom, creditColumn: v })}
                      />
                    </Field>
                  </>
                )}
                {custom.amountMode === "inflowOutflow" && (
                  <>
                    <Field label={t("colInflow")}>
                      <Select
                        headers={headers}
                        value={custom.inflowColumn}
                        onChange={(v) => setCustom({ ...custom, inflowColumn: v })}
                      />
                    </Field>
                    <Field label={t("colOutflow")}>
                      <Select
                        headers={headers}
                        value={custom.outflowColumn}
                        onChange={(v) => setCustom({ ...custom, outflowColumn: v })}
                      />
                    </Field>
                  </>
                )}
                <Field label={t("colCategory")}>
                  <Select
                    headers={headers}
                    value={custom.category}
                    onChange={(v) => setCustom({ ...custom, category: v })}
                    optional
                  />
                </Field>
                <Field label={t("colIncomeSource")}>
                  <Select
                    headers={headers}
                    value={custom.incomeSource}
                    onChange={(v) => setCustom({ ...custom, incomeSource: v })}
                    optional
                  />
                </Field>
              </div>
            )}
          </SectionCard>

          {preview.length > 0 ? (
            <SectionCard
              title={t("previewLabel")}
              subtitle={t("previewSubtitleMobile", { count: preview.length })}
              className="mt-4"
            >
              <div className="overflow-hidden rounded-[16px] border border-edge bg-card">
                {preview.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border-b border-edge px-4 py-3 text-[12.5px] last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-ink">{r.merchant || "—"}</div>
                      <div className="mt-0.5 text-[11.5px] font-medium text-muted">
                        {r.occurredAt}
                      </div>
                      {r.sourceCategory && (
                        <div className="mt-0.5 truncate text-[11px] font-medium text-primary-dark">
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
                className="mt-3 w-full rounded-[10px] border border-primary px-3 py-2.5 text-[12.5px] font-semibold text-primary"
              >
                {t("previewAllCta", { count: mappedRows.length })}
              </button>
            </SectionCard>
          ) : null}

          <div className="mt-4 rounded-[16px] border border-edge bg-track/30 p-4">
            <label className="flex cursor-pointer items-start gap-3 text-[13px] font-medium text-ink">
              <input
                type="checkbox"
                checked={aiCategorize}
                onChange={(e) => setAiCategorize(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                {t("aiTitle")}
                <span className="mt-1 block text-[11.5px] leading-relaxed text-muted">
                  {t("aiBodyMobile")}
                </span>
              </span>
            </label>
          </div>

          <div className="mt-4 rounded-[16px] border border-edge bg-card p-4">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
              <ShieldCheck size={15} strokeWidth={2} className="text-primary" />
              {t("behaviorTitle")}
            </div>
            <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
              {t("behaviorBody")}
            </p>
          </div>

          {error && <div className="mt-3 text-[13px] font-semibold text-primary-dark">{error}</div>}

          <button
            type="button"
            onClick={doImport}
            disabled={busy || !mapping || preview.length === 0}
            className="mt-4 w-full rounded-[16px] bg-primary py-3.5 text-[15px] font-semibold text-onprimary disabled:opacity-50"
          >
            {busy ? t("importing") : t("importN", { count: rowCount })}
          </button>
          <button
            type="button"
            onClick={reset}
            className="mt-1 flex min-h-11 w-full items-center justify-center text-[13px] font-semibold text-muted"
          >
            {t("cancel")}
          </button>
        </>
      )}
      {allRowsOpen && (
        <ImportAllRowsDialog rows={mappedRows} onClose={() => setAllRowsOpen(false)} />
      )}
    </div>
  );
}

function SectionCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-[20px] border border-edge bg-card p-4 ${className ?? ""}`.trim()}>
      <div className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">{title}</div>
      {subtitle ? (
        <div className="mt-1 text-[12.5px] font-medium leading-relaxed text-muted">{subtitle}</div>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function SupportRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[14px] border border-edge bg-track/30 p-3">
      <div className="text-[12.5px] font-semibold text-ink">{title}</div>
      <div className="mt-1 text-[11.5px] font-medium leading-relaxed text-muted">{body}</div>
    </div>
  );
}

const selectClass =
  "w-full rounded-[12px] border border-edge bg-card px-3 py-2.5 text-[13px] font-medium text-ink outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Select({
  headers,
  value,
  onChange,
  optional,
}: {
  headers: string[];
  value: string;
  onChange: (v: string) => void;
  optional?: boolean;
}) {
  const t = useTranslations("importer");
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      <option value="">{optional ? t("selectNone") : t("selectPick")}</option>
      {headers.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  );
}
