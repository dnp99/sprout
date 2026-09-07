"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { applyMapping } from "@/lib/import/apply-mapping";
import {
  PRESET_OPTIONS,
  detectPreset,
  getPreset,
  type DetectionResult,
  type PresetId,
} from "@/lib/import/presets";
import { preflight, type ImportPreflight } from "@/lib/import/preflight";
import { parseCsv, readCsv } from "@/lib/import/read-csv";
import type { AmountMapping, ImportMapping, ImportSummary } from "@/lib/import/types";
import { useStore } from "@/state/store";

/** A chosen import source: a registry preset id, or the manual column mapper. */
export type Preset = PresetId | "custom";
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
  incomeSource: string;
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
  incomeSource: "",
};

/** Source picker options: every registry preset, then the manual mapper. */
export const PRESET_PICKER: readonly Preset[] = [...PRESET_OPTIONS.map((o) => o.id), "custom"];

/** Shared CSV-import state + actions used by the web and mobile Import screens.
 *  Wraps the pure import lib (parse → detect → map → preflight → preview) and the
 *  POST /api/import call, then refreshes the store on success. */
export function useImport() {
  const refresh = useStore((s) => s.refresh);
  const categories = useStore((s) => s.categories);
  const categoryNames = useMemo(() => categories.map((category) => category.name), [categories]);
  const t = useTranslations("importer");
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [preset, setPreset] = useState<Preset>("custom");
  const [detection, setDetection] = useState<DetectionResult | null>(null);
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
    const result = detectPreset(detected, file.name);
    setFileName(file.name);
    setCsvText(text);
    setHeaders(detected);
    setResult(null);
    setError("");
    setCustom(EMPTY_CUSTOM);
    setDetection(result);
    // High-confidence detection selects the source; otherwise fall to the mapper.
    setPreset(result.confidence === "high" ? result.presetId : "custom");
  }

  const categoryMap = useMemo(
    () => (preset === "custom" ? {} : (getPreset(preset)?.categoryMap ?? {})),
    [preset],
  );

  const mapping: ImportMapping | null = useMemo(
    () => (preset === "custom" ? buildCustomMapping(custom) : (getPreset(preset)?.mapping ?? null)),
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

  /** Validation summary shown before import: valid/invalid counts, amount total,
   *  and unmatched categories. Recomputed when the file or mapping changes. */
  const validation: ImportPreflight | null = useMemo(() => {
    if (!csvText || !mapping) return null;
    try {
      return preflight(
        readCsv(csvText),
        mapping,
        categoryMap,
        {
          presetId: preset,
          confidence: detection?.confidence ?? "none",
        },
        categoryNames,
      );
    } catch {
      return null;
    }
  }, [csvText, mapping, categoryMap, preset, detection, categoryNames]);

  /** Total meaningful data rows (excluding header and blank spreadsheet padding). */
  const rowCount = useMemo(() => (csvText ? readCsv(csvText).length : 0), [csvText]);

  async function doImport() {
    if (!mapping) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          preset === "custom"
            ? { csv: csvText, mapping, aiCategorize }
            : { csv: csvText, preset, aiCategorize },
        ),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? t("importFailed"));
      setResult(body as ImportSummary);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("importFailed"));
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFileName("");
    setCsvText("");
    setHeaders([]);
    setPreset("custom");
    setDetection(null);
    setCustom(EMPTY_CUSTOM);
    setResult(null);
    setError("");
  }

  return {
    fileName,
    headers,
    preset,
    setPreset,
    detection,
    presetOptions: PRESET_OPTIONS,
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
  } else if (c.amountMode === "inflowOutflow") {
    if (!c.inflowColumn || !c.outflowColumn) return null;
    amount = {
      mode: "inflowOutflow",
      inflowColumn: c.inflowColumn,
      outflowColumn: c.outflowColumn,
    };
  } else {
    // The manual mapper only exposes the three column-based modes; signedByType
    // is preset-only. Guard so an unexpected mode can't build a broken mapping.
    return null;
  }
  return {
    name: "Custom",
    date: { column: c.date },
    merchant: { column: c.merchant },
    amount,
    category: c.category ? { column: c.category } : undefined,
    incomeSource: c.incomeSource ? { column: c.incomeSource } : undefined,
  };
}
