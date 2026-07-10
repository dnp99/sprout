"use client";

import { FileText, FileUp, Landmark, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";
import { ExportPanel } from "@/components/shared/ExportPanel";
import { PortTabs, type PortTab } from "@/components/shared/PortTabs";
import { type AmountMode, type Preset, useImport } from "@/components/shared/useImport";
import { formatMoney } from "@/lib/format";
import { useStore } from "@/state/store";

export function Import() {
  const set = useStore((s) => s.set);
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
    <div className="mt-4 max-w-5xl">
      <PortTabs tab={tab} onChange={setTab} />
      {tab === "export" ? (
        <div className="mt-4">
          <ExportPanel />
        </div>
      ) : headers.length === 0 ? (
        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_320px]">
          <label className="flex min-h-[360px] cursor-pointer flex-col rounded-[24px] border border-edge bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[.05em] text-primary-dark">
                CSV import
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-[.08em] text-subtle">
                Monarch or any bank
              </span>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center text-center">
              <span className="flex h-[68px] w-[68px] items-center justify-center rounded-[18px] bg-track text-muted">
                <FileUp size={30} strokeWidth={1.8} />
              </span>
              <div className="mt-5 text-[26px] font-bold tracking-[-.03em] text-ink">
                Drop in a statement and review it before import
              </div>
              <div className="mt-2 max-w-[34rem] text-[14px] font-medium leading-relaxed text-muted">
                Sprout detects Monarch exports automatically and lets you map any other bank CSV
                without leaving the page.
              </div>
              <span className="mt-6 rounded-[12px] bg-primary px-5 py-3 text-[13px] font-semibold text-onprimary">
                Browse CSV files
              </span>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <UploadHint
                title="Monarch-ready"
                body="Preset mapping when Sprout recognizes the file."
              />
              <UploadHint
                title="Preview first"
                body="Check merchants, dates, and signed amounts before import."
              />
              <UploadHint
                title="Re-import safely"
                body="Duplicate rows are skipped automatically."
              />
            </div>

            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>

          <div className="grid gap-4">
            <InfoPanel title="How it works">
              <StepRow
                step="1"
                title="Upload a CSV"
                body="Start with Monarch or any statement export from your bank."
              />
              <StepRow
                step="2"
                title="Confirm the mapping"
                body="Use the preset or adjust date, merchant, amount, and category columns."
              />
              <StepRow
                step="3"
                title="Import with confidence"
                body="Preview the rows first, then bring them into Transactions in one pass."
              />
            </InfoPanel>

            <InfoPanel title="Smart import">
              <CapabilityRow
                icon={<Landmark size={16} strokeWidth={2} />}
                title="Any bank or Monarch"
                body="Use the preset, or map any bank’s CSV columns yourself."
              />
              <CapabilityRow
                icon={<Sparkles size={16} strokeWidth={2} />}
                title="AI categorization"
                body="Claude fills in leftover merchants and caches results per merchant."
              />
              <CapabilityRow
                icon={<SlidersHorizontal size={16} strokeWidth={2} />}
                title="Flexible amounts"
                body="Signed, debit/credit, and inflow/outflow formats are all supported."
              />
              <CapabilityRow
                icon={<ShieldCheck size={16} strokeWidth={2} />}
                title="Duplicate-safe"
                body="Re-import the same file anytime without creating duplicate rows."
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
                  {rowCount} rows detected
                </div>
              </div>
              <button
                type="button"
                onClick={reset}
                className="rounded-[10px] border border-edge px-3 py-2 text-[12px] font-semibold text-muted transition hover:border-soft-border hover:text-ink"
              >
                Remove
              </button>
            </div>

            <div className="rounded-[18px] border border-edge bg-card p-[18px]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[.08em] text-muted">
                    Mapping
                  </div>
                  <div className="mt-1 text-[18px] font-bold tracking-[-.02em] text-ink">
                    Review how this file should import
                  </div>
                </div>
                <div className="text-[12px] font-medium text-muted">
                  {preview.length > 0
                    ? `${preview.length} rows in preview`
                    : "Preview updates automatically"}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(["monarch", "custom"] as Preset[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPreset(p)}
                    className={`rounded-[10px] px-4 py-2 text-[12.5px] font-semibold capitalize ${
                      preset === p ? "bg-primary text-onprimary" : "bg-track text-muted"
                    }`}
                  >
                    {p === "monarch" ? "Monarch preset" : "Custom mapping"}
                  </button>
                ))}
              </div>

              {preset === "custom" && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Select
                    label="Date column"
                    headers={headers}
                    value={custom.date}
                    onChange={(v) => setCustom({ ...custom, date: v })}
                  />
                  <Select
                    label="Merchant column"
                    headers={headers}
                    value={custom.merchant}
                    onChange={(v) => setCustom({ ...custom, merchant: v })}
                  />
                  <div className="col-span-2 flex gap-3">
                    <label className="flex-1">
                      <FieldLabel>Amount format</FieldLabel>
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
                    </label>
                  </div>
                  {custom.amountMode === "signed" && (
                    <Select
                      label="Amount column"
                      headers={headers}
                      value={custom.amountColumn}
                      onChange={(v) => setCustom({ ...custom, amountColumn: v })}
                    />
                  )}
                  {custom.amountMode === "debitCredit" && (
                    <>
                      <Select
                        label="Debit column"
                        headers={headers}
                        value={custom.debitColumn}
                        onChange={(v) => setCustom({ ...custom, debitColumn: v })}
                      />
                      <Select
                        label="Credit column"
                        headers={headers}
                        value={custom.creditColumn}
                        onChange={(v) => setCustom({ ...custom, creditColumn: v })}
                      />
                    </>
                  )}
                  {custom.amountMode === "inflowOutflow" && (
                    <>
                      <Select
                        label="Inflow column"
                        headers={headers}
                        value={custom.inflowColumn}
                        onChange={(v) => setCustom({ ...custom, inflowColumn: v })}
                      />
                      <Select
                        label="Outflow column"
                        headers={headers}
                        value={custom.outflowColumn}
                        onChange={(v) => setCustom({ ...custom, outflowColumn: v })}
                      />
                    </>
                  )}
                  <Select
                    label="Category column (optional)"
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
                  Auto-categorize leftover merchants with AI
                  <span className="block text-[12px] leading-relaxed text-muted">
                    Claude is cached per merchant, so it&rsquo;s usually a one-time cleanup cost.
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
                {busy ? "Importing…" : "Import transactions"}
              </button>

              {result && (
                <div className="mt-4 rounded-[14px] bg-primary-soft p-4 text-[13px] font-medium text-green">
                  Imported {result.imported} transactions · {result.excluded} internal moves
                  excluded ·{" "}
                  {result.aiCategorized > 0 ? `${result.aiCategorized} AI-categorized · ` : ""}
                  {result.reconciled > 0
                    ? `${result.reconciled} already captured (skipped) · `
                    : ""}
                  {result.uncategorized} uncategorized.{" "}
                  <button
                    type="button"
                    onClick={() => set({ webView: "transactions" })}
                    className="underline"
                  >
                    View transactions ›
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
                    Preview
                  </div>
                  <div className="mt-1 text-[17px] font-bold tracking-[-.02em] text-ink">
                    First imported rows
                  </div>
                </div>
                <div className="text-[12px] font-medium text-muted">{preview.length} shown</div>
              </div>

              <div className="mt-4 overflow-hidden rounded-[16px] border border-edge">
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
                      {formatMoney(r.amountCents, { signed: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <InfoPanel title="Preview">
              <div className="rounded-[14px] border border-edge bg-track/30 p-4">
                <div className="text-[13px] font-semibold text-ink">Preview appears here</div>
                <p className="mt-1.5 text-[12.5px] font-medium leading-relaxed text-muted">
                  Pick the right columns and Sprout will show sample rows before you import them.
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
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value="">{optional ? "— none —" : "— select —"}</option>
        {headers.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
    </label>
  );
}
