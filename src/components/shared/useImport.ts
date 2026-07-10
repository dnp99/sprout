"use client";

import { useMemo, useState } from "react";
import { applyMapping } from "@/lib/import/apply-mapping";
import { monarchMapping } from "@/lib/import/presets/monarch";
import { parseCsv, readCsv } from "@/lib/import/read-csv";
import type { AmountMapping, ImportMapping, ImportSummary } from "@/lib/import/types";
import { useStore } from "@/state/store";

export type Preset = "monarch" | "custom";
export type AmountMode = AmountMapping["mode"];

export interface CustomState {
  date: string;
  merchant: string;
  amountMode: AmountMode;
  amountColumn: string;
  debitColumn: string;
  creditColumn: string;
  inflowColumn: string;
  outflowColumn: string;
  category: string;
}

export const EMPTY_CUSTOM: CustomState = {
  date: "",
  merchant: "",
  amountMode: "signed",
  amountColumn: "",
  debitColumn: "",
  creditColumn: "",
  inflowColumn: "",
  outflowColumn: "",
  category: "",
};

const MONARCH_HEADERS = ["Date", "Merchant", "Amount"];

/** Shared CSV-import state + actions used by the web and mobile Import screens.
 *  Wraps the pure import lib (parse → map → preview) and the POST /api/import
 *  call, then refreshes the store on success. UI/navigation stays in the views. */
export function useImport() {
  const refresh = useStore((s) => s.refresh);
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [preset, setPreset] = useState<Preset>("monarch");
  const [custom, setCustom] = useState<CustomState>(EMPTY_CUSTOM);
  const [result, setResult] = useState<ImportSummary | null>(null);
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
    setCustom(EMPTY_CUSTOM);
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

  /** Total data rows in the file (excluding the header). */
  const rowCount = useMemo(
    () => (csvText ? Math.max(0, parseCsv(csvText).length - 1) : 0),
    [csvText],
  );

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
      setResult(body as ImportSummary);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFileName("");
    setCsvText("");
    setHeaders([]);
    setPreset("monarch");
    setCustom(EMPTY_CUSTOM);
    setResult(null);
    setError("");
  }

  return {
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
  };
}

export function buildCustomMapping(c: CustomState): ImportMapping | null {
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
  };
}
