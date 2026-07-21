/** The one source of truth for import presets. The API, CLI, and both import
 *  views resolve presets through here — no hardcoded per-source branches. */

import { normalizeHeader } from "../read-csv";
import { goodbudgetPreset } from "./goodbudget";
import { mintPreset } from "./mint";
import { monarchPreset } from "./monarch";
import type { ImportPreset, PresetId } from "./types";
import { ynabPreset } from "./ynab";

export type { ImportPreset, PresetId } from "./types";

/** Registry, in preferred detection order (order only matters for stable
 *  presentation; detection itself is score-based). Add a source here once its
 *  fixture suite passes. */
export const PRESETS: readonly ImportPreset[] = [
  monarchPreset,
  ynabPreset,
  goodbudgetPreset,
  mintPreset,
];

const BY_ID = new Map<PresetId, ImportPreset>(PRESETS.map((p) => [p.id, p]));

/** Client-safe metadata for building the source picker (no server behavior). */
export const PRESET_OPTIONS: readonly { id: PresetId; label: string }[] = PRESETS.map((p) => ({
  id: p.id,
  label: p.label,
}));

/** Look up a preset by id. The server rejects unknown ids before importing. */
export function getPreset(id: string): ImportPreset | undefined {
  return BY_ID.get(id as PresetId);
}

/** True when every required header of the preset is present in the file — the
 *  server's independent check that the upload matches the selected preset. */
export function verifyPresetHeaders(preset: ImportPreset, headers: string[]): boolean {
  const present = new Set(headers.map(normalizeHeader));
  return preset.detection.requiredHeaders.every((h) => present.has(normalizeHeader(h)));
}

export interface DetectionResult {
  presetId: PresetId | "custom";
  confidence: "high" | "ambiguous" | "none";
}

/** Score headers against every preset and pick the best.
 *  - eligible = all required headers present (normalized);
 *  - score = number of matched distinctive headers;
 *  - high confidence needs a unique top scorer with ≥1 distinctive match and a
 *    margin ≥1 over the runner-up; a tie or zero-distinctive top is ambiguous;
 *  - a filename hint only breaks an otherwise-exact tie.
 *  Ambiguous / no eligible preset → Custom, so we never guess a mapping. */
export function detectPreset(headers: string[], filename?: string): DetectionResult {
  const present = new Set(headers.map(normalizeHeader));
  const file = (filename ?? "").toLowerCase();

  const scored = PRESETS.filter((p) =>
    p.detection.requiredHeaders.every((h) => present.has(normalizeHeader(h))),
  )
    .map((p) => ({
      preset: p,
      score: p.detection.distinctiveHeaders.filter((h) => present.has(normalizeHeader(h))).length,
      filenameHit: (p.detection.filenameHints ?? []).some((hint) => file.includes(hint)),
    }))
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return { presetId: "custom", confidence: "none" };

  const top = scored[0];
  if (top.score === 0) return { presetId: "custom", confidence: "ambiguous" };

  const runnerUp = scored[1]?.score ?? -1;
  if (top.score - runnerUp >= 1) {
    return { presetId: top.preset.id, confidence: "high" };
  }

  // Tie on score: a filename hint on exactly one tied preset breaks it.
  const tied = scored.filter((s) => s.score === top.score);
  const hinted = tied.filter((s) => s.filenameHit);
  if (hinted.length === 1) return { presetId: hinted[0].preset.id, confidence: "high" };

  return { presetId: "custom", confidence: "ambiguous" };
}
