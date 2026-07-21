import { describe, expect, it } from "vitest";
import { FIXTURES } from "../__fixtures__";
import { buildImportRows } from "../pipeline";
import { preflight } from "../preflight";
import { parseCsv, readCsv } from "../read-csv";
import { detectPreset, getPreset, verifyPresetHeaders, PRESETS } from "./index";

describe("preset registry", () => {
  it("exposes each preset by id and rejects unknown ids", () => {
    for (const p of PRESETS) expect(getPreset(p.id)?.id).toBe(p.id);
    expect(getPreset("nope")).toBeUndefined();
  });

  it("verifies uploaded headers against the selected preset", () => {
    const monarch = getPreset("monarch")!;
    expect(verifyPresetHeaders(monarch, ["Date", "Merchant", "Amount", "Category"])).toBe(true);
    expect(verifyPresetHeaders(monarch, ["date", "merchant", "amount"])).toBe(true); // case-insensitive
    expect(verifyPresetHeaders(monarch, ["Date", "Payee", "Outflow", "Inflow"])).toBe(false);
  });
});

describe("scored detection", () => {
  it("falls back to Custom for a generic bank export (required met, 0 distinctive)", () => {
    // Date/Merchant/Amount satisfies Monarch's required set but matches no
    // distinctive fields, so it must not be claimed as Monarch.
    expect(detectPreset(["Date", "Merchant", "Amount"])).toEqual({
      presetId: "custom",
      confidence: "ambiguous",
    });
  });

  it("returns Custom when no preset is even eligible", () => {
    expect(detectPreset(["When", "Who", "HowMuch"])).toEqual({
      presetId: "custom",
      confidence: "none",
    });
  });

  it("detects each source from its fixture headers at high confidence", () => {
    for (const f of FIXTURES) {
      const headers = (parseCsv(f.csv)[0] ?? []).map((h) => h.trim());
      expect(detectPreset(headers, f.filename)).toEqual(f.manifest.detect);
    }
  });
});

describe("fixture preflight + pipeline totals", () => {
  for (const f of FIXTURES) {
    describe(f.preset, () => {
      const preset = getPreset(f.preset)!;
      const records = readCsv(f.csv);

      it("matches the expected preflight totals", () => {
        const detection = { presetId: preset.id, confidence: "high" as const };
        const pf = preflight(records, preset.mapping, preset.categoryMap, detection);
        expect(pf.totalRows).toBe(f.manifest.totalRows);
        expect(pf.validRows).toBe(f.manifest.validRows);
        expect(pf.invalidRows.length).toBe(f.manifest.invalidRows);
        expect(pf.amountTotalCents).toBe(f.manifest.amountTotalCents);
        expect(pf.unmatchedCategories).toBe(f.manifest.unmatchedCategories);
      });

      it("builds rows with the expected excluded count and signed total", () => {
        const rows = buildImportRows(records, preset.mapping);
        expect(rows.length).toBe(f.manifest.validRows);
        expect(rows.filter((r) => r.excludeFromBudget).length).toBe(f.manifest.excluded);
        const sum = rows.reduce((acc, r) => acc + r.amountCents, 0);
        expect(sum).toBe(f.manifest.amountTotalCents);
      });

      it("is idempotent — the same file yields the same dedupe keys", () => {
        const a = buildImportRows(records, preset.mapping).map((r) => r.externalId);
        const b = buildImportRows(readCsv(f.csv), preset.mapping).map((r) => r.externalId);
        expect(a).toEqual(b);
        expect(new Set(a).size).toBe(a.length); // no collisions within the file
      });
    });
  }
});
