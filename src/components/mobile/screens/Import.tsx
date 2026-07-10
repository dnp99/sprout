"use client";

import { CheckCircle2, FileText, FileUp, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { ExportPanel } from "@/components/shared/ExportPanel";
import { PortTabs, type PortTab } from "@/components/shared/PortTabs";
import { type AmountMode, useImport } from "@/components/shared/useImport";
import { ScreenHeader } from "@/components/ui/headers";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/state/store";

/** Mobile Import / Export: CSV export + import wizard (upload → map → done).
 *  Shares all import logic with the web screen via useImport. */
export function Import() {
  const goMobile = useStore((s) => s.goMobile);
  const [tab, setTab] = useState<PortTab>("import");
  const {
    fileName,
    headers,
    preset,
    setPreset,
    custom,
    setCustom,
    aiCategorize,
    setAiCategorize,
    result,
    busy,
    error,
    mapping,
    preview,
    rowCount,
    onFile,
    doImport,
    reset,
  } = useImport();

  return (
    <div className="px-[22px] pb-4 pt-3">
      <ScreenHeader title="Import / export" onBack={() => goMobile("settings")} />

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
            Import complete
          </div>
          <div className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-muted">
            {result.imported} transactions added · {result.excluded} internal moves excluded
            {result.aiCategorized > 0 ? ` · ${result.aiCategorized} AI-categorized` : ""}
            {result.reconciled > 0 ? ` · ${result.reconciled} already captured` : ""} ·{" "}
            {result.uncategorized} uncategorized
          </div>
          <button
            type="button"
            onClick={() => goMobile("history")}
            className="mt-5 w-full rounded-[14px] bg-primary py-3 text-[14px] font-semibold text-onprimary"
          >
            View transactions
          </button>
          <button
            type="button"
            onClick={reset}
            className="mt-1 flex min-h-11 w-full items-center justify-center text-[13px] font-semibold text-primary-dark"
          >
            Import another
          </button>
        </div>
      ) : !fileName ? (
        <>
          <label className="mt-4 flex cursor-pointer flex-col rounded-[22px] border border-edge bg-card p-5 text-center">
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-primary-soft px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[.05em] text-primary-dark">
                CSV import
              </span>
              <span className="text-[10.5px] font-semibold uppercase tracking-[.08em] text-subtle">
                Bank or Monarch
              </span>
            </div>

            <div className="mt-8 flex flex-col items-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-track text-muted">
                <FileUp size={28} strokeWidth={1.8} />
              </span>
              <div className="mt-4 text-[22px] font-bold tracking-[-.03em] text-ink">
                Upload a CSV and review it first
              </div>
              <div className="mt-2 text-[13px] font-medium leading-relaxed text-muted">
                Sprout detects Monarch exports automatically and helps you map any other bank
                statement.
              </div>
              <span className="mt-5 rounded-[14px] bg-primary px-5 py-3 text-[13px] font-semibold text-onprimary">
                Choose file
              </span>
            </div>

            <div className="mt-5 space-y-2 text-left">
              <SupportRow
                title="Preview before import"
                body="Check a few rows first so dates, merchants, and amounts look right."
              />
              <SupportRow
                title="Import any CSV"
                body="Use the Monarch preset or manually map your bank’s columns."
              />
              <SupportRow
                title="Duplicate-safe"
                body="Already-imported rows are skipped when you re-import a statement."
              />
            </div>

            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>

          <div className="mt-3 rounded-[16px] border border-edge bg-track/30 p-4">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
              <Sparkles size={15} strokeWidth={2} className="text-primary" />
              Smart import
            </div>
            <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
              AI categorization, flexible amount columns, and duplicate protection are all built in.
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
                {rowCount} rows detected
              </div>
            </div>
            <button
              type="button"
              onClick={reset}
              className="-mr-2 flex min-h-11 flex-none items-center px-2 text-[12px] font-semibold text-muted"
            >
              Remove
            </button>
          </div>

          <SectionCard
            title="Mapping"
            subtitle="Confirm how this statement should import."
            className="mt-4"
          >
            <div className="flex flex-wrap gap-2">
              {(["monarch", "custom"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPreset(p)}
                  className={`rounded-full px-4 py-2 text-[12.5px] font-semibold ${
                    preset === p ? "bg-primary text-onprimary" : "bg-track text-muted"
                  }`}
                >
                  {p === "monarch" ? "Monarch preset" : "Custom mapping"}
                </button>
              ))}
            </div>

            {preset === "custom" && (
              <div className="mt-4 flex flex-col gap-3">
                <Field label="Date column">
                  <Select
                    headers={headers}
                    value={custom.date}
                    onChange={(v) => setCustom({ ...custom, date: v })}
                  />
                </Field>
                <Field label="Merchant column">
                  <Select
                    headers={headers}
                    value={custom.merchant}
                    onChange={(v) => setCustom({ ...custom, merchant: v })}
                  />
                </Field>
                <Field label="Amount format">
                  <select
                    value={custom.amountMode}
                    onChange={(e) =>
                      setCustom({ ...custom, amountMode: e.target.value as AmountMode })
                    }
                    className={selectClass}
                  >
                    <option value="signed">Single signed column</option>
                    <option value="debitCredit">Debit + Credit columns</option>
                    <option value="inflowOutflow">Inflow + Outflow columns</option>
                  </select>
                </Field>
                {custom.amountMode === "signed" && (
                  <Field label="Amount column">
                    <Select
                      headers={headers}
                      value={custom.amountColumn}
                      onChange={(v) => setCustom({ ...custom, amountColumn: v })}
                    />
                  </Field>
                )}
                {custom.amountMode === "debitCredit" && (
                  <>
                    <Field label="Debit column">
                      <Select
                        headers={headers}
                        value={custom.debitColumn}
                        onChange={(v) => setCustom({ ...custom, debitColumn: v })}
                      />
                    </Field>
                    <Field label="Credit column">
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
                    <Field label="Inflow column">
                      <Select
                        headers={headers}
                        value={custom.inflowColumn}
                        onChange={(v) => setCustom({ ...custom, inflowColumn: v })}
                      />
                    </Field>
                    <Field label="Outflow column">
                      <Select
                        headers={headers}
                        value={custom.outflowColumn}
                        onChange={(v) => setCustom({ ...custom, outflowColumn: v })}
                      />
                    </Field>
                  </>
                )}
                <Field label="Category column (optional)">
                  <Select
                    headers={headers}
                    value={custom.category}
                    onChange={(v) => setCustom({ ...custom, category: v })}
                    optional
                  />
                </Field>
              </div>
            )}
          </SectionCard>

          {preview.length > 0 ? (
            <SectionCard
              title="Preview"
              subtitle={`${preview.length} rows shown before import.`}
              className="mt-4"
            >
              <div className="overflow-hidden rounded-[16px] border border-edge">
                {preview.slice(0, 4).map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border-b border-edge px-4 py-3 text-[12.5px] last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold text-ink">{r.merchant || "—"}</div>
                      <div className="mt-0.5 text-[11.5px] font-medium text-muted">
                        {r.occurredAt}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 font-semibold tabular-nums ${r.amountCents >= 0 ? "text-green" : "text-ink"}`}
                    >
                      {formatMoney(r.amountCents, { signed: true })}
                    </span>
                  </div>
                ))}
              </div>
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
                Auto-categorize leftover merchants with AI
                <span className="mt-1 block text-[11.5px] leading-relaxed text-muted">
                  Claude is cached per merchant, so cleanup usually gets easier after the first
                  import.
                </span>
              </span>
            </label>
          </div>

          <div className="mt-4 rounded-[16px] border border-edge bg-card p-4">
            <div className="flex items-center gap-2 text-[12.5px] font-semibold text-ink">
              <ShieldCheck size={15} strokeWidth={2} className="text-primary" />
              Import behavior
            </div>
            <p className="mt-1.5 text-[12px] font-medium leading-relaxed text-muted">
              Sprout skips duplicates, excludes internal moves, and keeps uncategorized rows visible
              so you can clean them up later.
            </p>
          </div>

          {error && <div className="mt-3 text-[13px] font-semibold text-primary-dark">{error}</div>}

          <button
            type="button"
            onClick={doImport}
            disabled={busy || !mapping || preview.length === 0}
            className="mt-4 w-full rounded-[16px] bg-primary py-3.5 text-[15px] font-semibold text-onprimary disabled:opacity-50"
          >
            {busy ? "Importing…" : `Import ${rowCount} transactions`}
          </button>
          <button
            type="button"
            onClick={reset}
            className="mt-1 flex min-h-11 w-full items-center justify-center text-[13px] font-semibold text-muted"
          >
            Cancel
          </button>
        </>
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
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
      <option value="">{optional ? "— none —" : "— select —"}</option>
      {headers.map((h) => (
        <option key={h} value={h}>
          {h}
        </option>
      ))}
    </select>
  );
}
