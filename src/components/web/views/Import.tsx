"use client";

import { FileUp, Landmark, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";
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
    onFile,
    doImport,
  } = useImport();

  return (
    <div className="mt-4 max-w-3xl">
      <PortTabs tab={tab} onChange={setTab} />
      {tab === "export" ? (
        <div className="mt-4">
          <ExportPanel />
        </div>
      ) : (
        <div className="mt-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-[16px] border-[1.5px] border-dashed border-edge bg-card px-5 py-14 text-center">
            <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[16px] bg-track text-muted">
              <FileUp size={28} strokeWidth={1.8} />
            </span>
            <div className="mt-[18px] text-[17px] font-bold text-ink">
              {fileName || "Choose a CSV file to import"}
            </div>
            <div className="mt-1.5 text-[13px] font-medium text-muted">
              Monarch, or any bank export (you map the columns)
            </div>
            <span className="mt-5 rounded-[10px] bg-primary px-5 py-2.5 text-[13px] font-semibold text-onprimary">
              Browse files
            </span>
            <input
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>

          {/* Feature showcase — only before a file is chosen; once headers load,
              the mapping UI below takes over. Highlights what the pipeline does. */}
          {headers.length === 0 && (
            <div className="mt-6">
              <div className="text-[11px] font-bold uppercase tracking-[.08em] text-subtle">
                Smart import
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <FeatureCard
                  icon={<Landmark size={17} strokeWidth={2} />}
                  title="Any bank or Monarch"
                  body="Use the Monarch preset, or map any bank’s CSV columns yourself."
                />
                <FeatureCard
                  icon={<Sparkles size={17} strokeWidth={2} />}
                  title="AI categorization"
                  body="Claude sorts leftover merchants into categories — cached per merchant, so it’s a one-time cost."
                />
                <FeatureCard
                  icon={<SlidersHorizontal size={17} strokeWidth={2} />}
                  title="Flexible amounts"
                  body="Signed, debit/credit, or inflow/outflow amount columns all work."
                />
                <FeatureCard
                  icon={<ShieldCheck size={17} strokeWidth={2} />}
                  title="Duplicate-safe"
                  body="Re-import the same statement anytime — already-imported rows are skipped."
                />
              </div>
            </div>
          )}

          {headers.length > 0 && (
            <div className="mt-4 rounded-[14px] border border-edge bg-card p-[16px_18px]">
              <div className="mb-3 flex gap-2">
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
                <div className="grid grid-cols-2 gap-3">
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

              {preview.length > 0 && (
                <div className="mt-4">
                  <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted">
                    Preview
                  </div>
                  <div className="rounded-[14px] border border-edge">
                    {preview.map((r, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between border-b border-edge px-4 py-2 text-[13px] last:border-0"
                      >
                        <span className="font-semibold text-ink">{r.merchant || "—"}</span>
                        <span className="text-muted">{r.occurredAt}</span>
                        <span
                          className={`font-semibold tabular-nums ${r.amountCents >= 0 ? "text-green" : "text-ink"}`}
                        >
                          {formatMoney(r.amountCents, { signed: true })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <label className="mt-4 flex cursor-pointer items-center gap-2 text-[13px] font-medium text-ink">
                <input
                  type="checkbox"
                  checked={aiCategorize}
                  onChange={(e) => setAiCategorize(e.target.checked)}
                  className="h-4 w-4 accent-primary"
                />
                <span>
                  Auto-categorize leftover merchants with AI
                  <span className="ml-1 text-muted">(Claude — cached per merchant)</span>
                </span>
              </label>

              {error && (
                <div className="mt-3 text-[13px] font-medium text-primary-dark">{error}</div>
              )}

              <button
                type="button"
                onClick={doImport}
                disabled={busy || !mapping || preview.length === 0}
                className="mt-4 rounded-[10px] bg-primary px-5 py-3 text-[14px] font-semibold text-onprimary disabled:opacity-50"
              >
                {busy ? "Importing…" : "Import transactions"}
              </button>

              {result && (
                <div className="mt-4 rounded-[14px] bg-primary-soft p-4 text-[13px] font-medium text-green">
                  ✅ Imported {result.imported} transactions · {result.excluded} internal moves
                  excluded ·{" "}
                  {result.aiCategorized > 0 ? `${result.aiCategorized} AI-categorized · ` : ""}
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
          )}
        </div>
      )}
    </div>
  );
}

/** One capability tile in the pre-file "Smart import" showcase. */
function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[14px] border border-edge p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-track text-primary">
        {icon}
      </span>
      <div className="mt-3 text-[13.5px] font-bold text-ink">{title}</div>
      <div className="mt-1 text-[12.5px] font-medium leading-relaxed text-muted">{body}</div>
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
