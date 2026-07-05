"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { applyMapping } from "@/lib/import/apply-mapping";
import { monarchMapping } from "@/lib/import/presets/monarch";
import { parseCsv, readCsv } from "@/lib/import/read-csv";
import type { AmountMapping, ImportMapping } from "@/lib/import/types";
import { useStore } from "@/state/store";

type Preset = "monarch" | "custom";
type AmountMode = AmountMapping["mode"];

interface CustomState {
  date: string;
  merchant: string;
  amountMode: AmountMode;
  amountColumn: string;
  debitColumn: string;
  creditColumn: string;
  inflowColumn: string;
  outflowColumn: string;
  category: string;
  account: string;
}

const EMPTY: CustomState = {
  date: "",
  merchant: "",
  amountMode: "signed",
  amountColumn: "",
  debitColumn: "",
  creditColumn: "",
  inflowColumn: "",
  outflowColumn: "",
  category: "",
  account: "",
};

const MONARCH_HEADERS = ["Date", "Merchant", "Amount"];

interface Summary {
  imported: number;
  excluded: number;
  uncategorized: number;
  accounts: number;
  aiCategorized: number;
}

export function Import() {
  const { refresh, set } = useStore();
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [preset, setPreset] = useState<Preset>("monarch");
  const [custom, setCustom] = useState<CustomState>(EMPTY);
  const [result, setResult] = useState<Summary | null>(null);
  const [aiCategorize, setAiCategorize] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    const detected = (rows[0] ?? []).map((h) => h.trim());
    setFileName(file.name);
    setCsvText(text);
    setHeaders(detected);
    setResult(null);
    setError("");
    setPreset(MONARCH_HEADERS.every((h) => detected.includes(h)) ? "monarch" : "custom");
  }

  const mapping: ImportMapping | null = useMemo(
    () => (preset === "monarch" ? monarchMapping : buildCustomMapping(custom)),
    [preset, custom],
  );

  const preview = useMemo(() => {
    if (!csvText || !mapping) return [];
    try {
      return readCsv(csvText)
        .slice(0, 6)
        .map((r) => applyMapping(r, mapping))
        .filter((r) => r.merchant);
    } catch {
      return [];
    }
  }, [csvText, mapping]);

  async function doImport() {
    if (!mapping) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          preset === "monarch"
            ? { csv: csvText, preset, aiCategorize }
            : { csv: csvText, mapping, aiCategorize },
        ),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Import failed.");
      setResult(body as Summary);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-[20px] border-2 border-dashed border-edge bg-card py-10 text-center">
        <div className="text-3xl">📄</div>
        <div className="mt-2 text-sm font-extrabold text-ink">
          {fileName || "Choose a CSV file to import"}
        </div>
        <div className="mt-1 text-xs font-semibold text-muted">
          Monarch, or any bank export (you map the columns)
        </div>
        <input
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
      </label>

      {headers.length > 0 && (
        <div className="mt-4 rounded-[20px] bg-card p-6">
          <div className="mb-3 flex gap-2">
            {(["monarch", "custom"] as Preset[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`rounded-full px-4 py-2 text-[12.5px] font-bold capitalize ${
                  preset === p ? "bg-primary text-white" : "bg-track text-muted"
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
              <Select
                label="Account column (optional)"
                headers={headers}
                value={custom.account}
                onChange={(v) => setCustom({ ...custom, account: v })}
                optional
              />
            </div>
          )}

          {preview.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-xs font-extrabold uppercase text-muted">Preview</div>
              <div className="rounded-2xl border border-track">
                {preview.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-[#f7efe3] px-4 py-2 text-[13px] last:border-0"
                  >
                    <span className="font-bold text-ink">{r.merchant || "—"}</span>
                    <span className="text-muted">{r.occurredAt}</span>
                    <span
                      className={`font-extrabold tabular-nums ${r.amountCents >= 0 ? "text-[#4f7a3a]" : "text-ink"}`}
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
            <span>
              Auto-categorize leftover merchants with AI
              <span className="ml-1 font-semibold text-muted">(Claude — cached per merchant)</span>
            </span>
          </label>

          {error && <div className="mt-3 text-[13px] font-semibold text-primary-dark">{error}</div>}

          <button
            type="button"
            onClick={doImport}
            disabled={busy || !mapping || preview.length === 0}
            className="mt-4 rounded-2xl bg-primary px-5 py-3 text-[14px] font-extrabold text-white disabled:opacity-50"
          >
            {busy ? "Importing…" : "Import transactions"}
          </button>

          {result && (
            <div className="mt-4 rounded-2xl bg-[#e4ebd6] p-4 text-[13px] font-bold text-[#4f7a3a]">
              ✅ Imported {result.imported} transactions · {result.excluded} internal moves excluded
              · {result.aiCategorized > 0 ? `${result.aiCategorized} AI-categorized · ` : ""}
              {result.uncategorized} uncategorized · {result.accounts} account(s).{" "}
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
  );
}

function buildCustomMapping(c: CustomState): ImportMapping | null {
  if (!c.date || !c.merchant) return null;
  let amount: AmountMapping;
  if (c.amountMode === "signed") {
    if (!c.amountColumn) return null;
    amount = { mode: "signed", column: c.amountColumn };
  } else if (c.amountMode === "debitCredit") {
    if (!c.debitColumn || !c.creditColumn) return null;
    amount = { mode: "debitCredit", debitColumn: c.debitColumn, creditColumn: c.creditColumn };
  } else {
    if (!c.inflowColumn || !c.outflowColumn) return null;
    amount = {
      mode: "inflowOutflow",
      inflowColumn: c.inflowColumn,
      outflowColumn: c.outflowColumn,
    };
  }
  return {
    name: "Custom",
    date: { column: c.date },
    merchant: { column: c.merchant },
    amount,
    category: c.category ? { column: c.category } : undefined,
    account: c.account ? { column: c.account } : undefined,
  };
}

const selectClass =
  "mt-1 w-full rounded-xl border border-track bg-card px-3 py-2 text-[13px] font-semibold text-ink outline-none";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] font-extrabold uppercase text-muted">{children}</span>;
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
