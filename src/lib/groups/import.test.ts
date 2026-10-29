import { describe, expect, it } from "vitest";
import { groupImportId, parseGroupImport } from "./import";
import { groupImportPreflight } from "./import-preview";
import { sproutTemplateMapping } from "@/lib/import/presets/sprout";
import { readCsv } from "@/lib/import/read-csv";
import { resolveImportSource } from "@/lib/import/request";
const key = "00000000-0000-4000-a000-000000000001";
export const csv =
  "Date,Description,Amount,Source,Transaction Type,Category\n2026-10-01,Market,-120,Bank,Expense,Groceries\n2026-10-02,Salary,200,Bank,Income,\n2026-10-03,Card payment,-20,Bank,Transfer,\n2026-10-04,Return,10,Bank,Reimbursement,\n2026-02-30,Invalid,-5,Bank,Expense,";
const body = () => ({
  csv,
  preset: "sprout",
  revision: 0,
  mutationId: key,
  payerId: key,
  settlement: true,
  aiCategorize: false,
});
describe("group import preparation", () => {
  it("uses the same eligibility for preview and save, rejecting unlinked credits and invalid dates", () => {
    const input = parseGroupImport(body());
    expect(input.rows.map((r) => r.merchant)).toEqual(["Market", "Salary"]);
    expect(input.skipped).toBe(3);
    const preview = groupImportPreflight(
      readCsv(csv),
      sproutTemplateMapping,
      {},
      { presetId: "sprout", confidence: "high" },
    );
    expect(preview.validRows).toBe(input.rows.length);
    expect(preview.totalRows - preview.validRows).toBe(input.skipped);
    expect(preview.invalidRows).toHaveLength(3);
  });
  it("deduplicates within a group and payer while preserving occurrence identity", () => {
    const input = parseGroupImport(body());
    const external = input.rows[0].externalId;
    expect(groupImportId("g", "p", external)).toBe(groupImportId("g", "p", external));
    expect(groupImportId("g", "p", external)).not.toBe(groupImportId("g2", "p", external));
    expect(groupImportId("g", "p", external)).not.toBe(groupImportId("g", null, external));
    const repeated = parseGroupImport({
      ...body(),
      csv: csv + "\n2026-10-01,Market,-120,Bank,Expense,Groceries",
    });
    expect(repeated.rows[0].externalId).not.toBe(repeated.rows[2].externalId);
  });
  it("rejects malformed mappings, unsupported sources, money overflow, and missing payer", () => {
    expect(() => resolveImportSource({ csv, mapping: { date: { column: 42 } } })).toThrow();
    expect(() => parseGroupImport({ ...body(), preset: "nope" })).toThrow();
    expect(() => parseGroupImport({ ...body(), payerId: undefined })).toThrow();
    expect(() =>
      parseGroupImport({
        ...body(),
        csv: csv.split("\n")[0] + "\n2026-10-01,Overflow,-21474836.48,Bank,Expense,",
      }),
    ).toThrow();
  });
});
