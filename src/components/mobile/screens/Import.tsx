"use client";

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
  const { goMobile, set } = useStore();
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
    <div className="px-[22px] pt-3">
      <ScreenHeader title="Import / export" onBack={() => goMobile("settings")} />

      <div className="mt-3 flex justify-center">
        <PortTabs tab={tab} onChange={setTab} />
      </div>

      {tab === "export" ? (
        <div className="mt-4">
          <ExportPanel />
        </div>
      ) : result ? (
        <div className="mt-4 flex flex-col items-center rounded-[22px] bg-card px-5 py-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e4ebd6] text-3xl">
            🎉
          </span>
          <div className="mt-3.5 text-[17px] font-extrabold text-ink">Import complete</div>
          <div className="mt-1.5 text-[12.5px] font-semibold leading-relaxed text-muted">
            {result.imported} transactions added · {result.excluded} internal moves excluded
            {result.aiCategorized > 0 ? ` · ${result.aiCategorized} AI-categorized` : ""} ·{" "}
            {result.uncategorized} uncategorized
          </div>
          <button
            type="button"
            onClick={() => goMobile("history")}
            className="mt-5 rounded-2xl bg-primary px-6 py-3 text-[13.5px] font-extrabold text-white"
          >
            View activity
          </button>
          <button
            type="button"
            onClick={reset}
            className="mt-2.5 text-[13px] font-extrabold text-primary-dark"
          >
            Import another
          </button>
        </div>
      ) : !fileName ? (
        /* Upload */
        <>
          <label className="mt-4 flex cursor-pointer flex-col items-center rounded-[22px] border-2 border-dashed border-edge bg-[#faf4ea] px-5 py-9 text-center">
            <span className="text-4xl">📤</span>
            <div className="mt-2.5 text-[15px] font-extrabold text-ink">Upload a CSV</div>
            <div className="mt-1 text-xs font-semibold text-muted">
              From your bank or another budgeting app
            </div>
            <span className="mt-3.5 rounded-xl border border-[#e3d8c6] bg-card px-5 py-2.5 text-[13px] font-extrabold text-primary-dark">
              Choose file
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          <p className="mt-3.5 text-center text-[11.5px] font-semibold leading-relaxed text-muted">
            Monarch exports are detected automatically; other banks let you map the columns.
          </p>
        </>
      ) : (
        /* Map + preview */
        <>
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-edge bg-[#faf4ea] px-4 py-3">
            <span className="text-[22px]">📄</span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13.5px] font-extrabold text-ink">{fileName}</div>
              <div className="text-[11.5px] font-semibold text-muted">{rowCount} rows detected</div>
            </div>
            <button type="button" onClick={reset} className="text-[12px] font-extrabold text-muted">
              Remove
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            {(["monarch", "custom"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`rounded-full px-4 py-2 text-[12.5px] font-bold ${
                  preset === p ? "bg-primary text-white" : "bg-track text-muted"
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

          {preview.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-muted">
                Preview
              </div>
              <div className="rounded-2xl border border-edge bg-card">
                {preview.slice(0, 4).map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 border-b border-[#f7efe3] px-4 py-2.5 text-[12.5px] last:border-0"
                  >
                    <span className="w-[70px] shrink-0 font-semibold text-muted">
                      {r.occurredAt}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-bold text-ink">
                      {r.merchant || "—"}
                    </span>
                    <span
                      className={`font-extrabold tabular-nums ${
                        r.amountCents >= 0 ? "text-[#4f7a3a]" : "text-ink"
                      }`}
                    >
                      {formatMoney(r.amountCents, { signed: true })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px] font-bold text-ink">
            <input
              type="checkbox"
              checked={aiCategorize}
              onChange={(e) => setAiCategorize(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            <span>Auto-categorize leftovers with AI</span>
          </label>

          {error && <div className="mt-3 text-[13px] font-semibold text-primary-dark">{error}</div>}

          <button
            type="button"
            onClick={doImport}
            disabled={busy || !mapping || preview.length === 0}
            className="mt-4 w-full rounded-2xl bg-green py-3.5 text-[15px] font-extrabold text-white disabled:opacity-50"
          >
            {busy ? "Importing…" : `Import ${rowCount} transactions`}
          </button>
          <button
            type="button"
            onClick={reset}
            className="mt-2.5 w-full text-center text-[13px] font-extrabold text-muted"
          >
            Cancel
          </button>
        </>
      )}
    </div>
  );
}

const selectClass =
  "w-full rounded-xl border border-track bg-card px-3 py-2.5 text-[13px] font-semibold text-ink outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-extrabold uppercase tracking-wide text-muted">{label}</span>
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
