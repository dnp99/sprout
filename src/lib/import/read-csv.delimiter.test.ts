import { describe, expect, it } from "vitest";
import { detectDelimiter, normalizeHeader, parseCsv, readCsv, stripBom } from "./read-csv";

describe("delimiter detection + BOM", () => {
  it("detects comma vs tab from the header line", () => {
    expect(detectDelimiter("a,b,c\n1,2,3")).toBe(",");
    expect(detectDelimiter("a\tb\tc\n1\t2\t3")).toBe("\t");
  });

  it("strips a UTF-8 BOM", () => {
    expect(stripBom("﻿Date,Amount")).toBe("Date,Amount");
    const rows = readCsv("﻿Date,Amount\n2026-06-01,-5.00");
    expect(rows[0]).toEqual({ Date: "2026-06-01", Amount: "-5.00" });
  });

  it("parses tab-separated files", () => {
    const rows = readCsv("Date\tPayee\tOutflow\n2026-06-01\tCoffee\t4.50");
    expect(rows[0]).toEqual({ Date: "2026-06-01", Payee: "Coffee", Outflow: "4.50" });
  });

  it("still honors quoting with the detected delimiter", () => {
    const grid = parseCsv('a,b\n"x,y",z');
    expect(grid[1]).toEqual(["x,y", "z"]);
  });

  it("normalizes headers for matching", () => {
    expect(normalizeHeader("  Transaction  Type ")).toBe("transaction type");
  });
});
