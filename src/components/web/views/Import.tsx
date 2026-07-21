"use client";

import { FileText, FileUp, Landmark, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";
import { ExportPanel } from "@/components/shared/ExportPanel";
import { PortTabs, type PortTab } from "@/components/shared/PortTabs";
import { type AmountMode, PRESET_PICKER, useImport } from "@/components/shared/useImport";
import { getPreset } from "@/lib/import/presets";
import { useFormatters } from "@/i18n/useFormatters";
import { useStore } from "@/state/store";
import { useTranslations } from "next-intl";

export function Import() {
  const set = useStore((s) => s.set);
  const t = useTranslations("importer");
  const fmt = useFormatters();
  const [tab, setTab] = useState<PortTab>("import");
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
    validation,
    rowCount,
    onFile,
    doImport,
    reset,
  } = useImport();

  return (
    <div className="mt-4 w-full">
      <PortTabs tab={tab} onChange={setTab} />
      {tab === "export" ? (
        <div className="mt-4">
          <ExportPanel />
        </div>
      ) : headers.length === 0 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
          <label className="flex cursor-pointer flex-col rounded-[24px] border border-edge bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[.05em] text-primary-dark">
                {t("csvImport")}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[.08em] text-subtle">
                {t("anyBank")}
              </span>
            </div>

            <div className="flex flex-col items-center pt-8 text-center">
              <span className="flex h-[68px] w-[68px] items-center justify-center rounded-[18px] bg-track text-muted">
                <FileUp size={30} strokeWidth={1.8} />
              </span>
              <div className="mt-5 text-[26px] font-bold tracking-[-.03em] text-ink">
                {t("dropTitle")}
              </div>
              <div className="mt-2 max-w-[34rem] text-[14px] font-medium leading-relaxed text-muted">
                {t("dropBody")}
              </div>
              <span className="mt-6 rounded-[12px] bg-primary px-5 py-3 text-[13px] font-semibold text-onprimary">
                {t("browse")}
              </span>
            </div>

            <div className="mt-8 grid gap-2 sm:grid-cols-3">
              <UploadHint title={t("hintMonarchTitle")} body={t("hintMonarchBody")} />
              <UploadHint title={t("hintPreviewTitle")} body={t("hintPreviewBody")} />
              <UploadHint title={t("hintDupTitle")} body={t("hintDupBody")} />
            </div>

            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>

          <div className="grid gap-4">
            <InfoPanel title={t("howItWorks")}>
              <StepRow step="1" title={t("step1Title")} body={t("step1Body")} />
              <StepRow step="2" title={t("step2Title")} body={t("step2Body")} />
              <StepRow step="3" title={t("step3Title")} body={t("step3Body")} />
            </InfoPanel>

            <InfoPanel title={t("smartImport")}>
              <CapabilityRow
                icon={<Landmark size={16} strokeWidth={2} />}
                title={t("capBankTitle")}
                body={t("capBankBody")}
              />
              <CapabilityRow
                icon={<Sparkles size={16} strokeWidth={2} />}
                title={t("capAiTitle")}
                body={t("capAiBody")}
              />
              <CapabilityRow
                icon={<SlidersHorizontal size={16} strokeWidth={2} />}
                title={t("capAmountsTitle")}
                body={t("capAmountsBody")}
              />
              <CapabilityRow
                icon={<ShieldCheck size={16} strokeWidth={2} />}
                title={t("capDupTitle")}
                body={t("capDupBody")}
              />
            </InfoPanel>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
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

            <div className="rounded-[18px] border border-edge bg-card p-[18px]">
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
                    {t("aiBodyWeb")}
                  </span>
                </span>
              </label>

              {error && (
                <div className="mt-3 text-[13px] font-medium text-primary-dark">{error}</div>
              )}

              <button
                type="button"
                onClick={doImport}
                disabled={busy || !mapping || preview.length === 0}
                className="mt-4 rounded-[12px] bg-primary px-5 py-3 text-[14px] font-semibold text-onprimary disabled:opacity-50"
              >
                {busy ? t("importing") : t("importCta")}
              </button>

              {result && (
                <div className="mt-4 rounded-[14px] bg-primary-soft p-4 text-[13px] font-medium text-green">
                  {[
                    t("resImported", { count: result.imported }),
                    t("resExcluded", { count: result.excluded }),
                    ...(result.aiCategorized > 0
                      ? [t("resAi", { count: result.aiCategorized })]
                      : []),
                    ...(result.reconciled > 0
                      ? [t("resReconciled", { count: result.reconciled })]
                      : []),
                    t("resUncategorized", { count: result.uncategorized }),
                  ].join(" · ")}{" "}
                  <button
                    type="button"
                    onClick={() => set({ webView: "transactions" })}
                    className="underline"
                  >
                    {t("viewTxnsWeb")}
                  </button>
                </div>
              )}
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
                    </div>
                    <span
                      className={`shrink-0 font-semibold tabular-nums ${r.amountCents >= 0 ? "text-green" : "text-ink"}`}
                    >
                      {fmt.money(r.amountCents, { signed: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <InfoPanel title={t("previewLabel")}>
              <div className="rounded-[14px] border border-edge bg-track/30 p-4">
                <div className="text-[13px] font-semibold text-ink">{t("previewEmptyTitle")}</div>
                <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-muted">
                  {t("previewEmptyBody")}
                </p>
              </div>
            </InfoPanel>
          )}
        </div>
      )}
    </div>
  );
}

function UploadHint({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[14px] border border-edge bg-track/30 p-3 text-left">
      <div className="text-[12.5px] font-semibold text-ink">{title}</div>
      <div className="mt-1 text-[11.5px] font-medium leading-relaxed text-muted">{body}</div>
    </div>
  );
}

function InfoPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[18px] border border-edge bg-card p-5">
      <div className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">{title}</div>
      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}

function StepRow({ step, title, body }: { step: string; title: string; body: string }) {
  return (
    <div className="flex gap-3">
      <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary-soft text-[11px] font-bold text-primary-dark">
        {step}
      </span>
      <div>
        <div className="text-[13px] font-semibold text-ink">{title}</div>
        <div className="mt-1 text-[12px] font-medium leading-relaxed text-muted">{body}</div>
      </div>
    </div>
  );
}

function CapabilityRow({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-3">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-[10px] bg-track text-primary">
        {icon}
      </span>
      <div>
        <div className="text-[13px] font-semibold text-ink">{title}</div>
        <div className="mt-1 text-[12px] font-medium leading-relaxed text-muted">{body}</div>
      </div>
    </div>
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
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">{optional ? t("selectNone") : t("selectPick")}</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </label>
  );
}
